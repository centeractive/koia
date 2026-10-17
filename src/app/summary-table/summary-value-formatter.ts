import { formatDate } from '@angular/common';
import { NumberFormatter } from 'app/shared/format';
import { LanguageService } from 'app/shared/services/language';
import { DateTimeUtils } from 'app/shared/utils';
import { DateTime } from 'luxon';
import { Column, DataType } from '../shared/model';

/**
 * formats the values of the summary table as they are displayed
 */
export class SummaryValueFormatter {

  private numberFormatter = new NumberFormatter();

  format(groupByColumns: Column[], columnIndex: number, value: string | number | boolean): string | boolean {
    if (value == undefined || typeof value === 'string' || typeof value === 'boolean') {
      return value as string | boolean;
    }
    if (groupByColumns.length > 0 && columnIndex < groupByColumns.length) {
      const column = groupByColumns[columnIndex];
      if (column.dataType === DataType.TIME) {
        if (column.groupingTimeUnit) {
          return formatDate(value, DateTimeUtils.ngFormatOf(column.groupingTimeUnit), LanguageService.localeId());
        } else if (column.format) {
          return DateTime.fromMillis(value, { locale: LanguageService.localeId() }).toFormat(column.format);
        }
      }
    }
    return this.numberFormatter.format(value);
  }
}
