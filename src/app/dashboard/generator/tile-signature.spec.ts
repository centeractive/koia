import { Column, DataType, ElementContext, SummaryContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { TileSignature } from './tile-signature';

describe('TileSignature', () => {

  const LEVEL: Column = { name: 'Level', dataType: DataType.TEXT, width: 10 };
  const REGION: Column = { name: 'Region', dataType: DataType.TEXT, width: 10 };
  const CHANNEL: Column = { name: 'Channel', dataType: DataType.TEXT, width: 10 };
  const COLUMNS = [LEVEL, REGION, CHANNEL];

  function withColumns<T extends ElementContext>(context: T, data: Column[], groupBy: Column[], split: Column[]): T {
    context.dataColumns = data;
    context.groupByColumns = groupBy;
    context.splitColumns = split;
    return context;
  }

  function chartContext(chartType: ChartType): ChartContext {
    return new ChartContext(COLUMNS, chartType.type, { top: 0, right: 0, bottom: 0, left: 0 });
  }

  it('#of should not depend on column order and duplicates', () => {

    // when
    const signature1 = TileSignature.of('chart', ['b', 'a', 'c']);
    const signature2 = TileSignature.of('chart', ['c', 'a', 'b', 'a']);

    // then
    expect(signature1).toBe('chart:a|b|c');
    expect(signature2).toBe(signature1);
  });

  it('#of should distinguish summary table from chart', () => {

    // when
    const tableSignature = TileSignature.of('table', ['a', 'b']);
    const chartSignature = TileSignature.of('chart', ['a', 'b']);

    // then
    expect(tableSignature).toBe('table:a|b');
    expect(tableSignature).not.toBe(chartSignature);
  });

  it('#ofContext should equal signature of spec with same columns', () => {

    // given
    const context = withColumns(chartContext(ChartType.LINE), [LEVEL], [REGION], [CHANNEL]);

    // when
    const signature = TileSignature.ofContext(context);

    // then
    expect(signature).toBe(TileSignature.of('chart', ['Channel', 'Level', 'Region']));
  });

  it('#keyOfContext should include chart type', () => {

    // given
    const context = withColumns(chartContext(ChartType.BAR), [LEVEL], [], []);

    // when
    const key = TileSignature.keyOfContext(context);

    // then
    expect(key).toBe('chart:Level#bar');
  });

  it('#ofContext should derive kind from context type', () => {

    // given
    const contexts = [
      withColumns(new SummaryContext(COLUMNS), [LEVEL], [REGION], []),
      withColumns(chartContext(ChartType.LINE), [LEVEL], [REGION], []),
      withColumns(new GraphContext(COLUMNS), [LEVEL], [REGION], [])
    ];

    // when
    const signatures = contexts.map(c => TileSignature.ofContext(c));

    // then
    expect(signatures).toEqual(['table:Level|Region', 'chart:Level|Region', 'graph:Level|Region']);
  });

  it('#keyOfContext should equal key of spec with same columns and chart type', () => {

    // given
    const context = withColumns(chartContext(ChartType.PIE), [LEVEL], [], []);
    const specKey = TileSignature.keyOf(TileSignature.of('chart', ['Level']), ChartType.PIE.type);

    // when
    const key = TileSignature.keyOfContext(context);

    // then
    expect(key).toBe(specKey);
  });

  it('#keyOfContext should end without chart type for summary context', () => {

    // given
    const context = withColumns(new SummaryContext(COLUMNS), [LEVEL], [REGION], []);

    // when
    const key = TileSignature.keyOfContext(context);

    // then
    expect(key).toBe('table:Level|Region#');
  });
});
