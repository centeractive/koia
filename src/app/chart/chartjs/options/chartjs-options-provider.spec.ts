import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType, Margin } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { Chart, ChartData, RadialLinearScaleOptions, Scale, registerables } from 'chart.js';
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
    const context = new ChartContext(COLUMNS, ChartType.LINE.type, margin());
    context.dataColumns = [COLUMNS[3]];
    context.groupByColumns = [timeColumn];
    context.data = data();

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
    const context = barContext(ChartType.BAR, timeColumn);

    // when
    const options = provider.provide(context);

    // then
    const callback = options.scales['x'].ticks.callback;
    expect(callback.call(scale, 1, 1, [])).toBe(DateTime.fromMillis(times[1]).toFormat('MMM yyyy'));
  });

  it('#provide should format time labels of y scale when horizontal bar is grouped by time column', () => {

    // given
    const context = barContext(ChartType.HORIZONTAL_BAR, timeColumn);

    // when
    const options = provider.provide(context);

    // then
    const callback = options.scales['y'].ticks.callback;
    expect(callback.call(scale, 0, 0, [])).toBe(DateTime.fromMillis(times[0]).toFormat('MMM yyyy'));
  });

  it('#provide should not define tick callback when grouped by text column', () => {

    // given
    const context = barContext(ChartType.BAR, COLUMNS[1]);

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x'].ticks?.callback).toBeUndefined();
  });

  function barContext(chartType: ChartType, groupByColumn: Column): ChartContext {
    const context = new ChartContext(COLUMNS, chartType.type, margin());
    context.dataColumns = [COLUMNS[3]];
    context.groupByColumns = [groupByColumn];
    context.data = data();
    return context;
  }
});

describe('ChartJsOptionsProvider - PIE datalabels', () => {

  it('#provide should format datalabel as percentage when value as percent is selected', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.PIE.type, margin());
    context.data = data();
    context.valueAsPercent = true;

    // when
    const options = provider.provide(context);

    // then
    const formatter = options.plugins.datalabels.formatter as (v: number, ctx: object) => unknown;
    expect(formatter(1, { dataset: { data: [1, 3] } })).toBe('25%');
  });

  it('#provide should not format datalabel when value as percent is not selected', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.PIE.type, margin());
    context.data = data();
    context.valueAsPercent = false;

    // when
    const options = provider.provide(context);

    // then
    const formatter = options.plugins.datalabels.formatter as (v: number, ctx: object) => unknown;
    expect(formatter(1, { dataset: { data: [1, 3] } })).toBe(1);
  });
});

describe('ChartJsOptionsProvider - interaction', () => {

  it('#provide should show pointer cursor when hovering elements', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.PIE.type, margin());
    context.data = data();
    const options = provider.provide(context);
    const chart = { canvas: { style: { cursor: undefined } } };

    // when
    options.onHover.call(undefined, undefined, [{}], chart);

    // then
    expect(chart.canvas.style.cursor).toBe('pointer');
  });

  it('#provide should show default cursor when hovering no elements', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.PIE.type, margin());
    context.data = data();
    const options = provider.provide(context);
    const chart = { canvas: { style: { cursor: undefined } } };

    // when
    options.onHover.call(undefined, undefined, [], chart);

    // then
    expect(chart.canvas.style.cursor).toBe('default');
  });

  it('#provide should not reveal raw data when clicking no elements', () => {

    // given
    const rawDataRevealService = new RawDataRevealService(null, null);
    vi.spyOn(rawDataRevealService, 'ofID');
    vi.spyOn(rawDataRevealService, 'ofQuery');
    vi.spyOn(rawDataRevealService, 'ofTimeUnit');
    const context = new ChartContext(COLUMNS, ChartType.PIE.type, margin());
    context.data = data();
    const options = new ChartJsOptionsProvider(rawDataRevealService).provide(context);

    // when
    options.onClick.call(undefined, undefined, [], { data: context.data });

    // then
    expect(rawDataRevealService.ofID).not.toHaveBeenCalled();
    expect(rawDataRevealService.ofQuery).not.toHaveBeenCalled();
    expect(rawDataRevealService.ofTimeUnit).not.toHaveBeenCalled();
  });
});

