import { LanguageService } from 'app/shared/services/language/language.service';
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
         const column = StringUtils.quote(this.dataColumns[0].name);
         return this.isAggregationCountSelected() ? LanguageService.instant('element.title.distinctValuesOf', { column }) : column;
      }
      return LanguageService.instant('element.title.dataUndefined');
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [ExportFormat.CSV, ExportFormat.JSON, ExportFormat.EXCEL];
   }
}
