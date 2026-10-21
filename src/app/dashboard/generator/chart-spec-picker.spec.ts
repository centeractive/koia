import { DataType } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ChartSpecPicker } from './chart-spec-picker';
import { ColumnRole } from './column-profile';
import { TileSignature } from './tile-signature';
import { TileSize, TileSpec } from './tile-spec';

describe('ChartSpecPicker', () => {

  let picker: ChartSpecPicker;

  beforeEach(() => {
    picker = new ChartSpecPicker();
  });

  function spec(chartType: ChartType, columnName: string): TileSpec {
    const signature = TileSignature.of(chartType ? 'chart' : 'table', [columnName]);
    return {
      signature, key: TileSignature.keyOf(signature, chartType?.type), chartType,
      dataColumns: [{ name: columnName, dataType: DataType.TEXT, role: ColumnRole.CATEGORY, distinctCount: 3, presentCount: 10 }],
      groupByColumns: [], splitColumns: [], aggregations: [], stacked: false, multiValueAxes: false, showLegend: false,
      legendPosition: 'top', size: TileSize.SMALL, timeChart: false
    };
  }

  it('#next should pick first ranked chart spec of unused chart type', () => {

    // given
    const pieA = spec(ChartType.PIE, 'A');
    const barB = spec(ChartType.BAR, 'B');
    const pieC = spec(ChartType.PIE, 'C');

    // when
    const next = picker.next([pieA, pieC, barB], new Set(), new Set(), new Set([ChartType.PIE]));

    // then
    expect(next).toBe(barB);
  });

  it('#next should pick first ranked chart spec when all chart types are used', () => {

    // given
    const pieA = spec(ChartType.PIE, 'A');
    const barB = spec(ChartType.BAR, 'B');

    // when
    const next = picker.next([pieA, barB], new Set(), new Set(), new Set([ChartType.PIE, ChartType.BAR]));

    // then
    expect(next).toBe(pieA);
  });

  it('#next should skip table specs, accepted signatures and rejected specs', () => {

    // given
    const table = spec(undefined, 'A');
    const accepted = spec(ChartType.PIE, 'B');
    const rejected = spec(ChartType.BAR, 'C');
    const candidate = spec(ChartType.PIE, 'D');

    // when
    const next = picker.next([table, accepted, rejected, candidate], new Set([accepted.signature]), new Set([rejected]),
      new Set([ChartType.PIE]));

    // then
    expect(next).toBe(candidate);
  });

  it('#next should return undefined without candidates', () => {

    // given
    const pieA = spec(ChartType.PIE, 'A');

    // when
    const next = picker.next([pieA], new Set([pieA.signature]), new Set(), new Set());

    // then
    expect(next).toBeUndefined();
  });
});