describe('ChartJsOptionsProvider - RADAR', () => {

  it('#provide should define circular r scale with point label callback when grouped by time column', () => {

    // given
    const time = 1275343200000;
    const context = new ChartContext(COLUMNS, ChartType.RADAR.type, margin());
    context.dataColumns = [COLUMNS[3]];
    context.groupByColumns = [{ ...COLUMNS[0], format: 'MMM yyyy' }];
    context.data = data();

    // when
    const options = provider.provide(context);

    // then
    const r = options.scales['r'] as RadialLinearScaleOptions;
    expect(r.grid.circular).toBe(true);
    expect(r.pointLabels.callback.call(undefined, String(time), 0)).toBe(DateTime.fromMillis(time).toFormat('MMM yyyy'));
  });
});

describe('ChartJsOptionsProvider - multi value axes', () => {

  const discountColumn: Column = { name: 'Discount', dataType: DataType.NUMBER, width: 1 };
  const columns = [...COLUMNS, discountColumn];

  beforeAll(() => Chart.register(...registerables));

  it('#provide should define additional vertical value axes', () => {

    // given
    const context = multiAxesContext(ChartType.LINE);

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['y2']['position']).toBe('right');
    expect(options.scales['y3']).toBeDefined();
    expect(options.scales['y3']['position']).toBeUndefined();
  });

  it('#provide should define additional horizontal value axes', () => {

    // given
    const context = multiAxesContext(ChartType.LINEAR_HORIZONTAL_BAR);

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x2']['position']).toBe('top');
    expect(options.scales['x3']).toBeDefined();
    expect(options.scales['x3']['position']).toBeUndefined();
  });

  it('#provide should toggle first vertical value axis when legend of first dataset is clicked', () => {

    // given
    const options = provider.provide(multiAxesContext(ChartType.LINE));
    const legend = legendOf(false);

    // when
    options.plugins.legend.onClick.call(undefined, undefined, { datasetIndex: 0 }, legend);

    // then
    expect(Chart.defaults.plugins.legend.onClick).toHaveBeenCalled();
    expect(legend.chart.isDatasetVisible).toHaveBeenCalledWith(0);
    expect(options.scales['y'].display).toBe(false);
    expect(legend.chart.update).toHaveBeenCalled();
  });

  it('#provide should toggle second vertical value axis when legend of second dataset is clicked', () => {

    // given
    const options = provider.provide(multiAxesContext(ChartType.LINE));
    const legend = legendOf(false);

    // when
    options.plugins.legend.onClick.call(undefined, undefined, { datasetIndex: 1 }, legend);

    // then
    expect(legend.chart.isDatasetVisible).toHaveBeenCalledWith(1);
    expect(options.scales['y2'].display).toBe(false);
    expect(options.scales['y'].display).toBe(true);
  });

  it('#provide should toggle first horizontal value axis when legend of first dataset is clicked', () => {

    // given
    const options = provider.provide(multiAxesContext(ChartType.LINEAR_HORIZONTAL_BAR));
    const legend = legendOf(false);

    // when
    options.plugins.legend.onClick.call(undefined, undefined, { datasetIndex: 0 }, legend);

    // then
    expect(options.scales['x'].display).toBe(false);
    expect(legend.chart.update).toHaveBeenCalled();
  });

  it('#provide should toggle second horizontal value axis when legend of second dataset is clicked', () => {

    // given
    const options = provider.provide(multiAxesContext(ChartType.LINEAR_HORIZONTAL_BAR));
    const legend = legendOf(false);

    // when
    options.plugins.legend.onClick.call(undefined, undefined, { datasetIndex: 1 }, legend);

    // then
    expect(options.scales['x2'].display).toBe(false);
    expect(options.scales['x'].display).toBe(true);
  });

  function multiAxesContext(chartType: ChartType): ChartContext {
    const context = new ChartContext(columns, chartType.type, margin());
    context.multiValueAxes = true;
    context.dataColumns = [COLUMNS[3], COLUMNS[4], discountColumn];
    context.aggregations = [];
    context.groupByColumns = [{ ...COLUMNS[0], groupingTimeUnit: TimeUnit.MINUTE }];
    context.data = data();
    return context;
  }

  function legendOf(datasetVisible: boolean) {
    vi.spyOn(Chart.defaults.plugins.legend, 'onClick').mockImplementation(() => null);
    return {
      chart: {
        isDatasetVisible: vi.fn().mockReturnValue(datasetVisible),
        update: vi.fn()
      }
    };
  }
});

