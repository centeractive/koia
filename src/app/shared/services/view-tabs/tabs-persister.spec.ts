import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SceneTabs, TabDef, ViewType } from '../../model/view-config';
import { NotificationServiceMock } from '../../test/notification-service-mock';
import { DBService } from '../backend';
import { createTabDef } from './tab-defs';
import { TabsPersister } from './tabs-persister';
import type { Mock } from 'vitest';

describe('TabsPersister', () => {

   const bottomSheet = {} as MatBottomSheet;
   let dbService: DBService;
   let notificationService: NotificationServiceMock;
   let saveSceneTabsSpy: Mock;
   let persister: TabsPersister;
   let doc: SceneTabs;
   let tabs: TabDef[];

   beforeEach(() => {
      vi.useFakeTimers();
      dbService = new DBService(null, null);
      notificationService = new NotificationServiceMock();
      vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);
      saveSceneTabsSpy = vi.spyOn(dbService, 'saveSceneTabs').mockImplementation(d => Promise.resolve(d));
      persister = new TabsPersister(dbService, notificationService, bottomSheet);
      doc = { _id: 's1_tabs', tabs: [] };
      persister.reset(doc);
      tabs = [createTabDef(ViewType.PIVOT, 1)];
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   it('#request should not persist before delay elapsed', () => {

      // when
      persister.request(() => tabs);
      vi.advanceTimersByTime(TabsPersister.DELAY_MS - 1);

      // then
      expect(saveSceneTabsSpy).not.toHaveBeenCalled();
   });

   it('#request should persist snapshot once delay elapsed', async () => {

      // when
      persister.request(() => tabs);
      await vi.advanceTimersByTimeAsync(TabsPersister.DELAY_MS);

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(1);
      expect(saveSceneTabsSpy.mock.lastCall[0]).toEqual({ _id: 's1_tabs', tabs });
   });

   it('#request should replace pending request', async () => {

      // given
      const otherTabs = [createTabDef(ViewType.DASHBOARD, 2)];
      persister.request(() => tabs);
      vi.advanceTimersByTime(TabsPersister.DELAY_MS / 2);

      // when
      persister.request(() => otherTabs);
      await vi.advanceTimersByTimeAsync(TabsPersister.DELAY_MS);

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(1);
      expect(saveSceneTabsSpy.mock.lastCall[0].tabs).toEqual(otherTabs);
   });

   it('#persistNow should skip writing when tabs did not change', async () => {

      // when
      await persister.persistNow(() => []);

      // then
      expect(saveSceneTabsSpy).not.toHaveBeenCalled();
   });

   it('#persistNow should write deep copy of tabs', async () => {

      // when
      await persister.persistNow(() => tabs);

      // then
      const savedDoc: SceneTabs = saveSceneTabsSpy.mock.lastCall[0];
      expect(savedDoc).toBe(doc);
      expect(savedDoc.tabs).toEqual(tabs);
      expect(savedDoc.tabs).not.toBe(tabs);
      expect(savedDoc.tabs[0]).not.toBe(tabs[0]);
   });

   it('#persistNow should cancel pending request', async () => {

      // given
      persister.request(() => [createTabDef(ViewType.DASHBOARD, 9)]);

      // when
      await persister.persistNow(() => tabs);
      await vi.advanceTimersByTimeAsync(TabsPersister.DELAY_MS);

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(1);
      expect(saveSceneTabsSpy.mock.lastCall[0].tabs).toEqual(tabs);
   });

   it('#persistNow should skip second write of unchanged tabs', async () => {

      // given
      await persister.persistNow(() => tabs);

      // when
      await persister.persistNow(() => tabs);

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(1);
   });

   it('#persistNow should serialize writes', async () => {

      // given
      let resolveFirstWrite: (d: SceneTabs) => void;
      saveSceneTabsSpy.mockImplementationOnce(() => new Promise(resolve => resolveFirstWrite = resolve));
      persister.persistNow(() => tabs);
      await vi.advanceTimersByTimeAsync(0);

      // when
      const secondWrite = persister.persistNow(() => [createTabDef(ViewType.DASHBOARD, 2)]);
      await vi.advanceTimersByTimeAsync(0);

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(1);
      resolveFirstWrite(doc);
      await secondWrite;
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(2);
   });

   it('#persistNow should write same tabs again after failed write', async () => {

      // given
      saveSceneTabsSpy.mockRejectedValueOnce(new Error('offline'));
      await persister.persistNow(() => tabs);

      // when
      await persister.persistNow(() => tabs);

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(2);
   });

   it('#persistNow should report error once per failure streak', async () => {

      // given
      saveSceneTabsSpy.mockRejectedValue(new Error('offline'));

      // when
      await persister.persistNow(() => tabs);
      await persister.persistNow(() => [createTabDef(ViewType.DASHBOARD, 2)]);

      // then
      expect(notificationService.onError).toHaveBeenCalledTimes(1);
      expect(notificationService.onError).toHaveBeenCalledWith(bottomSheet, 'Open tabs cannot be saved: offline');
   });

   it('#ngOnDestroy should drop pending request', async () => {

      // given
      persister.request(() => tabs);

      // when
      persister.ngOnDestroy();
      await vi.advanceTimersByTimeAsync(TabsPersister.DELAY_MS);

      // then
      expect(saveSceneTabsSpy).not.toHaveBeenCalled();
   });

   it('#ngOnDestroy should suppress error of running write', async () => {

      // given
      saveSceneTabsSpy.mockRejectedValue(new Error('offline'));
      const write = persister.persistNow(() => tabs);

      // when
      persister.ngOnDestroy();
      await write;

      // then
      expect(notificationService.onError).not.toHaveBeenCalled();
   });

   it('#persistNow should report error again after successful write', async () => {

      // given
      saveSceneTabsSpy.mockRejectedValueOnce('offline');
      await persister.persistNow(() => tabs);
      await persister.persistNow(() => tabs);
      saveSceneTabsSpy.mockRejectedValueOnce('offline again');

      // when
      await persister.persistNow(() => [createTabDef(ViewType.DASHBOARD, 2)]);

      // then
      expect(notificationService.onError).toHaveBeenCalledTimes(2);
      expect(notificationService.onError).toHaveBeenLastCalledWith(bottomSheet, 'Open tabs cannot be saved: offline again');
   });

   it('#persistNow should keep newer last state when older write fails', async () => {

      // given
      const newerTabs = [createTabDef(ViewType.DASHBOARD, 2)];
      saveSceneTabsSpy.mockRejectedValueOnce('offline');
      persister.persistNow(() => tabs);
      await persister.persistNow(() => newerTabs);

      // when
      await persister.persistNow(() => newerTabs);

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(2);
   });

   it('#flush should write pending snapshot immediately', async () => {

      // given
      persister.request(() => tabs);

      // when
      await persister.flush();

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(TabsPersister.DELAY_MS);
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(1);
   });

   it('#flush should not write when nothing is pending', async () => {

      // when
      await persister.flush();

      // then
      expect(saveSceneTabsSpy).not.toHaveBeenCalled();
   });

   it('#flush should capture snapshot and document before reset', async () => {

      // given
      persister.request(() => tabs);
      const flushed = persister.flush();

      // when
      persister.reset({ _id: 's2_tabs', tabs: [] });
      await flushed;

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledTimes(1);
      expect(saveSceneTabsSpy.mock.lastCall[0]).toEqual({ _id: 's1_tabs', tabs });
   });

   it('#cancel should drop pending request', async () => {

      // given
      persister.request(() => tabs);

      // when
      persister.cancel();
      await vi.advanceTimersByTimeAsync(TabsPersister.DELAY_MS);

      // then
      expect(saveSceneTabsSpy).not.toHaveBeenCalled();
   });

   it('#reportError should notify message of error object', () => {

      // when
      persister.reportError('Prefix: ', { message: 'details' });

      // then
      expect(notificationService.onError).toHaveBeenCalledWith(bottomSheet, 'Prefix: details');
   });
});
