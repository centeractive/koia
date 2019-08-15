import { ElementContext } from './element-context';
import { Column } from './column.type';
import { ExportFormat } from './export-format.enum';

export class SummaryContext extends ElementContext {

   static readonly UNLIMITED_WITH = Number.MAX_SAFE_INTEGER;

   constructor(columns: Column[], ) {
      super(columns);
      this.setUnlimitedWidth();
   }

   hasUnlimitedWidth(): boolean {
      return this.width === SummaryContext.UNLIMITED_WITH;
   }

   setUnlimitedWidth() {
      this.setSize(SummaryContext.UNLIMITED_WITH, this.height);
   }

   getTitle(): string {
      if (this.title) {
         return this.title;
      }
      if (this.dataColumns.length > 0) {
         const prefix = this.isAggregationCountSelected() ? 'Distinct values of ' : '';
         return prefix + '"' + this.dataColumns[0].name + '"';
      }
      return 'Data: to be defined';
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [ExportFormat.CSV, ExportFormat.JSON, ExportFormat.EXCEL];
   }
}
