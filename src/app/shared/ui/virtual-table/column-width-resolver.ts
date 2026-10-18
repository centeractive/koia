import { LanguageService } from 'app/shared/services/language';
import { ValueFormatter } from 'app/shared/format';
import { Column } from 'app/shared/model';
import { TABLE_FONT_FAMILY, TABLE_FONT_SIZE } from '../table-fit/table-font';
import { TextMeasurer } from '../table-fit/text-measurer';
import { ColumnAutoSizer } from './column-auto-sizer';

export class ColumnWidthResolver {

  static readonly EM_PX = 14;
  static readonly SORT_WIDTH = 12;
  static readonly FONT = `${TABLE_FONT_SIZE}px ${TABLE_FONT_FAMILY}`;

  private readonly measurer = new TextMeasurer(ColumnWidthResolver.FONT);
  private readonly valueFormatter = new ValueFormatter(LanguageService.localeId);

  widthOf(column: Column, measurement: 'em' | 'px', considerColumnWidths: boolean, entries: object[], showNestedObjects: boolean): number {
    if (considerColumnWidths && column.width > 0) {
      return measurement === 'em' ? column.width * ColumnWidthResolver.EM_PX : column.width;
    }
    return this.autoWidth(column, entries, showNestedObjects);
  }

  charsOf(px: number): number {
    return Math.round(px / ColumnWidthResolver.EM_PX);
  }

  private autoWidth(column: Column, entries: object[], showNestedObjects: boolean): number {
    const measure = (text: string) => this.measurer.width(text);
    const cellTexts = entries.map(entry => String(this.valueFormatter.formatCell(column, entry, showNestedObjects)));
    const headerWidth = ColumnAutoSizer.width([column.name], measure) + ColumnWidthResolver.SORT_WIDTH;
    return Math.min(ColumnAutoSizer.MAX, Math.max(ColumnAutoSizer.width(cellTexts, measure), headerWidth));
  }
}
