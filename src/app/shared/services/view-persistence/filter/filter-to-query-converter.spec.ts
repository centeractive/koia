import { DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
import { QueryDef } from 'app/shared/model/view-config/query/query-def.type';
import { ValueRangeFilter } from 'app/shared/value-range/model';
import { queryDefToQuery } from './filter-to-query-converter';
import { queryToQueryDef } from './query-to-filter-converter';

describe('filter-to-query-converter', () => {

    let queryDef: QueryDef;

    beforeEach(() => {
        queryDef = {
            fullTextFilter: 'abc',
            propertyFilters: [{ name: 'Level', operator: Operator.EQUAL, value: 'ERROR', dataType: DataType.TEXT }],
            valueRangeFilters: [{ name: 'Amount', valueRange: { min: 10, max: 20, maxExcluding: true }, inverted: true }],
            sort: { active: 'Amount', direction: 'desc' },
            pageIndex: 2,
            rowsPerPage: 50
        };
    });

    it('#queryDefToQuery should create property and value range filters, sort and page definition', () => {

        // when
        const query = queryDefToQuery(queryDef);

        // then
        expect(query.getFullTextFilter()).toBe('abc');
        expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)]);
        expect(query.getValueRangeFilters()).toEqual([new ValueRangeFilter('Amount', { min: 10, max: 20, maxExcluding: true }, true)]);
        expect(query.getSort()).toEqual({ active: 'Amount', direction: 'desc' });
        expect(query.getPageIndex()).toBe(2);
        expect(query.getRowsPerPage()).toBe(50);
    });

    it('#queryDefToQuery should not share value ranges and sort with query def', () => {

        // when
        const query = queryDefToQuery(queryDef);

        // then
        expect(query.getValueRangeFilters()[0].valueRange).not.toBe(queryDef.valueRangeFilters[0].valueRange);
        expect(query.getSort()).not.toBe(queryDef.sort);
    });

    it('#queryDefToQuery should restore query converted by queryToQueryDef', () => {

        // given
        const query = new Query(new PropertyFilter('Host', Operator.NOT_EMPTY, '', DataType.TEXT));
        query.addValueRangeFilter('Time', 1_000, 2_000, false, false);

        // when
        const restored = queryDefToQuery(queryToQueryDef(query));

        // then
        expect(restored.getFullTextFilter()).toBeUndefined();
        expect(restored.getPropertyFilters()).toEqual(query.getPropertyFilters());
        expect(restored.getValueRangeFilters()).toEqual(query.getValueRangeFilters());
        expect(restored.getSort()).toBeUndefined();
        expect(restored.hasPageDefinition()).toBe(false);
    });
});
