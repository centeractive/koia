import { Sort } from '@angular/material';
import { PropertyFilter } from './property-filter';
import { Operator } from './operator.enum';
import { ValueRangeFilter } from '../value-range/model/value-range-filter';

export class Query {

   private fullTextFilter: string;
   private propertyFilters: PropertyFilter[] = [];
   private valueRangeFilters: ValueRangeFilter[] = [];
   private sort: Sort;
   private pageIndex: number;
   private rowsPerPage: number;

   constructor(propertyFilter?: PropertyFilter) {
      if (propertyFilter) {
         this.propertyFilters.push(propertyFilter);
      }
   }

   setFullTextFilter(fullTextFilter: string) {
      this.fullTextFilter = fullTextFilter;
   }

   getFullTextFilter(): string {
      return this.fullTextFilter;
   }

   hasFullTextFilter(): boolean {
      return this.fullTextFilter && this.fullTextFilter.length > 0;
   }

   addPropertyFilter(propertyfilter: PropertyFilter): void {
      this.propertyFilters.push(propertyfilter);
   }

   findPropertyFilter(name: string, operator: Operator): PropertyFilter | undefined {
      return this.propertyFilters.find(pf => pf.name === name && pf.operator === operator);
   }

   getPropertyFilters(): PropertyFilter[] {
      return this.propertyFilters.slice(0);
   }

   addValueRangeFilter(name: string, minValue: number, maxValue: number, maxExcluding?: boolean, inverted?: boolean): void {
      this.valueRangeFilters.push(
         new ValueRangeFilter(name, { min: minValue, max: maxValue, maxExcluding: maxExcluding }, inverted));
   }

   findValueRangeFilter(name: string): ValueRangeFilter | undefined {
      return this.valueRangeFilters
         .find(pf => pf.name === name);
   }

   getValueRangeFilters(): ValueRangeFilter[] {
      return this.valueRangeFilters.slice(0);
   }

   hasFilter(): boolean {
      return this.hasFullTextFilter() ||
         this.propertyFilters.filter(f => f.isApplicable()).length > 0 ||
         this.valueRangeFilters.filter(f => f.isApplicable()).length > 0;
   }

   getSort(): Sort {
      return this.sort;
   }

   setSort(sort: Sort): void {
      this.sort = sort;
   }

   clearSort(): void {
      this.sort = undefined;
   }

   getPageIndex(): number {
      return this.pageIndex;
   }

   getRowsPerPage(): number {
      return this.rowsPerPage;
   }

   /**
    * @param pageIndex starts at zero
    */
   setPageDefinition(pageIndex: number, rowsPerPage: number): void {
      this.pageIndex = pageIndex;
      this.rowsPerPage = rowsPerPage;
   }

   clearPageDefinition(): void {
      this.pageIndex = undefined;
      this.rowsPerPage = undefined;
   }

   hasPageDefinition(): boolean {
      return this.pageIndex >= 0 && this.rowsPerPage > 0;
   }

   clone(): Query {
      const clone = new Query();
      if (this.fullTextFilter) {
         clone.fullTextFilter = this.fullTextFilter;
      }
      clone.propertyFilters = this.propertyFilters.map(f => f.clone());
      clone.valueRangeFilters = this.valueRangeFilters.map(f => f.clone());
      if (this.sort) {
         clone.sort = { active: this.sort.active, direction: this.sort.direction };
      }
      if (this.hasPageDefinition()) {
         clone.pageIndex = this.pageIndex;
         clone.rowsPerPage = this.rowsPerPage;
      }
      return clone;
   }
}
