import { StringUtils } from '../utils/string-utils';
import { Column } from './column.type';
import { ElementContext } from './element-context';
import { ExportFormat } from './export-format.enum';

export class SummaryContext extends ElementContext {

   constructor(columns: Column[]) {
      super(columns);
   }

   getTitle(): string {
      if (this.title) {
         return this.title;
      }
      if (this.dataColumns.length > 0) {
         const prefix = this.isAggregationCountSelected() ? 'Distinct values of ' : '';
         return prefix + StringUtils.quote(this.dataColumns[0].name);
      }
      return 'Data: to be defined';
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [ExportFormat.CSV, ExportFormat.JSON, ExportFormat.EXCEL];
   }
}
