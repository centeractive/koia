import { Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartOptions, TooltipItem } from 'chart.js';
import { DateTime } from 'luxon';
import { TooltipCustomizer } from './tooltip-customizer';

describe('TooltipCustomizer', () => {

    const colTime: Column = { name: 'Time', dataType: DataType.TIME, width: 10, format: 'MMM yyyy' };
    const colName: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };
    const colAmount: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
    const customizer = new TooltipCustomizer();

    it('#customize should format time title', () => {
        // given
        const time = 1275343200000;
        const ctx = context(ChartType.BAR, [colAmount]);
        ctx.aggregations = [];
        ctx.groupByColumns = [colTime];
        const opts = options();

        // when
        customizer.customize(ctx, opts);

        // then
        const tooltipItem = { chart: { data: { labels: [time] } }, dataIndex: 0 } as TooltipItem<'bar'>;
        expect(opts.plugins.tooltip.callbacks.title.call(null, [tooltipItem])).toBe(DateTime.fromMillis(time).toFormat('MMM yyyy'));
    });

    it('#customize should define count title with data column name', () => {
        // given
        const ctx = context(ChartType.BAR, [colName]);
        const opts = options();

        // when
        customizer.customize(ctx, opts);

        // then
        const tooltipItem = { chart: { data: { labels: ['a'] } }, dataIndex: 0 } as TooltipItem<'bar'>;
        expect(opts.plugins.tooltip.callbacks.title.call(null, [tooltipItem])).toBe('Name: a');
    });

    it('#customize should define plain title of individual values', () => {
        // given
        const ctx = context(ChartType.BAR, [colAmount]);
        ctx.aggregations = [];
        ctx.groupByColumns = [colName];
        const opts = options();

        // when
        customizer.customize(ctx, opts);

        // then
        const tooltipItem = { chart: { data: { labels: ['a'] } }, dataIndex: 0 } as TooltipItem<'bar'>;
        expect(opts.plugins.tooltip.callbacks.title.call(null, [tooltipItem])).toBe('a');
    });

    it('#customize should define count label', () => {
        // given
        const ctx = context(ChartType.BAR, [colName]);
        const opts = options();

        // when
        customizer.customize(ctx, opts);

        // then
        const tooltipItem = { formattedValue: '3' } as TooltipItem<'bar'>;
        expect(opts.plugins.tooltip.callbacks.label.call(null, tooltipItem)).toBe('Count: 3');
    });

    it('#customize should define PIE label with percentage', () => {
        // given
        const ctx = context(ChartType.PIE, [colAmount]);
        ctx.aggregations = [];
        ctx.groupByColumns = [colName];
        const opts = options();

        // when
        customizer.customize(ctx, opts);

        // then
        const tooltipItem = { datasetIndex: 0, formattedValue: '1', raw: 1, chart: { data: { datasets: [{ data: [1, 3] }] } } } as TooltipItem<'pie'>;
        expect(opts.plugins.tooltip.callbacks.label.call(null, tooltipItem)).toBe('Amount: 1 (25%)');
    });

    it('#customize should not define label of RADAR', () => {
        // given
        const ctx = context(ChartType.RADAR, [colAmount]);
        ctx.aggregations = [];
        ctx.groupByColumns = [colName];
        const opts = options();

        // when
        customizer.customize(ctx, opts);

        // then
        expect(opts.plugins.tooltip.callbacks.label).toBeUndefined();
    });

    function context(chartType: ChartType, dataColumns: Column[]): ChartContext {
        const context = new ChartContext([colTime, colName, colAmount], chartType.type, null);
        context.dataColumns = dataColumns;
        return context;
    }

    function options(): ChartOptions {
        return { plugins: { tooltip: {} } };
    }

});
