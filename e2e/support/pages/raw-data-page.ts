import { Locator, Page } from '@playwright/test';
import { ContrastPanel } from '../components/contrast-panel';
import { MainToolbar } from '../components/main-toolbar';
import { PagingToggles } from '../components/paging-toggles';
import { RawDataTable } from '../components/raw-data-table';
import { ViewToolbar } from '../components/view-toolbar';

export class RawDataPage {

   readonly table: RawDataTable;
   readonly mainToolbar: MainToolbar;
   readonly viewToolbar: ViewToolbar;
   readonly pagingToggles: PagingToggles;
   readonly sheets: Locator;
   readonly contrast: ContrastPanel;

   constructor(page: Page) {
      const root = page.locator('koia-root koia-raw-data');
      this.table = new RawDataTable(root);
      this.mainToolbar = new MainToolbar(root.locator('koia-main-toolbar'));
      this.viewToolbar = new ViewToolbar(root.locator('koia-view-toolbar'));
      this.pagingToggles = new PagingToggles(root.locator('koia-paging-toggles'));
      this.sheets = root.locator('koia-table-sheets .div_canvas_sheet');
      this.contrast = new ContrastPanel(root);
   }
}
