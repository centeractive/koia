import { Sort } from '@angular/material/sort';
import * as _ from 'lodash';
import { ArrayUtils } from 'app/shared/utils';
import { PropertyFilter, Column, DataType, Operator } from 'app/shared/model';
import { ValueRangeFilter } from 'app/shared/value-range/model';
import { OperatorConverter } from './operator-converter';
import { PouchDBFilters } from './pouchdb-filters';
import { sanitizeFindQuery } from './mango-query-sanitizer';

type SelectorValue = string | number | boolean | RegExp | string[] | number[] | boolean[];

export class MangoQueryBuilder {

   static readonly LIMIT = 1_000_000;

   private static readonly BOUNDS_OF_OTHER_INCLUSIVENESS: Record<string, string> = { $lt: '$lte', $lte: '$lt', $gt: '$gte', $gte: '$gt' };

   private operatorConverter = new OperatorConverter();
   private fullTextFilter: string;
   private propertyFilters: PropertyFilter[] = [];
   private invertedRangeFilters: ValueRangeFilter[] = [];
   private fields: string[];
   private sort: Sort;

   private pageIndex: number;
   private rowCount: number;

   constructor(private forPouchDB: boolean, private columns: Column[]) { }

   whereAnyText(fullTextFilter: string): MangoQueryBuilder {
      this.fullTextFilter = fullTextFilter;
      return this;
   }

   where(name: string, operator: Operator, filterValue: string | number | boolean, dataType?: DataType, orEmpty = false): MangoQueryBuilder {
      this.propertyFilters.push(new PropertyFilter(name, operator, filterValue, dataType, orEmpty));
      return this;
   }

   whereRangeInverted(valueRangeFilter: ValueRangeFilter): MangoQueryBuilder {
      this.invertedRangeFilters.push(valueRangeFilter);
      return this;
   }

   includeFields(fields: string[]): MangoQueryBuilder {
      this.fields = fields;
      return this;
   }

   sortBy(sort: Sort): MangoQueryBuilder {
      this.sort = sort;
      return this;
   }

   page(index: number, rowCount: number): MangoQueryBuilder {
      this.pageIndex = index;
      this.rowCount = rowCount;
      return this;
   }

   numberOfRows(rowCount: number): MangoQueryBuilder {
      this.rowCount = rowCount;
      return this;
   }

   containsFilter(): boolean {
      return !!this.fullTextFilter || this.propertyFilters.length > 0 || this.invertedRangeFilters.length > 0;
   }

   toQuery(): object {
      const query = {};
      this.appendSelector(query);
      this.appendFields(query);
      this.appendSort(query);
      this.appendPaging(query);
      this.appendRowCount(query);
      return sanitizeFindQuery(query);
   }

   private appendSelector(query: object): void {
      const pouchDBFilters = this.forPouchDB ?
         new PouchDBFilters(this.propertyFilters.filter(pf => !pf.orEmpty), this.invertedRangeFilters) : undefined;
      const filters = pouchDBFilters?.outside ?? this.propertyFilters.filter(pf => !pf.orEmpty);
      const selectors = this.propertyFilterSelectors(filters);
      this.appendInvertedRangeFilterSelector(selectors);
      selectors.push(...this.excludedValuesSelectors(pouchDBFilters));
      selectors.push(...[this.fullTextFilterSelectors(), this.pouchDBSortSelector(filters)].filter(s => s));
      if (selectors.length > 0) {
         query['selector'] = selectors.length === 1 ? selectors[0] : { $and: selectors };
      }
   }

   /**
    * @returns the selectors dropping the rows having a value excluded by a filter matching the rows lacking a value. PouchDB gets a
    * single '$nor' since it cross-multiplies several '$or' and drops the combinations of conditions on the same field. Its '$nor' hence
    * also drops the rows lacking a field (PouchDBFilters#missingFieldNames), the values of the inverted ranges it can't get as
    * property filters, and the rows not matching a double negated filter. CouchDB gets an '$or' per filter since its '$nor' drops the
    * rows lacking the field.
    */
   private excludedValuesSelectors(pouchDBFilters: PouchDBFilters | undefined): object[] {
      const propertyFilters = this.propertyFilters.filter(pf => pf.orEmpty);
      if (pouchDBFilters) {
         const selectors = [
            ...propertyFilters.map(pf => this.excludedPropertyValuesSelector(pf)),
            ...pouchDBFilters.missingFieldNames.map(name => ({ [name]: { $exists: false } })),
            ...pouchDBFilters.norRangeFilters.map(f => this.excludedRangeSelector(f)),
            ...pouchDBFilters.doubleNegated.map(pf => ({ $nor: [this.propertySelector(pf)] }))
         ];
         return selectors.length > 0 ? [{ $nor: selectors }] : [];
      }
      const rangeFilters = this.invertedRangeFilters.filter(f => f.orEmpty);
      return [
         ...propertyFilters.map(pf => this.orEmptySelector(pf.name, [this.propertySelector(pf)])),
         ...rangeFilters.map(f => this.orEmptySelector(f.name, this.rangeSelectors(f)))
      ];
   }

