import { Sort } from '@angular/material';
import { PropertyFilter } from './property-filter';
import { Operator } from './operator.enum';

export class Query {

   private fullTextFilter: string;
   private propertyFilters: PropertyFilter[] = [];
   private sort: Sort;
   private pageIndex: number;
   private rowsPerPage: number;

   setFullTextFilter(fullTextFilter: string) {
      this.fullTextFilter = fullTextFilter;
   }

   getFullTextFilter(): string {
      return this.fullTextFilter;
   }

   hasFullTextFilter(): boolean {
      return this.fullTextFilter && this.fullTextFilter.length > 0;
   }

   /**
    * Sets a unique property filter
    */
   setPropertyFilter(propertyfilter: PropertyFilter): void {
      this.propertyFilters = [propertyfilter];
   }

   /**
    * Replaces all property filter with new ones
    */
   setPropertyFilters(propertyfilters: PropertyFilter[]): void {
      this.propertyFilters = propertyfilters;
   }

   addPropertyFilter(propertyfilter: PropertyFilter): void {
      this.propertyFilters.push(propertyfilter);
   }

   removePropertyFilter(propertyName: string, operator: Operator) {
      const index = this.propertyFilters.findIndex(pf => pf.propertyName === propertyName && pf.operator === operator);
      if (index >= 0) {
         this.propertyFilters.splice(index, 1);
      }
   }

   findPropertyFilter(propertyName: string, operator: Operator): PropertyFilter | undefined {
      return this.propertyFilters.find(pf => pf.propertyName === propertyName && pf.operator === operator);
   }

   /**
    * @returns a copy of the property filters
    */
   getPropertyFilters(): PropertyFilter[] {
      return this.propertyFilters.slice(0);
   }

   getTimeStart(columnName: string): number {
      const filter = this.findPropertyFilter(columnName, Operator.GREATER_THAN_OR_EQUAL);
      return filter ? <number>filter.filterValue : null;
   }

   hasTimeStart(columnName: string): boolean {
      return this.findPropertyFilter(columnName, Operator.GREATER_THAN_OR_EQUAL) !== undefined;
   }

   setTimeStart(columnName: string, timeStart: number): void {
      this.removePropertyFilter(columnName, Operator.GREATER_THAN_OR_EQUAL);
      if (timeStart !== null) {
         this.addPropertyFilter(new PropertyFilter(columnName, Operator.GREATER_THAN_OR_EQUAL, timeStart));
      }
   }

   getTimeEnd(columnName: string): number {
      const filter = this.findPropertyFilter(columnName, Operator.LESS_THAN_OR_EQUAL);
      return filter ? <number>filter.filterValue : null;
   }

   hasTimeEnd(columnName: string): boolean {
      return this.findPropertyFilter(columnName, Operator.LESS_THAN_OR_EQUAL) !== undefined;
   }

   setTimeEnd(columnName: string, timeEnd: number): void {
      this.removePropertyFilter(columnName, Operator.LESS_THAN_OR_EQUAL);
      if (timeEnd !== null) {
         this.addPropertyFilter(new PropertyFilter(columnName, Operator.LESS_THAN_OR_EQUAL, timeEnd));
      }
   }

   hasFilter(): boolean {
      return this.hasFullTextFilter() || this.propertyFilters.length > 0;
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
      clone.propertyFilters = this.propertyFilters.map(pf => pf.clone());
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