describe('ChartJsOptionsProvider - ticks', () => {

  it('#provide should define step size and rotation of value axis', () => {

    // given
    const context = lineContext();
    context.valueScales[0].ticks.stepSize = 10;
    context.valueScales[0].ticks.rotation = 45;

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['y'].ticks).toEqual({ stepSize: 10, maxRotation: -45, minRotation: -45 });
  });

  it('#provide should define rotation only of value axis', () => {

    // given
    const context = lineContext();
    context.valueScales[0].ticks.rotation = 45;

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['y'].ticks).toEqual({ maxRotation: -45, minRotation: -45 });
  });

  it('#provide should define step size and rotation of base axis', () => {

    // given
    const context = lineContext();
    context.baseScale.ticks.stepSize = 5;
    context.baseScale.ticks.rotation = 30;

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x'].ticks).toEqual({ stepSize: 5, maxRotation: -30, minRotation: -30 });
  });

  it('#provide should define rotation only of base axis', () => {

    // given
    const context = lineContext();
    context.baseScale.ticks.rotation = 30;

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x'].ticks).toEqual({ maxRotation: -30, minRotation: -30 });
  });

  function lineContext(): ChartContext {
    const context = new ChartContext(COLUMNS, ChartType.LINE.type, margin());
    context.dataColumns = [COLUMNS[3]];
    context.groupByColumns = [{ ...COLUMNS[0], groupingTimeUnit: TimeUnit.MINUTE }];
    context.data = data();
    return context;
  }
});

describe('ChartJsOptionsProvider - LINE scales', () => {

  it('#provide should not throw when new context has neither data columns nor value scales', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.LINE.type, margin());
    context.data = { labels: [], datasets: [] };

    // when
    const provide = () => provider.provide(context);

    // then
    expect(provide).not.toThrow();
  });

  it('#provide should not throw when no group-by column is defined', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.LINE.type, margin());
    context.dataColumns = [COLUMNS[3]];
    context.groupByColumns = [];
    context.data = data();

    // when
    const provide = () => provider.provide(context);

    // then
    expect(provide).not.toThrow();
  });

  it('#provide should not define value axis title when two numeric columns are selected', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.LINE.type, margin());
    context.dataColumns = [COLUMNS[3], COLUMNS[4]];
    context.aggregations = [];
    context.groupByColumns = [{ ...COLUMNS[0], groupingTimeUnit: TimeUnit.MINUTE }];
    context.data = data();

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['y']['title']).toEqual({ display: false, text: null });
  });

  it('#provide should define linear base scale with suggested range when grouped by number column', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.LINE.type, margin());
    context.dataColumns = [COLUMNS[4]];
    context.aggregations = [];
    context.groupByColumns = [COLUMNS[3]];
    context.data = {
      datasets: [
        { data: [{ x: 2, y: 1 }, { x: 7, y: 3 }] },
        { data: [{ x: -1, y: 0 }] }
      ]
    };

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x'].type).toBe('linear');
    expect(options.scales['x']['suggestedMin']).toBe(-1);
    expect(options.scales['x']['suggestedMax']).toBe(7);
  });

  it('#provide should define category base scale when grouped by text column', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.LINE.type, margin());
    context.dataColumns = [COLUMNS[3]];
    context.aggregations = [];
    context.groupByColumns = [COLUMNS[1]];
    context.data = data();

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x'].type).toBe('category');
  });

  it('#provide should define tooltip format from column format when grouped by time column without time unit', () => {

    // given
    const context = new ChartContext(COLUMNS, ChartType.LINE.type, margin());
    context.dataColumns = [COLUMNS[3]];
    context.groupByColumns = [{ ...COLUMNS[0], format: 'd.M.yyyy' }];
    context.data = data();

    // when
    const options = provider.provide(context);

    // then
    expect(options.scales['x']['time'].tooltipFormat).toBe('d.M.yyyy');
  });
});

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
