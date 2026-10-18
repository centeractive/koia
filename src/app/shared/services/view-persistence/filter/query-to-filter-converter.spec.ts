import { DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
import { queryToQueryDef } from './query-to-filter-converter';

describe('query-to-filter-converter', () => {

    let query: Query;

    beforeEach(() => {
        query = new Query();
        query.setFullTextFilter('abc');
        query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT));
        query.addValueRangeFilter('Amount', 10, 20, true, true);
        query.setSort({ active: 'Amount', direction: 'asc' });
        query.setPageDefinition(1, 100);
    });

    it('#queryToQueryDef should convert property and value range filters', () => {

        // when
        const queryDef = queryToQueryDef(query);

        // then
        expect(queryDef).toEqual({
            fullTextFilter: 'abc',
            propertyFilters: [{ name: 'Level', operator: Operator.EQUAL, value: 'ERROR', dataType: DataType.TEXT }],
            valueRangeFilters: [{ name: 'Amount', valueRange: { min: 10, max: 20, maxExcluding: true }, inverted: true }],
            sort: { active: 'Amount', direction: 'asc' },
            pageIndex: 1,
            rowsPerPage: 100
        });
    });

    it('#queryToQueryDef should convert empty query', () => {

        // when
        const queryDef = queryToQueryDef(new Query());

        // then
        expect(queryDef).toEqual({
            fullTextFilter: undefined,
            propertyFilters: [],
            valueRangeFilters: [],
            sort: undefined,
            pageIndex: undefined,
            rowsPerPage: undefined
        });
    });

    it('#queryToQueryDef should not share value ranges and sort with query', () => {

        // when
        const queryDef = queryToQueryDef(query);

        // then
        expect(queryDef.valueRangeFilters[0].valueRange).not.toBe(query.getValueRangeFilters()[0].valueRange);
        expect(queryDef.sort).not.toBe(query.getSort());
    });
});
