import { Page } from '@playwright/test';
import { MainToolbar } from '../components/main-toolbar';
import { RawDataTable } from '../components/raw-data-table';
import { ViewToolbar } from '../components/view-toolbar';

export class RawDataPage {

   readonly table: RawDataTable;
   readonly mainToolbar: MainToolbar;
   readonly viewToolbar: ViewToolbar;

   constructor(page: Page) {
      const root = page.locator('koia-root koia-raw-data');
      this.table = new RawDataTable(root);
      this.mainToolbar = new MainToolbar(root.locator('koia-main-toolbar'));
      this.viewToolbar = new ViewToolbar(root.locator('koia-view-toolbar'));
   }
}
