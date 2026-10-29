import { Locator, Page } from '@playwright/test';
import { Route } from 'app/shared/model/route.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { Notifications } from '../components/notifications';
import { RawDataTable } from '../components/raw-data-table';
import { ImportFile } from '../import-files';

export class ScenePage {

   readonly title: Locator;
   readonly sourceType: Locator;
   readonly dataSample: Locator;
   readonly languageField: Locator;
   readonly adoptColumnsToggle: Locator;
   readonly idColumnToggle: Locator;
   readonly separator: Locator;
   readonly linePattern: Locator;
   readonly panels: Locator;
   readonly nameInput: Locator;
   readonly nameError: Locator;
   readonly detectColumnsButton: Locator;
   readonly columnNameErrors: Locator;
   readonly dataTypes: Locator;
   readonly columnNames: Locator;
   readonly addPatternButtons: Locator;
   readonly patternIcons: Locator;
   readonly displayFormatValues: Locator;
   readonly preview: RawDataTable;
   readonly previewRowWarnings: Locator;
   private readonly notifications: Notifications;

   constructor(private readonly page: Page) {
      this.title = page.locator('koia-page-frame .page_title');
      this.sourceType = page.locator('.form_field_source_type mat-select');
      this.dataSample = page.locator('#textarea_data_sample');
      this.languageField = page.locator('.form_field_language');
      this.adoptColumnsToggle = page.locator('#div_adopt_columns mat-slide-toggle');
      this.idColumnToggle = page.locator('#toggle_id_column').getByRole('switch');
      this.separator = page.locator('.form_field_separator input');
      this.linePattern = page.locator('[data-attribute="scene.reader.logPattern"] input');
      this.panels = page.locator('mat-accordion mat-expansion-panel');
      this.nameInput = page.locator('.scene_name input');
      this.nameError = page.locator('.scene_name mat-error');
      this.detectColumnsButton = page.locator('#but_detect_columns');
      this.columnNameErrors = page.locator('koia-column-mapping mat-error');
      this.preview = new RawDataTable(page.locator('koia-scene-preview'));
      this.previewRowWarnings = page.locator('koia-scene-preview .img_row_warning');
      this.dataTypes = page.locator('koia-column-mapping .select_data_type');
      this.columnNames = page.locator('koia-column-mapping .column_name input');
      this.addPatternButtons = page.locator('koia-column-mapping .but_add_pattern');
      this.patternIcons = page.locator('koia-column-mapping .icon_pattern');
      this.displayFormatValues = page.locator('koia-column-mapping .select_display_format .mat-mdc-select-value');
      this.notifications = new Notifications(page);
   }

   async selectFile(file: ImportFile, whileChoosing: () => Promise<void> = async () => undefined): Promise<void> {
      await this.nameInput.waitFor();
      await this.sourceType.click();
      await this.page.getByRole('option', { name: file.sourceName, exact: true }).click();
      const [fileChooser] = await Promise.all([this.page.waitForEvent('filechooser'), this.page.locator('#select_file_button').click()]);
      await whileChoosing();
      await fileChooser.setFiles(file.path);
      await this.dataSample.waitFor();
   }

   /**
    * @returns the labels of the detected column data types
    */
   async detectColumns(file: ImportFile, whileChoosing: () => Promise<void> = async () => undefined): Promise<string[]> {
      await this.selectFile(file, whileChoosing);
      await this.detectColumnsButton.click();
      await this.dataTypes.first().waitFor();
      return (await this.dataTypes.allInnerTexts()).map(text => text.trim());
   }

   async changeDataType(columnIndex: number, dataTypeLabel: string): Promise<void> {
      await this.dataTypes.nth(columnIndex).click();
      await this.page.getByRole('option', { name: dataTypeLabel, exact: true }).click();
   }

   async selectDisplayFormat(text: string): Promise<void> {
      await this.page.locator('koia-column-mapping .select_display_format').click();
      await this.page.getByRole('option', { name: text, exact: true }).click();
   }

   /**
    * adds a pattern column right after the column of the specified index
    */
   async addPatternColumn(columnIndex: number): Promise<void> {
      await this.page.locator('koia-column-mapping').nth(columnIndex).locator('.but_add_pattern').click();
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
