import { Column, ComputeOperator, DataType, TimeUnit } from 'app/shared/model';
import { ColumnRole } from './column-profile';
import { ColumnProfiler } from './column-profiler';

describe('ColumnProfiler', () => {

  const DAY = 86_400_000;
  const T0 = new Date(2024, 0, 1).getTime();

  let profiler: ColumnProfiler;

  beforeEach(() => {
    profiler = new ColumnProfiler();
  });

  function column(name: string, dataType: DataType): Column {
    return { name, dataType, width: 10 };
  }

  function entriesOf(name: string, values: unknown[]): object[] {
    return values.map(v => ({ [name]: v }));
  }

  it('#profile should ignore computed columns', () => {

    // given
    const share: Column = {
      ...column('Share', DataType.NUMBER), indexed: false,
      computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Amount' }
    };
    const entries = entriesOf('Share', [1, 2, 3, 4, 5]);

    // when
    const profiles = profiler.profile([share], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should classify text column with few distinct values as category', () => {

    // given
    const entries = entriesOf('Level', ['INFO', 'WARN', 'ERROR', 'INFO']);

    // when
    const profiles = profiler.profile([column('Level', DataType.TEXT)], entries);

    // then
    expect(profiles).toEqual([{
      name: 'Level', dataType: DataType.TEXT, role: ColumnRole.CATEGORY, distinctCount: 3, presentCount: 4, maxValueCount: 2
    }]);
  });

  it('#profile should classify boolean column as category', () => {

    // given
    const entries = entriesOf('Done', [true, false, true]);

    // when
    const profiles = profiler.profile([column('Done', DataType.BOOLEAN)], entries);

    // then
    expect(profiles.length).toBe(1);
    expect(profiles[0].role).toBe(ColumnRole.CATEGORY);
    expect(profiles[0].dataType).toBe(DataType.BOOLEAN);
    expect(profiles[0].distinctCount).toBe(2);
  });

  it('#profile should exclude text column with single distinct value', () => {

    // given
    const entries = entriesOf('Level', ['INFO', 'INFO', 'INFO']);

    // when
    const profiles = profiler.profile([column('Level', DataType.TEXT)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should exclude text column exceeding maximum categories', () => {

    // given
    const values = Array.from({ length: 40 }, (_, i) => 'v' + (i % 31));
    const entries = entriesOf('Name', values);

    // when
    const profiles = profiler.profile([column('Name', DataType.TEXT)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should exclude text column with more distinct values than collected categories', () => {

    // given
    const values = Array.from({ length: 40 }, (_, i) => 'v' + i);
    const entries = entriesOf('Name', values);

    // when
    const profiles = profiler.profile([column('Name', DataType.TEXT)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should exclude column with less than half of values present', () => {

    // given
    const entries = entriesOf('Level', ['INFO', 'WARN', null, undefined, null]);

    // when
    const profiles = profiler.profile([column('Level', DataType.TEXT)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should classify number column with repeated values as measure', () => {

    // given
    const entries = entriesOf('Amount', [1.5, 2, 3, 2, 1.5]);

    // when
    const profiles = profiler.profile([column('Amount', DataType.NUMBER)], entries);

    // then
    expect(profiles).toEqual([{
      name: 'Amount', dataType: DataType.NUMBER, role: ColumnRole.MEASURE, distinctCount: 3, presentCount: 5
    }]);
  });

  it('#profile should exclude number column with distinct integer values only as identifier', () => {

    // given
    const entries = entriesOf('ID', [1, 2, 3, 4, 5]);

    // when
    const profiles = profiler.profile([column('ID', DataType.NUMBER)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should exclude number column with less than minimum distinct values', () => {

    // given
    const entries = entriesOf('Amount', [1.5, 2.5, 1.5, 2.5]);

    // when
    const profiles = profiler.profile([column('Amount', DataType.NUMBER)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should classify time column with grouping time unit of value range', () => {

    // given
    const entries = entriesOf('Time', [T0, T0 + 5 * DAY, T0 + 5 * DAY, T0 + 20 * DAY]);

    // when
    const profiles = profiler.profile([column('Time', DataType.TIME)], entries);

    // then
    expect(profiles.length).toBe(1);
    expect(profiles[0].role).toBe(ColumnRole.TIME);
    expect(profiles[0].dataType).toBe(DataType.TIME);
    expect(profiles[0].groupingTimeUnit).toBe(TimeUnit.DAY);
    expect(profiles[0].distinctCount).toBe(3);
    expect(profiles[0].presentCount).toBe(4);
  });

  it('#profile should compute time bucket count of time column', () => {

    // given
    const entries = entriesOf('Time', [T0, T0 + 3 * DAY, T0 + 10.5 * DAY]);

    // when
    const profiles = profiler.profile([column('Time', DataType.TIME)], entries);

    // then
    expect(profiles[0].groupingTimeUnit).toBe(TimeUnit.DAY);
    expect(profiles[0].timeBucketCount).toBe(11);
  });

  it('#profile should exclude time column with millisecond range only', () => {

    // given
    const entries = entriesOf('Time', [T0, T0 + 1_000, T0 + 2_000]);

    // when
    const profiles = profiler.profile([column('Time', DataType.TIME)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should exclude object column', () => {

    // given
    const entries = entriesOf('Data', [{ a: 1 }, { a: 2 }, { a: 3 }]);

    // when
    const profiles = profiler.profile([column('Data', DataType.OBJECT)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should not modify given columns', () => {

    // given
    const columns = [column('Level', DataType.TEXT), column('Amount', DataType.NUMBER), column('Time', DataType.TIME)];
    const entries = [
      { Level: 'INFO', Amount: 1.5, Time: T0 },
      { Level: 'WARN', Amount: 2.5, Time: T0 + 15 * DAY },
      { Level: 'INFO', Amount: 3.5, Time: T0 + 30 * DAY }
    ];
    const expected = structuredClone(columns);

    // when
    const profiles = profiler.profile(columns, entries);

    // then
    expect(profiles.map(p => p.name)).toEqual(['Level', 'Amount', 'Time']);
    expect(columns).toEqual(expected);
  });

  it('#profile should return no profiles without entries', () => {

    // given
    const timeColumn = { ...column('Time', DataType.TIME), groupingTimeUnit: TimeUnit.DAY };
    const columns = [column('Level', DataType.TEXT), column('Amount', DataType.NUMBER), timeColumn];

    // when
    const profiles = profiler.profile(columns, []);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should count present values', () => {

    // given
    const entries = entriesOf('Level', ['INFO', null, 'WARN', undefined, 'INFO', '']);

    // when
    const profiles = profiler.profile([column('Level', DataType.TEXT)], entries);

    // then
    expect(profiles[0].presentCount).toBe(4);
    expect(profiles[0].distinctCount).toBe(3);
  });

  it('#profile should count non-numeric values of number column as present', () => {

    // given
    const entries = entriesOf('Amount', [1.5, 2.5, 3.5, 'n/a']);

    // when
    const profiles = profiler.profile([column('Amount', DataType.NUMBER)], entries);

    // then
    expect(profiles[0].presentCount).toBe(4);
  });

  it('#profile should not count missing values of number column as present', () => {

    // given
    const entries = entriesOf('Amount', [1.5, null, 2.5, undefined, 3.5, 1.5]);

    // when
    const profiles = profiler.profile([column('Amount', DataType.NUMBER)], entries);

    // then
    expect(profiles[0].presentCount).toBe(4);
    expect(profiles[0].distinctCount).toBe(3);
  });

  it('#profile should exclude number column with less than half of values numeric', () => {

    // given
    const entries = entriesOf('Amount', [1.5, 2.5, 3.5, 'a', 'b', 'c', 'd']);

    // when
    const profiles = profiler.profile([column('Amount', DataType.NUMBER)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should exclude time column with less than half of values numeric', () => {

    // given
    const entries = entriesOf('Time', [T0, T0 + 20 * DAY, 'x', 'y', 'z']);

    // when
    const profiles = profiler.profile([column('Time', DataType.TIME)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should not count non-numeric values as distinct values of measure', () => {

    // given
    const entries = entriesOf('Amount', [1.5, 2.5, 1.5, 2.5, 'a', 'b']);

    // when
    const profiles = profiler.profile([column('Amount', DataType.NUMBER)], entries);

    // then
    expect(profiles).toEqual([]);
  });

  it('#profile should not classify number column with distinct integers and non-numeric values as identifier', () => {

    // given
    const entries = entriesOf('Amount', [1, 2, 3, 4, 'n/a']);

    // when
    const profiles = profiler.profile([column('Amount', DataType.NUMBER)], entries);

    // then
    expect(profiles.length).toBe(1);
    expect(profiles[0].role).toBe(ColumnRole.MEASURE);
    expect(profiles[0].distinctCount).toBe(4);
    expect(profiles[0].presentCount).toBe(5);
  });

  it('#profile should compute maximum value count of category', () => {

    // given
    const entries = entriesOf('Level', ['INFO', 'WARN', 'INFO', 'ERROR', 'INFO', 'WARN']);

    // when
    const profiles = profiler.profile([column('Level', DataType.TEXT)], entries);

    // then
    expect(profiles[0].maxValueCount).toBe(3);
  });

  it('#profile should compute maximum value count of time column', () => {

    // given
    const entries = entriesOf('Time', [T0, T0 + 20 * DAY, T0 + 20 * DAY, T0, T0 + 20 * DAY, T0 + 10 * DAY]);

    // when
    const profiles = profiler.profile([column('Time', DataType.TIME)], entries);

    // then
    expect(profiles[0].maxValueCount).toBe(3);
  });
});
