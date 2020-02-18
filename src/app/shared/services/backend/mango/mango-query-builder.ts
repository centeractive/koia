import { Sort } from '@angular/material/sort';
import { ArrayUtils } from 'app/shared/utils';
import { PropertyFilter, Column, DataType, Operator } from 'app/shared/model';
import { ValueRangeFilter } from 'app/shared/value-range/model';
import { OperatorConverter } from './operator-converter';

export class MangoQueryBuilder {

   static readonly LIMIT = 1_000_000;

   private operatorConverter = new OperatorConverter();
   private whereCombineOperator: CombineOperator = CombineOperator.AND;
   private fullTextFilter: string;
   private propertyFilters: PropertyFilter[] = [];
   private invertedRangeFilters: ValueRangeFilter[] = [];
   private fields: string[];
   private sort: Sort;

   private pageIndex: number;
   private rowCount: number;

   constructor(private forPouchDB: boolean, private columns: Column[]) { }

   combineWhereWith(whereCombineOperator: CombineOperator): MangoQueryBuilder {
      this.whereCombineOperator = whereCombineOperator;
      return this;
   }

   whereAnyText(fullTextFilter: string): MangoQueryBuilder {
      this.fullTextFilter = fullTextFilter;
      return this;
   }

   where(name: string, operator: Operator, filterValue: any, dataType?: DataType): MangoQueryBuilder {
      this.propertyFilters.push(new PropertyFilter(name, operator, filterValue, dataType));
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

   containsFilter() {
      return this.fullTextFilter || this.propertyFilters.length > 0 || this.invertedRangeFilters.length > 0;
   }

   toQuery(): Object {
      const query = {};
      this.appendSelector(query);
      this.appendFields(query);
      this.appendSort(query);
      this.appendPaging(query);
      this.appendRowCount(query);
      return query;
   }

   private appendSelector(query: {}): void {
      const selectors = this.propertyFilterSelectors();
      this.appendInvertedRangeFilterSelector(selectors);
      const fullTextFilterSelectors = this.fullTextFilterSelectors();
      if (fullTextFilterSelectors) {
         if (selectors.length === 0) {
            query['selector'] = fullTextFilterSelectors;
            return;
         }
         selectors.push(fullTextFilterSelectors);
      }
      const pouchDBSelectors = this.pouchDBSortSelector();
      if (pouchDBSelectors) {
         if (selectors.length === 0) {
            query['selector'] = pouchDBSelectors;
            return;
         }
         selectors.push(pouchDBSelectors);
      }
      if (selectors.length > 0) {
         query['selector'] = selectors.length === 1 ? selectors[0] : { [this.whereCombineOperator]: selectors };
      }
   }

   private appendInvertedRangeFilterSelector(selectors: Object[]): void {
      for (const filter of this.invertedRangeFilters) {
         const rangeSelectors = filter.toPropertyFilters()
            .map(pf => ({ [pf.name]: { [this.operatorConverter.toMangoOperator(pf.operator)]: this.toSelectorValue(pf) } }));
         selectors.push(rangeSelectors.length === 1 ? rangeSelectors[0] : { $or: rangeSelectors });
      }
   }

   private propertyFilterSelectors(): Object[] {
      const selectors = [];
      this.propertyFilters.forEach(pf => {
         const name = pf.name;
         const operator = this.operatorConverter.toMangoOperator(pf.operator);
         let selector = ArrayUtils.findObjectByKey(selectors, name);
         if (this.forPouchDB && pf.operator === Operator.CONTAINS) {
            if (!selector) {
               selector = { [name]: {} };
               selectors.push(selector);
               selector[name][operator] = this.toCombinedContainsRegExp(pf.name);
            }
         } else {
            if (!selector || selector[name][operator]) {
               selector = { [name]: {} };
               selectors.push(selector);
            }
            selector[name][operator] = this.toSelectorValue(pf);
         }
      });
      return selectors;
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
         return this.toContainsSelectorValue(<string>filters[0].value, false);
      }
      const regex = filters
         .map(pf => '(?=.*' + pf.value + '.*)')
         .join('');
      return new RegExp(regex, 'i');
   }

   private toSelectorValue(propertyFilter: PropertyFilter): any {
      if (propertyFilter.operator === Operator.CONTAINS) {
         return this.toContainsSelectorValue(<string>propertyFilter.value, false);
      } else if (propertyFilter.operator === Operator.EMPTY) {
         return false;
      } else if (propertyFilter.operator === Operator.NOT_EMPTY) {
         return null;
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

   private toInSelectorValue(propertyFilter: PropertyFilter): any[] {
      switch (propertyFilter.dataType) {
         case DataType.NUMBER:
         case DataType.TIME:
            return ArrayUtils.toNumberArray(<string>propertyFilter.value);
         case DataType.BOOLEAN:
            return ArrayUtils.toBooleanArray(<string>propertyFilter.value);
         default:
            return ArrayUtils.toStringArray(<string>propertyFilter.value);
      };
   }

   private fullTextFilterSelectors(): Object {
      if (this.fullTextFilter && this.fullTextFilter !== '') {
         const selectors = [];
         this.columns
            .filter(c => c.dataType === DataType.TEXT)
            .forEach(c => selectors.push({ [c.name]: { $regex: this.toContainsSelectorValue(this.fullTextFilter, false) } }));
         return { $or: selectors };
      }
      return null;
   }

   private toContainsSelectorValue(value: string, matchCase: boolean): any {
      const selector = '.*' + value + '.*';
      if (matchCase) {
         return selector;
      }
      return this.forPouchDB ? new RegExp(selector, 'i') : '(?i)' + selector;
   }

   /**
    * adds the sorted column to the selector (as match any) in case it's not contained already
    * (PouchDB requires the sorted field be part of the selector)
    */
   private pouchDBSortSelector(): Object {
      if (this.forPouchDB && this.sort && !this.propertyFilters.find(f => f.name === this.sort.active)) {
         return {
            [this.sort.active]: { $gte: null }
         };
      }
      return null;
   }

   private appendFields(query: {}): void {
      if (this.fields) {
         query['fields'] = this.fields;
      }
   }

   private appendSort(query: {}): void {
      if (this.sort && this.sort.direction !== '') {
         query['sort'] = [{ [this.sort.active]: this.sort.direction }];
      };
   }

   private appendPaging(query: {}): void {
      if (this.pageIndex > 0) {
         query['skip'] = this.pageIndex * this.rowCount;
      }
   }

   private appendRowCount(query: {}): void {
      query['limit'] = this.rowCount > 0 ? this.rowCount : MangoQueryBuilder.LIMIT;
   }
}

export enum CombineOperator {
   AND = '$and',
   OR = '$or'
}
