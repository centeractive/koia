import { Aggregation, Column, DataType, EnumLabels } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { Chart, ChartConfiguration, ChartData, ScaleOptions, TooltipItem } from 'chart.js';
import { DateTime } from 'luxon';
import { BarLegendCustomizer } from './bar-legend-customizer';

describe('BarLegendCustomizer', () => {

    const nameColumn: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };
    const amountColumn: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
    const timeColumn: Column = { name: 'Time', dataType: DataType.TIME, format: 'd MMM yyyy', width: 10 };
    const times = [1230764400000, 1233442800000, 1235862000000];

    it('#customize - BAR', () => {
        // given
        const data = chartData();
        const ctx = context(ChartType.BAR, data)
        const cfg = config(data);

        // when
        new BarLegendCustomizer(3).customize(ctx, cfg);

        // then
        expect(cfg.options.scales).toEqual({
            x: {
                display: false
            },
            x1: {
                offset: true,
                ticks: {}
            },
            y: {}
        });
    });

    it('#customize - HORIZONTAL_BAR', () => {
        // given
        const data = chartData();
        const ctx = context(ChartType.HORIZONTAL_BAR, data)
        const cfg = config(data);

        // when
        new BarLegendCustomizer(3).customize(ctx, cfg);

        // then
        expect(cfg.options.scales).toEqual({
            x: {},
            y: {
                display: false
            },
            y1: {
                offset: true,
                ticks: {}
            }
        });
    });

    it('#customize should take over tick options except callback since labels are formatted already', () => {
        // given
        const data = chartData();
        const ctx = context(ChartType.BAR, data)
        const cfg = config(data);
        cfg.options.scales.x.ticks = { stepSize: 2, minRotation: 45, maxRotation: 45, callback: v => 'formatted ' + v };

        // when
        new BarLegendCustomizer(3).customize(ctx, cfg);

        // then
        expect(cfg.options.scales['x1'].ticks).toEqual({ stepSize: 2, minRotation: 45, maxRotation: 45 });
    });

    it('#customize should format time labels of datasets when grouped by time column', () => {
        // given
        const data = chartData(times);
        const ctx = context(ChartType.BAR, data, timeColumn);
        const cfg = config(data);

        // when
        new BarLegendCustomizer(3).customize(ctx, cfg);

        // then
        expect(cfg.data.datasets.map(ds => ds.label)).toEqual(times.map(t => DateTime.fromMillis(t).toFormat('d MMM yyyy')));
    });

    it('#customize should label x1 scale with labels of visible datasets', () => {
        // given
        const data = chartData();
        const cfg = config(data);
        new BarLegendCustomizer(3).customize(context(ChartType.BAR, data), cfg);
        const chart = chartHidingSecondDataset(cfg, 'x1');

        // when
        cfg.plugins[0].beforeLayout(chart, { cancelable: true }, {});

        // then
        expect((chart.options.scales['x1'] as ScaleOptions<'category'>).labels).toEqual(['A', 'C']);
    });

    it('#customize should label y1 scale with labels of visible datasets when horizontal bar', () => {
        // given
        const data = chartData();
        const cfg = config(data);
        new BarLegendCustomizer(3).customize(context(ChartType.HORIZONTAL_BAR, data), cfg);
        const chart = chartHidingSecondDataset(cfg, 'y1');

        // when
        cfg.plugins[0].beforeLayout(chart, { cancelable: true }, {});

        // then
        expect((chart.options.scales['y1'] as ScaleOptions<'category'>).labels).toEqual(['A', 'C']);
    });

    it('#customize should show dataset label as tooltip title and data column with value as tooltip label', () => {
        // given
        const data = chartData();
        const cfg = config(data);
        new BarLegendCustomizer(3).customize(context(ChartType.BAR, data), cfg);
        const tooltipItem = { dataset: cfg.data.datasets[1], formattedValue: '8' } as TooltipItem<'bar'>;

        // when
        const title = cfg.options.plugins.tooltip.callbacks.title.call(null, [tooltipItem]);
        const label = cfg.options.plugins.tooltip.callbacks.label.call(null, tooltipItem);

        // then
        expect(title).toBe('B');
        expect(label).toBe('Amount: 8');
    });

    it('#customize should show data column with dataset label as tooltip title and count as tooltip label when counting numbers', () => {
        // given
        const data = chartData();
        const cfg = config(data);
        const ctx = context(ChartType.BAR, data);
        ctx.aggregations = [Aggregation.COUNT];
        ctx.groupByColumns = [nameColumn];
        new BarLegendCustomizer(3).customize(ctx, cfg);
        const tooltipItem = { dataset: cfg.data.datasets[1], formattedValue: '8' } as TooltipItem<'bar'>;

        // when
        const title = cfg.options.plugins.tooltip.callbacks.title.call(null, [tooltipItem]);
        const label = cfg.options.plugins.tooltip.callbacks.label.call(null, tooltipItem);

        // then
        expect(title).toBe('Amount: B');
        expect(label).toBe(EnumLabels.aggregation(Aggregation.COUNT) + ': 8');
    });

    function context(type: ChartType, data: ChartData, groupByColumn = nameColumn): ChartContext {
        const context = new ChartContext([groupByColumn, amountColumn], type.type, null);
        context.dataColumns = [amountColumn];
        context.groupByColumns = [groupByColumn];
        context.data = data;
        return context;
    }

    function config(data: ChartData): ChartConfiguration {
        return {
            type: 'bar',
            data,
            options: {
                plugins: {
                    tooltip: {
                    }
                },
                scales: {
                    x: {},
                    y: {}
                }
            }
        };
    }


    function chartHidingSecondDataset(cfg: ChartConfiguration, baseScaleID: string): Chart {
        return {
            options: { scales: { [baseScaleID]: {} } },
            data: cfg.data,
            getDatasetMeta: (datasetIndex: number) => ({ hidden: datasetIndex === 1 })
        } as unknown as Chart;
    }

    function chartData(labels: unknown[] = ['A', 'B', 'C']): ChartData {
        return {
            labels,
            datasets: [{
                label: '',
                data: [2, 8, 5],
                backgroundColor: ['red', 'green', 'blue'],
                borderColor: ['red', 'green', 'blue']
            }]
        };
    }

});
