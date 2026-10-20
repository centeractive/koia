import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { InputDialogComponent, InputDialogData } from '../../component/input-dialog/input-dialog.component';
import { ManageViewContext } from '../../component/manage-view-dialog';
import { Route, Scene, Status, StatusType } from '../../model';
import { ConfigRecord, SavedView, TabDef, ViewType } from '../../model/view-config';
import { savedViewOf, SceneFactory } from '../../test';
import { DBService } from '../backend';
import { DialogService } from '../dialog.service';
import { createDefaultRawDataState } from '../view-persistence/raw-data-state-factory';
import { ViewPersistenceService } from '../view-persistence/view-persistence.service';
import { ViewTabsService } from '../view-tabs';
import { RawDataStateService } from './raw-data-state.service';
import { SavedViewRestorer } from './saved-view-restorer';
import { SavedViewsService } from './saved-views.service';

describe('SavedViewsService', () => {

   const STATUS: Status = { type: StatusType.SUCCESS, msg: 'saved' };

   let scene: Scene;
   let openTabs: TabDef[];
   let tabsReady: boolean;
   let dbService: DBService;
   let getActiveSceneSpy: Mock;
   let viewTabsService: ViewTabsService;
   let rawDataStateService: RawDataStateService;
   let viewPersistenceService: ViewPersistenceService;
   let dialogService: DialogService;
   let restorer: SavedViewRestorer;
   let proposedNames: string[];
   let service: SavedViewsService;

   beforeEach(() => {
      scene = SceneFactory.createScene('1', []);
      openTabs = [];
      tabsReady = true;
      proposedNames = [];
      dbService = new DBService(null);
      getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
      viewTabsService = {
         get ready() { return tabsReady; },
         get tabs() { return openTabs; },
         currentTab: vi.fn((tab: TabDef) => ({ ...tab }))
      } as unknown as ViewTabsService;
      rawDataStateService = { current: vi.fn(() => createDefaultRawDataState()) } as unknown as RawDataStateService;
      viewPersistenceService = new ViewPersistenceService(dbService);
      vi.spyOn(viewPersistenceService, 'saveView').mockResolvedValue(STATUS);
      dialogService = { showInputDialog: vi.fn(), showManageViewDialog: vi.fn() } as unknown as DialogService;
      restorer = { restore: vi.fn().mockResolvedValue(true) } as unknown as SavedViewRestorer;
      service = new SavedViewsService(dbService, viewTabsService, rawDataStateService, viewPersistenceService, dialogService, restorer);
   });

   it('#ready should reflect readiness of tabs', () => {

      // given
      tabsReady = false;

      // when
      const ready = service.ready;

      // then
      expect(ready).toBe(false);
   });

   it('#findAll should return saved views of active scene', () => {

      // given
      const view = savedViewOf('a');
      scene.config = { savedViews: [view] };

      // when
      const views = service.findAll();

      // then
      expect(views).toEqual([view]);
   });

   it('#findAll should return no views when no scene is active', () => {

      // given
      getActiveSceneSpy.mockReturnValue(undefined);

      // when
      const views = service.findAll();

      // then
      expect(views).toEqual([]);
   });

   it('#save should not save when name dialog is canceled', async () => {

      // given
      mockInputDialog(undefined);

      // when
      const status = await service.save(undefined);

      // then
      expect(status).toBeUndefined();
      expect(viewPersistenceService.saveView).not.toHaveBeenCalled();
   });

   it('#save should save all tabs with current content, active tab and raw data state', async () => {

      // given
      const record = pivotRecord();
      openTabs = [{ id: 'tab1', type: ViewType.PIVOT, title: 'Pivot' }, { id: 'tab2', type: ViewType.DASHBOARD, title: 'Dashboard' }];
      vi.mocked(viewTabsService.currentTab).mockImplementation(tab => tab.id === 'tab1' ? { ...tab, record } : { ...tab });
      const rawData = { ...createDefaultRawDataState(), data: { considerColumnWidths: false, highlight: false } };
      vi.mocked(rawDataStateService.current).mockReturnValue(rawData);
      mockInputDialog('all');

      // when
      await service.save('tab2');

      // then
      const savedScene: Scene = vi.mocked(viewPersistenceService.saveView).mock.lastCall[0];
      const saved: SavedView = vi.mocked(viewPersistenceService.saveView).mock.lastCall[1];
      expect(savedScene).toBe(scene);
      expect(saved.name).toBe('all');
      expect(saved.modifiedTime).toBeGreaterThan(0);
      expect(saved.tabs).toEqual([{ ...openTabs[0], record }, openTabs[1]]);
      expect(saved.activeTabId).toBe('tab2');
      expect(saved.rawData).toEqual(rawData);
   });

   it('#save should provide status of persisting', async () => {

      // given
      mockInputDialog('all');

      // when
      const status = await service.save(undefined);

      // then
      expect(status).toBe(STATUS);
   });

   it('#save should not share tabs and raw data state with open tabs', async () => {

      // given
      const tab: TabDef = { id: 'tab1', type: ViewType.PIVOT, title: 'Pivot', record: pivotRecord() };
      openTabs = [tab];
      vi.mocked(viewTabsService.currentTab).mockReturnValue(tab);
      const rawData = createDefaultRawDataState();
      vi.mocked(rawDataStateService.current).mockReturnValue(rawData);
      mockInputDialog('all');

      // when
      await service.save(undefined);

      // then
      const saved: SavedView = vi.mocked(viewPersistenceService.saveView).mock.lastCall[1];
      expect(saved.tabs[0]).not.toBe(tab);
      expect(saved.tabs[0].record).not.toBe(tab.record);
      expect(saved.rawData).not.toBe(rawData);
   });

   it('#save should propose name of last saved view', async () => {

      // given
      mockInputDialog('first');
      await service.save(undefined);

      // when
      await service.save(undefined);

      // then
      expect(proposedName()).toBe('first');
   });

   it('#save should propose name of last restored view', async () => {

      // given
      await service.restore(savedViewOf('restored'));
      mockInputDialog('x');

      // when
      await service.save(undefined);

      // then
      expect(proposedName()).toBe('restored');
   });

   it('#save should propose empty name when active scene changed', async () => {

      // given
      mockInputDialog('first');
      await service.save(undefined);
      getActiveSceneSpy.mockReturnValue(SceneFactory.createScene('2', []));

      // when
      await service.save(undefined);

      // then
      expect(proposedName()).toBe('');
   });

   it('#restore should not remember name when restoring was declined', async () => {

      // given
      vi.mocked(restorer.restore).mockResolvedValue(false);
      await service.restore(savedViewOf('declined'));
      mockInputDialog('x');

      // when
      await service.save(undefined);

      // then
      expect(restorer.restore).toHaveBeenCalled();
      expect(proposedName()).toBe('');
   });

   it('#manage should open manage view dialog with saved views of active scene', () => {

      // given
      const older = { ...savedViewOf('older'), modifiedTime: 1 };
      const newer = { ...savedViewOf('newer'), modifiedTime: 2 };
      scene.config = { savedViews: [older, newer] };

      // when
      service.manage(vi.fn());

      // then
      const context = vi.mocked(dialogService.showManageViewDialog).mock.lastCall[0] as ManageViewContext<SavedView>;
      expect(context.views).toEqual([newer, older]);
      expect(context.views[0]).toBe(newer);
   });

   it('#manage should update views and hand over status', async () => {

      // given
      const deleted = savedViewOf('deleted');
      const renamed = savedViewOf('renamed');
      scene.config = { savedViews: [deleted, renamed] };
      vi.spyOn(viewPersistenceService, 'updateViews').mockResolvedValue(STATUS);
      const onUpdated = vi.fn();
      service.manage(onUpdated);
      const context = vi.mocked(dialogService.showManageViewDialog).mock.lastCall[0] as ManageViewContext<SavedView>;

      // when
      await context.updateViews([deleted], [renamed]);

      // then
      expect(viewPersistenceService.updateViews).toHaveBeenCalledWith(scene, [deleted], [renamed]);
      expect(onUpdated).toHaveBeenCalledWith(STATUS);
   });

   function pivotRecord(): ConfigRecord {
      return { route: Route.PIVOT, name: 'Pivot', modifiedTime: 0, query: null, data: { pivotOptions: { cols: ['Level'] } } };
   }

   function mockInputDialog(name: string | undefined): void {
      vi.mocked(dialogService.showInputDialog).mockImplementation((data: InputDialogData) => {
         proposedNames.push(data.input);
         data.input = name;
         data.closedWithOK = name !== undefined;
         return { afterClosed: () => of(true) } as MatDialogRef<InputDialogComponent>;
      });
   }

   function proposedName(): string {
      return proposedNames.at(-1);
   }
});