   private orEmptySelector(name: string, selectors: object[]): object {
      return { $or: [{ [name]: { $exists: false } }, ...selectors] };
   }

   private excludedPropertyValuesSelector(filter: PropertyFilter): object {
      const operator = filter.operator === Operator.NONE_OF ? Operator.ANY_OF : Operator.EQUAL;
      return this.propertySelector(new PropertyFilter(filter.name, operator, filter.value, filter.dataType));
   }

   /**
    * @returns the selector of the values the inverted filter excludes, all values if it has no bounds
    */
   private excludedRangeSelector(filter: ValueRangeFilter): object {
      const conditions = new ValueRangeFilter(filter.name, filter.valueRange).toPropertyFilters()
         .map(pf => [this.mangoOperatorOf(pf), this.toSelectorValue(pf)]);
      return { [filter.name]: conditions.length > 0 ? Object.fromEntries(conditions) : { $exists: true } };
   }

   /**
    * appends a selector per inverted range not matching the rows lacking a value, for CouchDB only since PouchDB gets them as
    * property filters or in the '$nor'
    */
   private appendInvertedRangeFilterSelector(selectors: object[]): void {
      if (this.forPouchDB) {
         return;
      }
      for (const filter of this.invertedRangeFilters.filter(f => !f.orEmpty)) {
         selectors.push(this.outsideRangeSelector(filter));
      }
   }

   /**
    * @returns the selector of the values outside of the range, '$in: []' matching no row if the range has no bounds, since CouchDB
    * ignores an empty '$or' combined with other selectors
    */
   private outsideRangeSelector(filter: ValueRangeFilter): object {
      const rangeSelectors = this.rangeSelectors(filter);
      if (rangeSelectors.length === 0) {
         return { [filter.name]: { $in: [] } };
      }
      return rangeSelectors.length === 1 ? rangeSelectors[0] : { $or: rangeSelectors };
   }

   private rangeSelectors(filter: ValueRangeFilter): object[] {
      return filter.toPropertyFilters().map(pf => this.propertySelector(pf));
   }

   private propertySelector(propertyFilter: PropertyFilter): object {
      return { [propertyFilter.name]: { [this.mangoOperatorOf(propertyFilter)]: this.toSelectorValue(propertyFilter) } };
   }

   private mangoOperatorOf(propertyFilter: PropertyFilter): string {
      return this.forPouchDB ? this.operatorConverter.toPouchDBMangoOperator(propertyFilter.operator)
         : this.operatorConverter.toMangoOperator(propertyFilter.operator);
   }

   private propertyFilterSelectors(filters: PropertyFilter[]): object[] {
      const selectors = [];
      filters.forEach(pf => {
         const name = pf.name;
         const operator = this.mangoOperatorOf(pf);
         let selector = ArrayUtils.findObjectByKey(selectors, name);
         if (this.forPouchDB && pf.operator === Operator.CONTAINS) {
            if (!selector) {
               selector = { [name]: {} };
               selectors.push(selector);
            }
            if (!selector[name][operator]) {
               selector[name][operator] = this.toCombinedContainsRegExp(pf.name);
            }
         } else {
            if (!selector || Object.hasOwn(selector[name], operator) || this.hasPouchDBBoundOfOtherInclusiveness(selector[name], operator)) {
               selector = { [name]: {} };
               selectors.push(selector);
            }
            selector[name][operator] = this.toSelectorValue(pf);
         }
      });
      return this.forPouchDB ? selectors.map(s => this.withBoundsLast(s)) : selectors;
   }

   /**
    * @returns the selector with the bounds of its field after its other operators. PouchDB derives the index range from the operators
    * in their order, and any operator other than a bound resets the start of the range: after '$gt' PouchDB then fails on the rows
    * lacking the field, after '$gte' it scans the whole index.
    */
   private withBoundsLast(selector: object): object {
      const [name, matcher] = Object.entries(selector)[0];
      const isBound = (operator: string) => Object.hasOwn(MangoQueryBuilder.BOUNDS_OF_OTHER_INCLUSIVENESS, operator);
      return { [name]: Object.fromEntries(_.sortBy(Object.entries(matcher), ([operator]) => isBound(operator))) };
   }

