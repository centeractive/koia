import { Locator, Page } from '@playwright/test';
import { Route } from 'app/shared/model/route.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { Notifications } from '../components/notifications';
import { ImportFile } from '../import-files';

export class ScenePage {

   readonly title: Locator;
   readonly separator: Locator;
   readonly panels: Locator;
   private readonly notifications: Notifications;

   constructor(private readonly page: Page) {
      this.title = page.locator('mat-card-title');
      this.separator = page.locator('.form_field_separator input');
      this.panels = page.locator('mat-accordion mat-expansion-panel');
      this.notifications = new Notifications(page);
   }

   /**
    * @returns the labels of the detected column data types
    */
   async detectColumns(file: ImportFile): Promise<string[]> {
      await this.page.locator('.scene_name input').waitFor();
      await this.page.locator('.form_field_source_type mat-select').click();
      await this.page.getByRole('option', { name: file.sourceName, exact: true }).click();
      await this.page.locator('#fileInput').setInputFiles(file.path);
      await this.page.locator('#textarea_data_sample').waitFor();
      await this.page.locator('#but_detect_columns').click();
      const dataTypes = this.page.locator('koia-column-mapping .select_data_type');
      await dataTypes.first().waitFor();
      return (await dataTypes.allInnerTexts()).map(text => text.trim());
   }

   /**
    * @returns the success message
    */
   async loadData(): Promise<string> {
      await this.page.locator('#but_load_data').click();
      const message = await this.notifications.dismiss(StatusType.SUCCESS);
      await this.page.waitForURL('**/' + Route.SCENES);
      return message;
   }
}
