import { TestBed } from '@angular/core/testing';
import { Column, DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
import { BACKENDS, BackendRun, IT_PROVIDERS, setUpBackend, tearDownBackend } from 'app/shared/test/backend-fixture';
import { SceneFactory } from 'app/shared/test/scene-factory';
import { ContrastService } from './contrast.service';
import { ValueKind } from './contrast.types';

const TIMEOUT = 30_000;

const COLUMNS: Column[] = [
   { name: 'Level', dataType: DataType.TEXT, width: 8, indexed: true },
   { name: 'Host', dataType: DataType.TEXT, width: 8, indexed: true },
   { name: 'Version', dataType: DataType.TEXT, width: 8, indexed: true },
   { name: 'Message', dataType: DataType.TEXT, width: 20, indexed: true }
];

/**
 * 20 ERROR rows: Host node-7 16 times, Version missing, null and empty 6 times each
 * 60 INFO rows: Host node-1 and node-2, Version 2.4
 */
function entries(): object[] {
   const errors = Array.from({ length: 20 }, (_, i) => {
      const entry = { _id: 'e' + String(i).padStart(2, '0'), Level: 'ERROR', Host: i < 16 ? 'node-7' : 'node-1', Message: 'upstream timeout' };
      return i < 6 ? entry : { ...entry, Version: i < 12 ? null : i < 18 ? '' : '2.4' };
   });
   const infos = Array.from({ length: 60 }, (_, i) =>
      ({ _id: 'i' + String(i).padStart(2, '0'), Level: 'INFO', Host: i < 30 ? 'node-1' : 'node-2', Version: '2.4', Message: 'completed' }));
   return [...errors, ...infos];
}

describe.each(BACKENDS)('ContrastService IT ($name)', backend => {

   let run: BackendRun;
   let service: ContrastService;

   beforeEach(async () => {
      TestBed.configureTestingModule({ providers: [...IT_PROVIDERS] });
      run = await setUpBackend(backend, [{ scene: SceneFactory.createScene('contrast', COLUMNS), entries: entries() }]);
      service = new ContrastService(run.db);
   }, TIMEOUT);

   afterEach(() => tearDownBackend(run), TIMEOUT);

   function errorQuery(): Query {
      return new Query(new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT));
   }

   it('#explain should find over-represented host and missing, null and empty versions of sorted queries', async () => {

      // given rows lacking the sort field would be omitted by CouchDB
      const selection = errorQuery();
      selection.setSort({ active: 'Version', direction: 'asc' });
      const base = new Query();
      base.setSort({ active: 'Version', direction: 'asc' });

      // when messages are not analyzed, they differ by level
      const analysis = await service.explain(selection, base, COLUMNS.filter(c => c.name !== 'Message'));

      // then
      expect(analysis.comparable).toBe(true);
      expect(analysis.findings.map(f => [f.column, f.kind, f.value, f.selectedCount])).toEqual([
         ['Host', ValueKind.VALUE, 'node-7', 16],
         ['Version', ValueKind.BLANK, undefined, 6],
         ['Version', ValueKind.EMPTY, undefined, 6],
         ['Version', ValueKind.NULL, undefined, 6]
      ]);
      expect(analysis.findings.every(f => f.isNew)).toBe(true);
   }, TIMEOUT);

   it('#explain should find column values of rows selected by full text filter', async () => {

      // given
      const selection = new Query();
      selection.setFullTextFilter('timeout');

      // when
      const analysis = await service.explain(selection, new Query(), COLUMNS);

      // then
      const conditions = analysis.findings.map(f => f.column + '=' + (f.value ?? f.kind));
      expect(conditions).toContain('Level=ERROR');
      expect(conditions).toContain('Message=upstream timeout');
      expect(conditions).toContain('Host=node-7');
   }, TIMEOUT);

   it('narrowing to missing value should select exactly the rows lacking the field', async () => {

      // given
      const query = errorQuery();
      query.addPropertyFilter(new PropertyFilter('Version', Operator.EMPTY, '', DataType.TEXT));

      // when
      const ids = await run.db.findMatchingIds(query);

      // then
      expect([...ids].sort()).toEqual(['e00', 'e01', 'e02', 'e03', 'e04', 'e05']);
   }, TIMEOUT);

   it('#explain should not compare when all rows are selected', async () => {

      // when
      const analysis = await service.explain(new Query(new PropertyFilter('Host', Operator.NOT_EMPTY, '')), new Query(), COLUMNS);

      // then
      expect(analysis).toEqual({ comparable: false, findings: [], skippedColumns: [] });
   }, TIMEOUT);
});
