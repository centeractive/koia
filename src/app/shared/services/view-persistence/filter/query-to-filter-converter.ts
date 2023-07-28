import { PropertyFilter, Query } from 'app/shared/model';
import { PropertyFilterDef } from 'app/shared/model/view-config/query/property-filter-def.type';
import { QueryDef } from 'app/shared/model/view-config/query/query-def.type';
import { ValueRangeFilterDef } from 'app/shared/model/view-config/query/value-range-filter-def';
import { ValueRangeFilter } from 'app/shared/value-range/model';

export function queryToQueryDef(query: Query): QueryDef {
    return {
        fullTextFilter: query.getFullTextFilter(),
        propertyFilters: propertyFilterDefs(query.getPropertyFilters()),
        valueRangeFilters: valueRangeFilterDefs(query.getValueRangeFilters()),
        sort: query.getSort(),
        pageIndex: query.getPageIndex(),
        rowsPerPage: query.getRowsPerPage()
    };
}

function propertyFilterDefs(filters: PropertyFilter[]): PropertyFilterDef[] {
    return filters.map(f => ({
        name: f.name,
        operator: f.operator,
        value: f.value,
        dataType: f.dataType
    }));
}

function valueRangeFilterDefs(filters: ValueRangeFilter[]): ValueRangeFilterDef[] {
    return filters.map(f => ({
        name: f.name,
        valueRange: f.valueRange,
        inverted: f.inverted
    }));
}