   /**
    * PouchDB's index range of a selector holding both '$lt' and '$lte' (or '$gt' and '$gte') on a field takes the bound written last,
    * exclusive if either one is. PouchDB merges such bounds correctly only across the selectors of an '$and'.
    */
   private hasPouchDBBoundOfOtherInclusiveness(matcher: object, operator: string): boolean {
      const otherBound = MangoQueryBuilder.BOUNDS_OF_OTHER_INCLUSIVENESS[operator];
      return this.forPouchDB && !!otherBound && Object.hasOwn(matcher, otherBound);
   }

   /**
    * @returns a [[RegExp]] that combines multiple 'contains' filter on the same field or a simple [[RegExp]] if
    * a single 'contains' filter exists
    *
    * This method is used for PouchDB that can't cope with multiple regex on the same field
    */
   private toCombinedContainsRegExp(name: string): RegExp {
      const filters = this.propertyFilters
         .filter(pf => pf.name === name)
         .filter(pf => pf.operator === Operator.CONTAINS)
      if (filters.length === 1) {
         return this.toContainsSelectorValue(filters[0].value as string) as RegExp;
      }
      const regex = filters
         .map(pf => '(?=.*' + _.escapeRegExp(pf.value as string) + '.*)')
         .join('');
      return new RegExp(regex, 'i');
   }

   private toSelectorValue(propertyFilter: PropertyFilter): SelectorValue {
      if (this.forPouchDB && propertyFilter.operator === Operator.NOT_EQUAL) {
         const equalFilter = new PropertyFilter(propertyFilter.name, Operator.EQUAL, propertyFilter.value, propertyFilter.dataType);
         return [this.toSelectorValue(equalFilter)] as SelectorValue;
      }
      if (propertyFilter.operator === Operator.CONTAINS) {
         return this.toContainsSelectorValue(propertyFilter.value as string);
      } else if (propertyFilter.operator === Operator.EMPTY) {
         return false;
      } else if (propertyFilter.operator === Operator.NOT_EMPTY) {
         return this.forPouchDB ? true : null;
      } else if (propertyFilter.operator === Operator.ANY_OF || propertyFilter.operator === Operator.NONE_OF) {
         return this.toInSelectorValue(propertyFilter);
      } else if (propertyFilter.value !== null && propertyFilter.value !== undefined) {
         const column = this.columns.find(c => c.name === propertyFilter.name);
         if (column && (column.dataType === DataType.NUMBER || column.dataType === DataType.TIME)) {
            return Number(propertyFilter.value);
         }
      }
      return propertyFilter.value;
   }

   private toInSelectorValue(propertyFilter: PropertyFilter): string[] | number[] | boolean[] {
      switch (propertyFilter.dataType) {
         case DataType.NUMBER:
         case DataType.TIME:
            return ArrayUtils.toNumberArray(propertyFilter.value as string);
         case DataType.BOOLEAN:
            return ArrayUtils.toBooleanArray(propertyFilter.value as string);
         default:
            return ArrayUtils.toStringArray(propertyFilter.value as string);
      }
   }

   private fullTextFilterSelectors(): object {
      if (!!this.fullTextFilter && this.fullTextFilter !== '') {
         const selectors = [];
         this.columns
            .filter(c => c.dataType === DataType.TEXT)
            .forEach(c => selectors.push({ [c.name]: { $regex: this.toContainsSelectorValue(this.fullTextFilter) } }));
         return { $or: selectors };
      }
      return null;
   }

   private toContainsSelectorValue(value: string): RegExp | string {
      const selector = '.*' + _.escapeRegExp(value) + '.*';
      return this.forPouchDB ? new RegExp(selector, 'i') : '(?i)' + selector;
   }

   /**
    * adds the sorted column to the selector (as match any) in case no filter outside of the '$nor' contains it already
    * (PouchDB requires the sorted field be part of the selector)
    */
   private pouchDBSortSelector(filters: PropertyFilter[]): object {
      if (this.forPouchDB && !!this.sort && !filters.some(f => f.name === this.sort.active)) {
         return {
            [this.sort.active]: { $gte: null }
         };
      }
      return null;
   }

   private appendFields(query: object): void {
      if (this.fields) {
         query['fields'] = this.fields;
      }
   }

   private appendSort(query: object): void {
      if (!!this.sort && this.sort.direction !== '') {
         query['sort'] = [{ [this.sort.active]: this.sort.direction }];
      }
   }

   private appendPaging(query: object): void {
      if (this.pageIndex > 0) {
         query['skip'] = this.pageIndex * this.rowCount;
      }
   }

   private appendRowCount(query: object): void {
      query['limit'] = this.rowCount > 0 ? this.rowCount : MangoQueryBuilder.LIMIT;
   }
}
