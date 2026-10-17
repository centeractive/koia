import { Aggregation, Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import { DateTime } from 'luxon';
import { BarLegendCustomizer } from './bar-legend-customizer';

describe('BarLegendCustomizer', () => {

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

    it('#customize should define labels of visible datasets before layout of BAR', () => {
        // given
        const data = chartData();
        const ctx = context(ChartType.BAR, data)
        const cfg = config(data);
        new BarLegendCustomizer(3).customize(ctx, cfg);
        const chart = { options: { scales: { x1: {} } }, data: cfg.data, getDatasetMeta: (i: number) => ({ hidden: i === 1 }) };

        // when
        cfg.plugins[0].beforeLayout(chart as unknown as Chart, undefined, undefined);

        // then
        expect(chart.options.scales.x1).toEqual({ labels: ['A', 'C'] });
    });

    it('#customize should define labels of visible datasets before layout of HORIZONTAL_BAR', () => {
        // given
        const data = chartData();
        const ctx = context(ChartType.HORIZONTAL_BAR, data)
        const cfg = config(data);
        new BarLegendCustomizer(3).customize(ctx, cfg);
        const chart = { options: { scales: { y1: {} } }, data: cfg.data, getDatasetMeta: (i: number) => ({ hidden: i === 0 }) };

        // when
        cfg.plugins[0].beforeLayout(chart as unknown as Chart, undefined, undefined);

        // then
        expect(chart.options.scales.y1).toEqual({ labels: ['B', 'C'] });
    });

    it('#customize should format time labels', () => {
        // given
        const times = [1275343200000, 1277935200000];
        const data = chartData();
        data.labels = times;
        data.datasets[0].data = [2, 8];
        const colTime: Column = { name: 'Time', dataType: DataType.TIME, width: 10, format: 'MMM yyyy' };
        const colAmount: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
        const ctx = new ChartContext([colTime, colAmount], ChartType.BAR.type, null);
        ctx.dataColumns = [colAmount];
        ctx.groupByColumns = [colTime];
        ctx.data = data;
        const cfg = config(data);

        // when
        new BarLegendCustomizer(3).customize(ctx, cfg);

        // then
        expect(cfg.data.datasets.map(ds => ds.label)).toEqual(times.map(t => DateTime.fromMillis(t).toFormat('MMM yyyy')));
    });

    it('#customize should define count tooltip title with data column name', () => {
        // given
        const data = chartData();
        const ctx = context(ChartType.BAR, data)
        ctx.aggregations = [Aggregation.COUNT];
        const cfg = config(data);

        // when
        new BarLegendCustomizer(3).customize(ctx, cfg);

        // then
        const title = cfg.options.plugins.tooltip.callbacks.title as (ctx: object[]) => string;
        expect(title([{ dataset: { label: '5' } }])).toBe('Amount: 5');
    });

    function context(type: ChartType, data: ChartData): ChartContext {
        const colName: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };
        const colAmount: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
        const context = new ChartContext([colName, colAmount], type.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colName];
        context.data = data;
        return context;
    }

    function config(data: ChartData): ChartConfiguration {
        const config: any = {
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
        return config as ChartConfiguration;
    }


    function chartData(): ChartData {
        return {
            labels: ['A', 'B', 'C'],
            datasets: [{
                label: '',
                data: [2, 8, 5],
                backgroundColor: ['red', 'green', 'blue'],
                borderColor: ['red', 'green', 'blue']
            }]
        };
    }

});
