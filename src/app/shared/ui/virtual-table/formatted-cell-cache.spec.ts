import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { ValueFormatter } from 'app/shared/format';
import { Column, DataType } from 'app/shared/model';
import { FormattedCellCache } from './formatted-cell-cache';

describe('FormattedCellCache', () => {

  beforeAll(() => registerLocaleData(localeDe));

  let locale: string;
  let formatter: ValueFormatter;
  let cache: FormattedCellCache;

  beforeEach(() => {
    locale = 'en-US';
    formatter = new ValueFormatter(() => locale);
    vi.spyOn(formatter, 'formatCell');
    cache = new FormattedCellCache(formatter, () => locale);
  });

  it('#textOf should return text of value formatter', () => {

    // given
    const column = columnOf('n', DataType.NUMBER);
    const entry = { n: 1234.5 };

    // when
    const text = cache.textOf(column, entry, false);

    // then
    expect(text).toBe(new ValueFormatter(() => locale).formatCell(column, entry, false));
  });

  it('#textOf should format cell only once while value, column and locale are unchanged', () => {

    // given
    const column = columnOf('n', DataType.NUMBER);
    const entry = { n: 1 };
    cache.textOf(column, entry, false);

    // when
    cache.textOf(column, entry, false);

    // then
    expect(formatter.formatCell).toHaveBeenCalledTimes(1);
  });

  it('#textOf should format again when value of entry changed', () => {

    // given
    const column = columnOf('n', DataType.NUMBER);
    const entry = { n: 1 };
    cache.textOf(column, entry, false);

    // when
    entry.n = 2;
    const text = cache.textOf(column, entry, false);

    // then
    expect(text).toBe('2');
    expect(formatter.formatCell).toHaveBeenCalledTimes(2);
  });

  it('#textOf should format again when column format changed', () => {

    // given
    const column: Column = { ...columnOf('t', DataType.TIME), format: 'yyyy' };
    const entry = { t: new Date(2024, 4, 3).getTime() };
    cache.textOf(column, entry, false);

    // when
    column.format = 'd MMM yyyy';
    const text = cache.textOf(column, entry, false);

    // then
    expect(text).toBe('3 May 2024');
  });

  it('#textOf should format again when column data type changed', () => {

    // given
    const column = columnOf('v', DataType.TEXT);
    const entry = { v: 1000 };
    cache.textOf(column, entry, false);

    // when
    column.dataType = DataType.NUMBER;
    cache.textOf(column, entry, false);

    // then
    expect(formatter.formatCell).toHaveBeenCalledTimes(2);
  });

  it('#textOf should format again when nested objects are shown', () => {

    // given
    const column = columnOf('o', DataType.OBJECT);
    const entry = { o: '{ "a": 1 }' };
    cache.textOf(column, entry, false);

    // when
    const text = cache.textOf(column, entry, true);

    // then
    expect(text).toBe('{ "a": 1 }');
  });

  it('#textOf should format again when locale changed', () => {

    // given
    const column: Column = { ...columnOf('t', DataType.TIME), format: 'MMMM' };
    const entry = { t: new Date(2024, 4, 3).getTime() };
    cache.textOf(column, entry, false);

    // when
    locale = 'de';
    const text = cache.textOf(column, entry, false);

    // then
    expect(text).toBe('Mai');
  });

  it('#textOf should cache columns of same entry separately', () => {

    // given
    const entry = { a: 'x', b: 'y' };

    // when
    const texts = [cache.textOf(columnOf('a', DataType.TEXT), entry, false), cache.textOf(columnOf('b', DataType.TEXT), entry, false)];

    // then
    expect(texts).toEqual(['x', 'y']);
  });

  function columnOf(name: string, dataType: DataType): Column {
    return { name, dataType, width: 10 };
  }
});
