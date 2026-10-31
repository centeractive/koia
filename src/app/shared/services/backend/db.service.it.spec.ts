import { TestBed } from '@angular/core/testing';
import { Column, DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
import { BACKENDS, BackendRun, IT_PROVIDERS, setUpBackend, tearDownBackend } from 'app/shared/test/backend-fixture';
import { SceneFactory } from 'app/shared/test/scene-factory';
import { lastValueFrom } from 'rxjs';

const TIMEOUT = 30_000;

const COLUMNS: Column[] = [
   { name: 'ID', dataType: DataType.NUMBER, width: 8, indexed: true },
   { name: 'Level', dataType: DataType.TEXT, width: 8, indexed: true },
   { name: 'Amount', dataType: DataType.NUMBER, width: 8, indexed: true }
];

function entries(): object[] {
   return [
      { _id: '1', ID: 1, Level: 'INFO', Amount: 10 },
      { _id: '2', ID: 2, Level: 'WARN', Amount: 20 },
      { _id: '3', ID: 3, Level: 'ERROR', Amount: 30 },
      { _id: '4', ID: 4, Level: 'a;b', Amount: 50 },
      { _id: '5', ID: 5, Amount: 40 },
      { _id: '6', ID: 6 },
      { _id: '7', ID: 7, Level: 'INFO', Amount: 50 }
   ];
}

describe.each(BACKENDS)('DBService IT ($name)', backend => {

   let run: BackendRun;

   beforeEach(async () => {
      TestBed.configureTestingModule({ providers: [...IT_PROVIDERS] });
      run = await setUpBackend(backend, [{ scene: SceneFactory.createScene('exclusions', COLUMNS), entries: entries() }]);
   }, TIMEOUT);

   afterEach(() => tearDownBackend(run), TIMEOUT);

   async function orderedIdsOf(query: Query): Promise<number[]> {
      const found = await lastValueFrom(run.db.findEntries(query, true));
      return found.map(e => e['ID'] as number);
   }

   async function idsOf(query: Query): Promise<number[]> {
      return (await orderedIdsOf(query)).sort((id1, id2) => id1 - id2);
   }

   it('#findEntries should drop rows having excluded values but keep rows lacking a value', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NONE_OF, 'WARN', DataType.TEXT, true));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NOT_EQUAL, 'a;b', DataType.TEXT, true));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.NOT_EQUAL, 30, DataType.NUMBER, true));
      query.addValueRangeFilter('Amount', 5, 15, true, true, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([5, 6, 7]);
   }, TIMEOUT);

   it('#findEntries should drop rows lacking a value when the empty value is excluded too', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NOT_EMPTY, '', DataType.TEXT));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NONE_OF, 'WARN', DataType.TEXT, true));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1, 3, 4, 7]);
   }, TIMEOUT);

   it('#findEntries should keep only rows lacking a value when all values are excluded', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', undefined, undefined, true, true, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([6]);
   }, TIMEOUT);

   it('#findEntries should drop rows inside any of several outside ranges of the same column and rows lacking a value', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 15, 25, true, true);
      query.addValueRangeFilter('Amount', 35, 45, true, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1, 3, 4, 7]);
   }, TIMEOUT);

   it('#findEntries should sort rows outside of several ranges of the same column by that column', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 15, 25, true, true);
      query.addValueRangeFilter('Amount', 35, 45, true, true);
      query.setSort({ active: 'Amount', direction: 'desc' });

      // when
      const ids = await orderedIdsOf(query);

      // then
      expect(ids).toEqual([7, 4, 3, 1]);
   }, TIMEOUT);

   it('#findEntries should drop rows lacking a value when only one of the outside ranges of a column keeps them', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 15, 25, true, true, true);
      query.addValueRangeFilter('Amount', 35, 45, true, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1, 3, 4, 7]);
   }, TIMEOUT);

   it('#findEntries should find no rows when an empty filter and an outside range not keeping empty values share a column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.EMPTY, ''));
      query.addValueRangeFilter('Amount', 15, 25, true, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for an outside range without bounds not keeping empty values', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', undefined, undefined, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should keep rows above the max of an outside range without min', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', undefined, 30, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([4, 5, 7]);
   }, TIMEOUT);

   it('#findMatchingIds should find rows above the max of an outside range without min', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', undefined, 30, false, true);

      // when
      const ids = await run.db.findMatchingIds(query);

      // then
      expect(ids).toEqual(new Set(['4', '5', '7']));
   }, TIMEOUT);

   it('#findEntries should drop rows lacking a value for an outside range without max', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 20, undefined, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1]);
   }, TIMEOUT);

   it('#findEntries should sort rows below the min of an outside range without max by that column', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 45, undefined, false, true);
      query.setSort({ active: 'Amount', direction: 'desc' });

      // when
      const ids = await orderedIdsOf(query);

      // then
      expect(ids).toEqual([5, 3, 2, 1]);
   }, TIMEOUT);

   it('#findEntries should keep rows between an outside range without min and an outside range without max of the same column', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', undefined, 15, false, true);
      query.addValueRangeFilter('Amount', 45, undefined, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([2, 3, 5]);
   }, TIMEOUT);

   it('#findEntries should keep rows below both mins of outside ranges without max of the same column', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 30, undefined, false, true);
      query.addValueRangeFilter('Amount', 45, undefined, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1, 2]);
   }, TIMEOUT);

   it('#findEntries should find no rows for an empty filter and an outside range without max on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.EMPTY, ''));
      query.addValueRangeFilter('Amount', 20, undefined, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for an empty filter and an outside range without min on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.EMPTY, ''));
      query.addValueRangeFilter('Amount', undefined, 30, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should keep rows lacking a value for an outside range without max keeping empty values', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 20, undefined, false, true, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1, 6]);
   }, TIMEOUT);

   it('#findEntries should keep rows of the stricter bound for a less or equal filter and an outside range without max on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN_OR_EQUAL, 20));
      query.addValueRangeFilter('Amount', 20, undefined, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1]);
   }, TIMEOUT);

   it('#findEntries should keep rows of the stricter bound for a greater or equal filter and an outside range without min on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.GREATER_THAN_OR_EQUAL, 30));
      query.addValueRangeFilter('Amount', undefined, 30, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([4, 5, 7]);
   }, TIMEOUT);

   it('#findEntries should combine an outside range without min with a filter on another column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'INFO'));
      query.addValueRangeFilter('Amount', undefined, 20, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([7]);
   }, TIMEOUT);

   it('#findEntries should drop rows lacking a value for a less than filter', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN, 30));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1, 2]);
   }, TIMEOUT);

   it('#findEntries should drop rows lacking a value for an inside range without min', async () => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', undefined, 30);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1, 2, 3]);
   }, TIMEOUT);

   it('#findEntries should sort rows of a less or equal filter by that column without rows lacking a value', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN_OR_EQUAL, 30));
      query.setSort({ active: 'Amount', direction: 'desc' });

      // when
      const ids = await orderedIdsOf(query);

      // then
      expect(ids).toEqual([3, 2, 1]);
   }, TIMEOUT);

   it('#findMatchingIds should not count rows lacking a value for a less than filter', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN, 30));

      // when
      const ids = await run.db.findMatchingIds(query);

      // then
      expect(ids).toEqual(new Set(['1', '2']));
   }, TIMEOUT);

   it('#findEntries should keep rows of the stricter bound for less than and less or equal filters on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN, 30));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN_OR_EQUAL, 20));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([1, 2]);
   }, TIMEOUT);

   it('#findEntries should keep rows of the stricter bound for greater than and greater or equal filters on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.GREATER_THAN, 10));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.GREATER_THAN_OR_EQUAL, 20));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([2, 3, 4, 5, 7]);
   }, TIMEOUT);

   it('#findEntries should keep rows below both bounds for less than filters with zero on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN, 0));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN, 25));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for a less than filter and an empty filter on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.LESS_THAN, 30));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.EMPTY, ''));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for an outside range without bounds combined with another filter', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'INFO'));
      query.addValueRangeFilter('Amount', undefined, undefined, false, true);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for an empty and a not empty filter on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.EMPTY, ''));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.NOT_EMPTY, ''));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for a not empty and an empty filter on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.NOT_EMPTY, ''));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.EMPTY, ''));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for an empty and a not empty filter on the same text column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.EMPTY, ''));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NOT_EMPTY, ''));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for equal filters with different values on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'INFO'));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'WARN'));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should keep rows matching each of several any of filters on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.ANY_OF, 'INFO;WARN', DataType.TEXT));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.ANY_OF, 'WARN;ERROR', DataType.TEXT));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([2]);
   }, TIMEOUT);

   it('#findEntries should drop rows matching any of several none of filters on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NONE_OF, 'INFO', DataType.TEXT));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NONE_OF, 'WARN', DataType.TEXT));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([3, 4]);
   }, TIMEOUT);

   it('#findEntries should find no rows for an equal filter and a greater than filter excluding its value on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.EQUAL, 10));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.GREATER_THAN, 20));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should find no rows for an equal filter and an inside range excluding its value on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.EQUAL, 10));
      query.addValueRangeFilter('Amount', 20, 40);

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([]);
   }, TIMEOUT);

   it('#findEntries should drop rows lacking a value for a not equal filter', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NOT_EQUAL, 'INFO'));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([2, 3, 4]);
   }, TIMEOUT);

   it('#findEntries should sort rows of a not equal filter by that column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.NOT_EQUAL, 10));
      query.setSort({ active: 'Amount', direction: 'asc' });

      // when
      const ids = await orderedIdsOf(query);

      // then
      expect(ids).toEqual([2, 3, 5, 4, 7]);
   }, TIMEOUT);

   it('#findEntries should keep rows of an any of filter above a greater than filter on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.GREATER_THAN, 20));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.ANY_OF, '10;30;50', DataType.NUMBER));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([3, 4, 7]);
   }, TIMEOUT);

   it('#findEntries should keep rows above a greater than filter combined with a not empty filter on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.GREATER_THAN, 20));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.NOT_EMPTY, ''));

      // when
      const ids = await idsOf(query);

      // then
      expect(ids).toEqual([3, 4, 5, 7]);
   }, TIMEOUT);

   it('#findEntries should sort rows matching several any of filters on a column and a none of filter keeping empty values', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.ANY_OF, '20;40;50', DataType.NUMBER));
      query.addPropertyFilter(new PropertyFilter('Amount', Operator.ANY_OF, '30;40;50', DataType.NUMBER));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.NONE_OF, 'INFO', DataType.TEXT, true));
      query.setSort({ active: 'Amount', direction: 'desc' });

      // when
      const ids = await orderedIdsOf(query);

      // then
      expect(ids).toEqual([4, 5]);
   }, TIMEOUT);

   it('#findMatchingIds should find rows matching each of several any of filters on the same column', async () => {

      // given
      const query = new Query();
      query.addPropertyFilter(new PropertyFilter('Level', Operator.ANY_OF, 'INFO;WARN', DataType.TEXT));
      query.addPropertyFilter(new PropertyFilter('Level', Operator.ANY_OF, 'WARN;ERROR', DataType.TEXT));

      // when
      const ids = await run.db.findMatchingIds(query);

      // then
      expect(ids).toEqual(new Set(['2']));
   }, TIMEOUT);
});
