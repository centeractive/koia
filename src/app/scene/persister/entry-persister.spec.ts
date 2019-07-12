import { ProgressMonitor } from './progress-monitor.type';
import { EntryPersister } from './entry-persister';
import { DBService } from 'app/shared/services/backend';
import { DocChangeResponse } from 'app/shared/services/backend/doc-change-response.type';
import { flush, fakeAsync } from '@angular/core/testing';

describe('EntryPersister', () => {

   const database = 'test_data';
   const batchSize = 4;
   const dbService: DBService = new DBService(null);
   let dbServiceWriteEtriesSpy: jasmine.Spy;
   let monitor: ProgressMonitor;
   let monitorOnProgressSpy: jasmine.Spy;
   let persister: EntryPersister;

   beforeEach(() => {
      dbServiceWriteEtriesSpy = spyOn(dbService, 'writeEntries').and.callFake(arg => Promise.resolve(docChangeResponses(arg[0].length)));
      monitor = {
         onProgress: percent => console.log('progress ' + percent + '%'),
         onComplete: msg => console.log(msg),
         onError: err => console.log(err)
      };
      monitorOnProgressSpy = spyOn(monitor, 'onProgress');
      spyOn(monitor, 'onError');
      spyOn(monitor, 'onComplete');
      spyOn(console, 'log').and.callFake(m => null)
      persister = new EntryPersister(dbService, database, batchSize, monitor);
   });

   it('#post should not submit data when batch size is not reached', fakeAsync(() => {

      // when
      persister.post(entries(batchSize - 1));

      // then
      expect(persister.isPostingComplete()).toBeFalsy();
      expect(dbService.writeEntries).toHaveBeenCalledTimes(0);
      expect(monitor.onProgress).toHaveBeenCalledTimes(1);
      expect(monitor.onProgress).toHaveBeenCalledWith(0, '3 items read');
      expect(monitor.onComplete).toHaveBeenCalledTimes(0);
   }));

   it('#post should submit data when batch size is reached', fakeAsync(() => {

      // when
      persister.post(entries(batchSize));
      flush();

      // then
      expect(persister.isPostingComplete()).toBeFalsy();
      expect(dbService.writeEntries).toHaveBeenCalledTimes(1);
      expect(dbService.writeEntries).toHaveBeenCalledWith(database, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      expect(monitor.onProgress).toHaveBeenCalledTimes(2);
      expect(monitor.onProgress).toHaveBeenCalledWith(0, '4 items read');
      expect(monitor.onProgress).toHaveBeenCalledWith(100, '4 items read / 4 persisted');
      expect(monitor.onComplete).toHaveBeenCalledTimes(0);
   }));

   it('#post should submit data when batch size is exceeded', fakeAsync(() => {

      // when
      persister.post(entries(batchSize * 2 + 2));
      flush();

      // then
      expect(persister.isPostingComplete()).toBeFalsy();
      expect(dbService.writeEntries).toHaveBeenCalledTimes(2);
      expect(dbService.writeEntries).toHaveBeenCalledWith(database, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      expect(dbService.writeEntries).toHaveBeenCalledWith(database, [{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }]);
      expect(monitor.onProgress).toHaveBeenCalledTimes(3);
      expect(monitor.onProgress).toHaveBeenCalledWith(0, '10 items read');
      expect(monitor.onProgress).toHaveBeenCalledWith(40, '10 items read / 4 persisted');
      expect(monitor.onProgress).toHaveBeenCalledWith(80, '10 items read / 8 persisted');
      expect(monitor.onComplete).toHaveBeenCalledTimes(0);
   }));

   it('#post should complete posting and report error when error occurs in DB service', fakeAsync(() => {

      // given
      dbServiceWriteEtriesSpy.and.returnValue(Promise.reject('DB error'));

      // when
      persister.post(entries(batchSize));
      flush();

      // then
      expect(persister.isPostingComplete()).toBeTruthy();
      expect(dbService.writeEntries).toHaveBeenCalledTimes(1);
      expect(monitor.onProgress).toHaveBeenCalledTimes(1);
      expect(monitor.onProgress).toHaveBeenCalledWith(0, '4 items read');
      expect(monitor.onError).toHaveBeenCalledTimes(1);
      expect(monitor.onError).toHaveBeenCalledWith('DB error');
      expect(monitor.onComplete).toHaveBeenCalledTimes(1);
      expect(monitor.onComplete).toHaveBeenCalledWith('data persisting aborted due to error: DB error');
   }));

   it('#post should throw error when posting was complete before', fakeAsync(() => {

      // given
      persister.post(entries(batchSize));
      persister.postingComplete(true);
      flush();

      // when / then
      expect(() => persister.post(entries(batchSize)))
         .toThrow(new Error('Posting was completed and is now locked'));
   }));

   it('#postingComplete should submit queued data if desired', fakeAsync(() => {

      // given
      persister.post(entries(batchSize + 2));
      flush();
      dbServiceWriteEtriesSpy.calls.reset();
      monitorOnProgressSpy.calls.reset();

      // when
      persister.postingComplete(true);
      flush();

      // then
      expect(persister.isPostingComplete()).toBeTruthy();
      expect(dbService.writeEntries).toHaveBeenCalledTimes(1);
      expect(dbService.writeEntries).toHaveBeenCalledWith(database, [{ id: 5 }, { id: 6 }]);
      expect(monitor.onProgress).toHaveBeenCalledTimes(1);
      expect(monitor.onProgress).toHaveBeenCalledWith(100, '6 of 6 items persisted (100%)');
      expect(monitor.onComplete).toHaveBeenCalledTimes(1);
      expect(monitor.onComplete).toHaveBeenCalledWith('6 items have been persisted in the database');
   }));

   it('#postingComplete should not submit queued data if not desired', fakeAsync(() => {

      // given
      persister.post(entries(batchSize + 2));
      flush();
      dbServiceWriteEtriesSpy.calls.reset();
      monitorOnProgressSpy.calls.reset();

      // when
      persister.postingComplete(false);
      flush();

      // then
      expect(persister.isPostingComplete()).toBeTruthy();
      expect(dbService.writeEntries).toHaveBeenCalledTimes(0);
      expect(monitor.onProgress).toHaveBeenCalledTimes(0);
      expect(monitor.onComplete).toHaveBeenCalledTimes(1);
      expect(monitor.onComplete).toHaveBeenCalledWith('4 items have been persisted in the database');
   }));

   it('#reset should enable posting again', fakeAsync(() => {

      // given
      persister.post(entries(batchSize));
      persister.postingComplete(true);
      flush();

      // when
      persister.reset();

      // then
      expect(persister.isPostingComplete()).toBeFalsy();
      expect(() => persister.post(entries(batchSize)))
         .not.toThrow(new Error('Posting was completed and is now locked'));
      flush();
   }));

   function docChangeResponses(objectCount: number): DocChangeResponse[] {
      const docChangeResp: DocChangeResponse[] = new Array(objectCount);
      for (let i = 0; i < docChangeResponses.length; i++) {
         const id = '' + (i + 1);
         docChangeResp[i] = { ok: true, id: id, rev: id };
      }
      return docChangeResp;
   }

   function entries(objectCount: number): Object[] {
      const data: Object[] = new Array(objectCount);
      for (let i = 0; i < objectCount; i++) {
         data[i] = { id: i + 1 };
      }
      return data;
   }
});
