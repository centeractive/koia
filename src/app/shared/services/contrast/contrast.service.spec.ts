import { Column, DataType, Document, Operator, PropertyFilter, Query } from 'app/shared/model';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { DBService } from '../backend/db.service';
import { ContrastService } from './contrast.service';

describe('ContrastService', () => {

   const columns: Column[] = [
      { name: 'Level', dataType: DataType.TEXT, width: 10, indexed: true },
      { name: 'Host', dataType: DataType.TEXT, width: 10, indexed: true }
   ];

   let findEntriesSpy: Mock;
   let findMatchingIdsSpy: Mock;
   let service: ContrastService;

   beforeEach(() => {
      const dbService = { findEntries: () => of([]), findMatchingIds: () => Promise.resolve(new Set()) } as Partial<DBService> as DBService;
      findEntriesSpy = vi.spyOn(dbService, 'findEntries');
      findMatchingIdsSpy = vi.spyOn(dbService, 'findMatchingIds');
      service = new ContrastService(dbService);
   });

   it('#explain should query base entries of indexed columns and selected IDs unsorted and unpaged', async () => {

      // given
      const selection = new Query(new PropertyFilter('Level', Operator.EQUAL, 'ERROR'));
      selection.setSort({ active: 'Host', direction: 'asc' });
      selection.setPageDefinition(1, 100);
      const base = new Query();
      base.setSort({ active: 'Level', direction: 'desc' });

      // when
      await service.explain(selection, base, columns);

      // then
      const baseQuery: Query = findEntriesSpy.mock.lastCall[0];
      expect(findEntriesSpy.mock.lastCall[1]).toBe(true);
      expect(baseQuery.hasSort()).toBe(false);
      const selectionQuery: Query = findMatchingIdsSpy.mock.lastCall[0];
      expect(selectionQuery.hasSort()).toBe(false);
      expect(selectionQuery.hasPageDefinition()).toBe(false);
      expect(selectionQuery.getPropertyFilters()).toEqual(selection.getPropertyFilters());
      expect(selection.hasSort()).toBe(true);
      expect(base.hasSort()).toBe(true);
   });

   it('#explain should compare selected base entries with other base entries', async () => {

      // given
      const entries = [
         ...entriesOf(0, 10, () => ({ Level: 'ERROR', Host: 'node-7' })),
         ...entriesOf(10, 100, () => ({ Level: 'INFO', Host: 'node-1' }))
      ];
      findEntriesSpy.mockReturnValue(of(entries));
      findMatchingIdsSpy.mockResolvedValue(new Set(entries.slice(0, 10).map(e => e._id)));
      const selection = new Query(new PropertyFilter('Level', Operator.EQUAL, 'ERROR'));

      // when
      const analysis = await service.explain(selection, new Query(), columns);

      // then
      expect(analysis.comparable).toBe(true);
      expect(analysis.findings.map(f => f.column + '=' + f.value)).toEqual(['Host=node-7']);
      expect(analysis.findings[0].selectedCount).toBe(10);
      expect(analysis.skippedColumns).toEqual([]);
   });

   it('#explain should ignore selected entries outside of base', async () => {

      // given
      const entries = entriesOf(0, 100, i => ({ Level: 'INFO', Host: i < 10 ? 'node-7' : 'node-1' }));
      findEntriesSpy.mockReturnValue(of(entries));
      findMatchingIdsSpy.mockResolvedValue(new Set(['x1', 'x2', ...entries.slice(0, 10).map(e => e._id)]));

      // when
      const analysis = await service.explain(new Query(new PropertyFilter('Host', Operator.EQUAL, 'node-7')), new Query(), columns);

      // then
      expect(analysis.comparable).toBe(true);
      expect(analysis.findings).toEqual([]);
   });

   it('#explain should not compare when no base entry is selected', async () => {

      // given
      findEntriesSpy.mockReturnValue(of(entriesOf(0, 10, () => ({ Level: 'INFO' }))));
      findMatchingIdsSpy.mockResolvedValue(new Set(['x1']));

      // when
      const analysis = await service.explain(new Query(), new Query(), columns);

      // then
      expect(analysis).toEqual({ comparable: false, findings: [], skippedColumns: [] });
   });

   it('#explain should not compare when all base entries are selected', async () => {

      // given
      const entries = entriesOf(0, 10, () => ({ Level: 'INFO' }));
      findEntriesSpy.mockReturnValue(of(entries));
      findMatchingIdsSpy.mockResolvedValue(new Set(entries.map(e => e._id)));

      // when
      const analysis = await service.explain(new Query(), new Query(), columns);

      // then
      expect(analysis).toEqual({ comparable: false, findings: [], skippedColumns: [] });
   });

   function entriesOf(from: number, to: number, valuesOf: (i: number) => object): Document[] {
      const entries: Document[] = [];
      for (let i = from; i < to; i++) {
         entries.push({ _id: String(i), ...valuesOf(i) });
      }
      return entries;
   }
});
