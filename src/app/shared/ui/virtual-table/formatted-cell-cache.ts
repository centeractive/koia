import { ValueFormatter } from 'app/shared/format';
import { Column, DataType } from 'app/shared/model';
import { ObjectUtils } from 'app/shared/utils/object-utils';

interface CachedCell {
  value: unknown;
  dataType: DataType;
  format: string;
  showNestedObjects: boolean;
  formatKey: string;
  text: ReturnType<ValueFormatter['formatCell']>;
}

/**
 * remembers formatted cell texts, change detection checks every visible cell and formatting them anew each time stalls wide tables
 *
 * @param formatKey identifies the locales of dates and numbers, cached texts are formatted anew when it changes
 */
export class FormattedCellCache {

  private readonly rows = new WeakMap<object, Map<Column, CachedCell>>();

  constructor(private readonly formatter: ValueFormatter, private readonly formatKey: () => string) { }

  // eslint-disable-next-line
  textOf(column: Column, entry: object, showNestedObjects: boolean): any {
    const value = ObjectUtils.ownValue(entry, column.name);
    const formatKey = this.formatKey();
    let row = this.rows.get(entry);
    if (!row) {
      row = new Map();
      this.rows.set(entry, row);
    }
    const cached = row.get(column);
    if (cached && Object.is(cached.value, value) && cached.dataType === column.dataType && cached.format === column.format
      && cached.showNestedObjects === showNestedObjects && cached.formatKey === formatKey) {
      return cached.text;
    }
    const text = this.formatter.formatCell(column, entry, showNestedObjects);
    row.set(column, { value, dataType: column.dataType, format: column.format, showNestedObjects, formatKey, text });
    return text;
  }
}
