import { Sort } from '@angular/material/sort';
import { PropertyFilterDef } from './property-filter-def.type';
import { ValueRangeFilterDef } from './value-range-filter-def';

export interface QueryDef {
    fullTextFilter: string;
    propertyFilters: PropertyFilterDef[];
    valueRangeFilters: ValueRangeFilterDef[];
    sort: Sort;
    pageIndex: number;
    rowsPerPage: number;
}