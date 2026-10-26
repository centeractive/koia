import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { Column, DataType, Query } from 'app/shared/model';
import { BACKENDS, BackendRun, IT_PROVIDERS, setUpBackend, tearDownBackend } from 'app/shared/test/backend-fixture';
import { SceneFactory } from 'app/shared/test/scene-factory';
import PouchDB from 'pouchdb';
import { lastValueFrom } from 'rxjs';
import { CouchDBService } from './backend/couchdb';
import { PatternColumnService } from './pattern-column.service';

const TIMEOUT = 60_000;
const ENTRY_COUNT = 1_001;

const COLUMNS: Column[] = [
   { name: 'Level', dataType: DataType.TEXT, width: 8, indexed: true },
   { name: 'Message', dataType: DataType.TEXT, width: 40, indexed: false },
   { name: 'Request', dataType: DataType.TEXT, width: 10, indexed: false }
];

/**
 * one full page of entries plus one, every tenth entry has no message
 */
function entries(): object[] {
   return Array.from({ length: ENTRY_COUNT }, (_, i) => {
      const entry = { _id: String(i).padStart(5, '0'), Level: i % 2 ? 'INFO' : 'ERROR', Request: 'r' + i };
      return i % 10 ? { ...entry, Message: 'Request r' + i + ' took ' + i + 'ms' } : entry;
   });
}

describe.each(BACKENDS)('PatternColumnService IT ($name)', backend => {

   let run: BackendRun;
   let service: PatternColumnService;

   beforeEach(async () => {
      TestBed.configureTestingModule({ providers: [...IT_PROVIDERS] });
      run = await setUpBackend(backend, [{ scene: SceneFactory.createScene('patterns', COLUMNS), entries: entries() }]);
      const router = { routeReuseStrategy: new AppRouteReuseStrategy() } as unknown as Router;
      service = new PatternColumnService(run.db, router);
   }, TIMEOUT);

   afterEach(() => tearDownBackend(run), TIMEOUT);

   async function storedEntries(): Promise<object[]> {
      return lastValueFrom(run.db.findEntries(new Query(), false));
   }

   it('#add should write pattern of each message, index it and keep entry count', async () => {

      // given
      const scene = run.scenes[0].scene;
      const progress: number[] = [];

      // when
      const column = await service.add(scene._id, 'Message', count => progress.push(count));

      // then
      expect(column.name).toBe('Message pattern');
      expect(progress).toEqual([1_000, ENTRY_COUNT]);
      expect(run.db.getActiveScene().columns.map(c => c.name)).toEqual(['Level', 'Message', 'Request', 'Message pattern']);
      const stored = await storedEntries();
      expect(stored.length).toBe(ENTRY_COUNT);
      const expected = entries().map(e => e['Message'] ? { ...e, 'Message pattern': 'Request <*> took <*>' } : e);
      expect(stored).toEqual(expected);
      expect(await run.db.countEntriesOfActiveScene()).toBe(ENTRY_COUNT);
      await run.db.createColumnIndex(scene.database, 'Message pattern');
      expect(await run.db.countEntriesOfActiveScene()).toBe(ENTRY_COUNT);
   }, TIMEOUT);

   it('#add should allow sorting by pattern column', async () => {

      // given
      const scene = run.scenes[0].scene;
      await service.add(scene._id, 'Message', () => null);
      const query = new Query();
      query.setSort({ active: 'Message pattern', direction: 'desc' });

      // when
      const sorted = await lastValueFrom(run.db.findEntries(query, true));

      // then
      expect(sorted.filter(e => e['Message pattern']).length).toBe(900);
   }, TIMEOUT);

   it('#add should be refused for column that has a pattern column already', async () => {

      // given
      const scene = run.scenes[0].scene;
      await service.add(scene._id, 'Message', () => null);

      // when
      const result = service.add(scene._id, 'Message', () => null);

      // then
      await expect(result).rejects.toThrow('no pattern column can be added to column "Message"');
   }, TIMEOUT);

   it('#addPatternField should not write entries again when patterns are written already', async () => {

      // given
      const database = run.scenes[0].scene.database;
      await run.db.addPatternField(database, 'Message', 'Message pattern', () => null);
      const revisions = (await storedRevisions(database)).join();

      // when
      const count = await run.db.addPatternField(database, 'Message', 'Message pattern', () => null);

      // then
      expect(count).toBe(ENTRY_COUNT);
      expect((await storedRevisions(database)).join()).toBe(revisions);
   }, TIMEOUT);

   it('#suitableColumnNames should return free text column only', async () => {

      // when
      const names = await service.suitableColumnNames(run.scenes[0].scene);

      // then
      expect(names).toEqual(new Set(['Message']));
   }, TIMEOUT);

   /**
    * @returns the _id and _rev of all documents, read directly from the backend because entries are found without _rev
    */
   async function storedRevisions(database: string): Promise<string[]> {
      const docs = backend.name === 'CouchDB' ?
         await lastValueFrom(TestBed.inject(CouchDBService).find(database, { selector: { _id: { $gt: null } }, fields: ['_id', '_rev'], limit: 10_000 })) :
         (await new PouchDB(database).allDocs()).rows.map(r => ({ _id: r.id, _rev: r.value.rev }));
      return docs.map(d => d._id + '@' + d._rev);
   }
});
