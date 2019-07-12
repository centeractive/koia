import { PropertyFilter, Operator, Column, DataType } from 'app/shared/model';
import { Sort } from '@angular/material';
import { ArrayUtils } from 'app/shared/utils';

export class MangoQueryBuilder {

   static readonly LIMIT = 1_000_000;

   private whereCombineOperator: CombineOperator = CombineOperator.AND;
   private fullTextFilter: string;
   private propertyFilters: PropertyFilter[] = [];
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

   where(propertyName: string, operator: Operator, filterValue: any): MangoQueryBuilder {
      this.propertyFilters.push(new PropertyFilter(propertyName, operator, filterValue));
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
      return this.fullTextFilter || this.propertyFilters.length > 0;
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
      const fullTextFilterSelectors = this.fullTextFilterSelectors();
      if (fullTextFilterSelectors) {
         if (selectors) {
            selectors.push(fullTextFilterSelectors);
         } else {
            query['selector'] = fullTextFilterSelectors;
            return;
         }
      }
      const pouchDBSelectors = this.pouchDBSortSelector();
      if (pouchDBSelectors) {
         if (selectors) {
            selectors.push(pouchDBSelectors);
         } else {
            query['selector'] = pouchDBSelectors;
            return;
         }
      }
      if (selectors) {
         query['selector'] = { [this.whereCombineOperator]: selectors };
      }
   }

   private propertyFilterSelectors(): Object[] {
      const selectors = [];
      this.propertyFilters.forEach(pf => {
         const name = pf.propertyName;
         const operator = this.toMangoOperator(pf.operator);
         let selector = ArrayUtils.findObjectByKey(selectors, name);
         if (this.forPouchDB && pf.operator === Operator.CONTAINS) {
            if (!selector) {
               selector = { [name]: {} };
               selectors.push(selector);
               selector[name][operator] = this.toCombinedContainsRegExp(pf.propertyName);
            }
         } else {
            if (!selector || selector[name][operator]) {
               selector = { [name]: {} };
               selectors.push(selector);
            }
            selector[name][operator] = this.toSelectorValue(pf);
         }
      });
      return selectors.length === 0 ? null : selectors;
   }

   /** 
    * @returns a [[RegExp]] that combines multiple 'contains' filter on the same field or a simple [[RegExp]] if
    * a single 'contains' filter exists
    * 
    * This method is used for PouchDB that can't cope with multiple regex on the same field
    */
   private toCombinedContainsRegExp(propertyName: string): RegExp {
      const filters = this.propertyFilters
         .filter(pf => pf.propertyName === propertyName)
         .filter(pf => pf.operator === Operator.CONTAINS)
      if (filters.length === 1) {
         return this.toContainsSelectorValue(<string>filters[0].filterValue, false);
      }
      const regex = filters
         .map(pf => '(?=.*' + pf.filterValue + '.*)')
         .join('');
      return new RegExp(regex, 'i');
   }

   private toSelectorValue(propertyFilter: PropertyFilter): any {
      if (propertyFilter.operator === Operator.CONTAINS) {
         return this.toContainsSelectorValue(<string>propertyFilter.filterValue, false);
      } else if (propertyFilter.operator === Operator.NOT_EMPTY) {
         return null;
      } else if (this.columns) {
         const column = this.columns.find(c => c.name === propertyFilter.propertyName);
         if (column && propertyFilter.filterValue !== null && propertyFilter.filterValue !== undefined
            && (column.dataType === DataType.NUMBER || column.dataType === DataType.TIME)) {
            return Number(propertyFilter.filterValue);
         }
      }
      return propertyFilter.filterValue;
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
      if (this.forPouchDB && this.sort && !this.propertyFilters.find(f => f.propertyName === this.sort.active)) {
         return {
            [this.sort.active]: { $gte: null }
         };
      }
      return null;
   }

   private toMangoOperator(operator: Operator): string {
      switch (operator) {
         case Operator.CONTAINS:
            return '$regex';
         case Operator.LESS_THAN:
            return '$lt';
         case Operator.LESS_THAN_OR_EQUAL:
            return '$lte';
         case Operator.EQUAL:
            return '$eq';
         case Operator.NOT_EQUAL:
            return '$ne';
         case Operator.GREATER_THAN_OR_EQUAL:
            return '$gte';
         case Operator.GREATER_THAN:
            return '$gt';
         case Operator.NOT_EMPTY:
            return '$gt';
         default:
            throw new Error('operator ' + operator + ' is not yet supported');
      }
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
      if (this.pageIndex >= 0) {
         if (this.pageIndex > 0) {
            query['skip'] = this.pageIndex * this.rowCount;
         }
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
