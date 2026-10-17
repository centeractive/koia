import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType, Margin } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { ChartData, Scale } from 'chart.js';
import { DateTime } from 'luxon';
import { ChartJsOptionsProvider } from './chartjs-options-provider';

const COLUMNS: Column[] = [
  { name: 'Time', dataType: DataType.TIME, width: 1 },
  { name: 'Location', dataType: DataType.TEXT, width: 1 },
  { name: 'Name', dataType: DataType.TEXT, width: 1 },
  { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
  { name: 'Percent', dataType: DataType.NUMBER, width: 1 },
];

const provider = new ChartJsOptionsProvider(new RawDataRevealService(null, null));

describe('ChartJsOptionsProvider - PIE', () => {
  it('#provide', () => {
    // when
    const options = provider.provide(context());

    // then
    expect(options).toEqual({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: true,
          callbacks: expect.anything()
        },
        datalabels: {
          display: true,
          formatter: expect.anything()
        }
      },
      layout: {
        padding: margin()
      },
      interaction: {
        mode: 'nearest',
        intersect: true,
      },
      onHover: expect.anything(),
      onClick: expect.anything()
    });
  });

  function context(): ChartContext {
    const context = new ChartContext(COLUMNS, ChartType.PIE.type, margin());
    context.data = data();
    return context;
  }
});

describe('ChartJsOptionsProvider - LINE', () => {
  it('#provide should define time scale options when grouped by time column', () => {

    // given
    const timeColumn = { ...COLUMNS[0], groupingTimeUnit: TimeUnit.MINUTE };
    const context = chartContext(ChartType.LINE, timeColumn);

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x'].type).toBe('time');
    expect(options.scales['x']['time']).toEqual({
      unit: TimeUnit.MINUTE,
      displayFormats: { minute: 'd MMM yyyy HH:mm' },
      tooltipFormat: 'd MMM yyyy HH:mm'
    });
  });
});

describe('ChartJsOptionsProvider - BAR', () => {

  const timeColumn: Column = { ...COLUMNS[0], format: 'MMM yyyy' };
  const times = [1275343200000, 1277935200000];
  const scale = { getLabelForValue: (i: number) => times[i] } as unknown as Scale;

  it('#provide should format time labels of x scale when grouped by time column', () => {

    // given
    const context = chartContext(ChartType.BAR, timeColumn);

    // when
    const options = provider.provide(context);

    // then
    const callback = options.scales['x'].ticks.callback;
    expect(callback.call(scale, 1, 1, [])).toBe(DateTime.fromMillis(times[1]).toFormat('MMM yyyy'));
  });

  it('#provide should format time labels of y scale when horizontal bar is grouped by time column', () => {

    // given
    const context = chartContext(ChartType.HORIZONTAL_BAR, timeColumn);

    // when
    const options = provider.provide(context);

    // then
    const callback = options.scales['y'].ticks.callback;
    expect(callback.call(scale, 0, 0, [])).toBe(DateTime.fromMillis(times[0]).toFormat('MMM yyyy'));
  });

  it('#provide should not define tick callback when grouped by text column', () => {

    // given
    const context = chartContext(ChartType.BAR, COLUMNS[1]);

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x'].ticks?.callback).toBeUndefined();
  });
});

describe('ChartJsOptionsProvider - RADAR', () => {
  it('#provide should define circular grid of radial scale', () => {

    // given
    const context = chartContext(ChartType.RADAR, COLUMNS[1]);

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales).toEqual({ r: { grid: { circular: true } } });
  });
});

function chartContext(chartType: ChartType, groupByColumn: Column): ChartContext {
  const context = new ChartContext(COLUMNS, chartType.type, margin());
  context.dataColumns = [COLUMNS[3]];
  context.groupByColumns = [groupByColumn];
  context.data = data();
  return context;
}

function data(): ChartData {
  return {
    labels: ['A', 'B', 'C'],
    datasets: [
      {
        label: 'Amount',
        data: [90, 55, 47],
      },
      {
        label: 'Discount',
        data: [8, 5, 0],
      },
    ],
  };
}

function margin(): Margin {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}
