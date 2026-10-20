import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { Route } from '../../model';
import { SavedView, TabDef, View, ViewType } from '../../model/view-config';
import { DialogService } from '../dialog.service';
import { createDefaultRawDataState } from '../view-persistence/raw-data-state-factory';
import { ViewTabsService } from '../view-tabs';
import { RawDataStateService } from './raw-data-state.service';
import { SavedViewRestorer } from './saved-view-restorer';
import { of } from 'rxjs';

describe('SavedViewRestorer', () => {

   let openTabs: TabDef[];
   let currentUrl: string;
   let viewTabsService: ViewTabsService;
   let rawDataStateService: RawDataStateService;
   let dialogService: DialogService;
   let router: Router;
   let restorer: SavedViewRestorer;

   beforeEach(() => {
      openTabs = [];
      currentUrl = '/view/tab1';
      viewTabsService = {
         get tabs() { return openTabs; },
         currentTab: vi.fn((tab: TabDef) => ({ ...tab })),
         replaceTabs: vi.fn()
      } as unknown as ViewTabsService;
      rawDataStateService = { apply: vi.fn() } as unknown as RawDataStateService;
      dialogService = { showConfirmDialog: vi.fn() } as unknown as DialogService;
      router = {
         get url() { return currentUrl; },
         navigateByUrl: vi.fn((url: string) => {
            currentUrl = url;
            return Promise.resolve(true);
         })
      } as unknown as Router;
      restorer = new SavedViewRestorer(viewTabsService, rawDataStateService, dialogService, router);
   });

   it('#restore should replace tabs without confirmation when open tabs have no content', async () => {

      // given
      openTabs = [dashboardTab('tab1', 0)];
      const view = savedView([dashboardTab('tab2', 1)]);

      // when
      const restored = await restorer.restore(view);

      // then
      expect(restored).toBe(true);
      expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
      expect(viewTabsService.replaceTabs).toHaveBeenCalledWith(view.tabs);
   });

   it('#restore should ask for confirmation with escaped view name when an open tab has content', async () => {

      // given
      openTabs = [dashboardTab('tab1', 1)];
      const confirmData = mockConfirmDialog(0);

      // when
      await restorer.restore({ ...savedView([]), name: '<b>' });

      // then
      expect(confirmData().title).toBe('Restore View');
      expect(confirmData().htmlContent).toBe('<p>Restoring "&lt;b&gt;" replaces all open tabs. Do you want to continue?</p>');
      expect(confirmData().buttonNames).toEqual(ConfirmDialogData.YES_NO);
   });

   it('#restore should consider current content of registered tab provider', async () => {

      // given
      openTabs = [dashboardTab('tab1', 0)];
      vi.mocked(viewTabsService.currentTab).mockReturnValue(dashboardTab('tab1', 1));
      mockConfirmDialog(0);

      // when
      await restorer.restore(savedView([]));

      // then
      expect(viewTabsService.currentTab).toHaveBeenCalledWith(openTabs[0]);
      expect(dialogService.showConfirmDialog).toHaveBeenCalled();
   });

   it('#restore should keep tabs when user declines', async () => {

      // given
      openTabs = [dashboardTab('tab1', 1)];
      mockConfirmDialog(1);

      // when
      const restored = await restorer.restore(savedView([]));

      // then
      expect(restored).toBe(false);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(viewTabsService.replaceTabs).not.toHaveBeenCalled();
      expect(rawDataStateService.apply).not.toHaveBeenCalled();
   });

   it('#restore should replace tabs when user confirms', async () => {

      // given
      openTabs = [dashboardTab('tab1', 1)];
      mockConfirmDialog(0);
      const view = savedView([dashboardTab('tab2', 1)]);

      // when
      const restored = await restorer.restore(view);

      // then
      expect(restored).toBe(true);
      expect(viewTabsService.replaceTabs).toHaveBeenCalledWith(view.tabs);
   });

   it('#restore should navigate to raw data before tabs are replaced', async () => {

      // when
      await restorer.restore(savedView([]));

      // then
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA);
      const navigationOrder = vi.mocked(router.navigateByUrl).mock.invocationCallOrder[0];
      expect(navigationOrder).toBeLessThan(vi.mocked(viewTabsService.replaceTabs).mock.invocationCallOrder[0]);
   });

   it('#restore should not replace tabs when raw data could not be shown', async () => {

      // given
      vi.mocked(router.navigateByUrl).mockResolvedValue(false);

      // when
      const restored = await restorer.restore(savedView([]));

      // then
      expect(restored).toBe(false);
      expect(viewTabsService.replaceTabs).not.toHaveBeenCalled();
      expect(rawDataStateService.apply).not.toHaveBeenCalled();
   });

   it('#restore should apply raw data state of view', async () => {

      // given
      const view = savedView([]);

      // when
      await restorer.restore(view);

      // then
      expect(rawDataStateService.apply).toHaveBeenCalledWith(view.rawData);
   });

   it('#restore should navigate to active tab of view', async () => {

      // given
      const view = { ...savedView([dashboardTab('tab1', 1), dashboardTab('tab2', 1)]), activeTabId: 'tab2' };

      // when
      await restorer.restore(view);

      // then
      expect(router.navigateByUrl).toHaveBeenLastCalledWith('/view/tab2');
   });

   it('#restore should stay on raw data when view has no active tab', async () => {

      // when
      await restorer.restore(savedView([dashboardTab('tab1', 1)]));

      // then
      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/' + Route.RAWDATA);
   });

   it('#restore should stay on raw data when active tab is not among tabs of view', async () => {

      // when
      await restorer.restore({ ...savedView([dashboardTab('tab1', 1)]), activeTabId: 'tab9' });

      // then
      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/' + Route.RAWDATA);
   });

   it('#restore should not modify saved view when restored tabs and raw data state change', async () => {

      // given
      const view = savedView([dashboardTab('tab1', 1)]);
      const viewJson = JSON.stringify(view);
      await restorer.restore(view);

      // when
      const tabs: TabDef[] = vi.mocked(viewTabsService.replaceTabs).mock.lastCall[0];
      tabs[0].title = 'changed';
      vi.mocked(rawDataStateService.apply).mock.lastCall[0].data.highlight = false;

      // then
      expect(JSON.stringify(view)).toBe(viewJson);
   });

   function savedView(tabs: TabDef[]): SavedView {
      return { name: 'all', modifiedTime: 1, tabs, rawData: createDefaultRawDataState() };
   }

   function dashboardTab(id: string, elementCount: number): TabDef {
      const view = { route: Route.GRID, elements: new Array(elementCount).fill({}) } as View;
      return { id, type: ViewType.DASHBOARD, title: id, view };
   }

   function mockConfirmDialog(closedWithButtonIndex: number): () => ConfirmDialogData {
      vi.mocked(dialogService.showConfirmDialog).mockImplementation((data: ConfirmDialogData) => {
         data.closedWithButtonIndex = closedWithButtonIndex;
         return { afterClosed: () => of(undefined) } as MatDialogRef<ConfirmDialogComponent>;
      });
      return () => vi.mocked(dialogService.showConfirmDialog).mock.lastCall[0];
   }
});
