import { PropertyFilter, Query } from 'app/shared/model';
import { PropertyFilterDef } from 'app/shared/model/view-config/query/property-filter-def.type';
import { QueryDef } from 'app/shared/model/view-config/query/query-def.type';
import { ValueRangeFilterDef } from 'app/shared/model/view-config/query/value-range-filter-def';
import { ValueRangeFilter } from 'app/shared/value-range/model';

export function queryDefToQuery(queryDef: QueryDef): Query {
    const query = new Query();
    query.setFullTextFilter(queryDef.fullTextFilter);
    query.setPropertyFilters(propertyFilters(queryDef.propertyFilters));
    query.setValueRangeFilter(valueRangeFilters(queryDef.valueRangeFilters));
    query.setSort(queryDef.sort);
    query.setPageDefinition(queryDef.pageIndex, queryDef.rowsPerPage);
    return query;
}

function propertyFilters(filterDefs: PropertyFilterDef[]): PropertyFilter[] {
    return filterDefs.map(f => new PropertyFilter(f.name, f.operator, f.value, f.dataType));
}

function valueRangeFilters(filterDefs: ValueRangeFilterDef[]): ValueRangeFilter[] {
    return filterDefs.map(f => new ValueRangeFilter(f.name, f.valueRange, f.inverted));
}