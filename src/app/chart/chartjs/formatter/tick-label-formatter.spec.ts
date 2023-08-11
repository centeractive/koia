import { Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ScaleOptions } from 'chart.js';
import { TickLabelFormatter } from './tick-label-formatter';

describe('TickLabelFormatter', () => {

    const timeColumn: Column = { name: 'Time', dataType: DataType.TIME, format: 'MMM yyyy', width: 1 };
    const amountColumn: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 1 };

    const formatter = new TickLabelFormatter();

    it('#format bar chart & non-time column', () => {
        // given
        const context = chartContext(ChartType.BAR);
        const options = scaleOptions();

        // when
        formatter.format(context, amountColumn, options);

        // then
        const ticks = options.ticks as any;
        expect(ticks.callback(15, 0)).toEqual(15);
    });

    it('#format bar chart & time column', () => {
        // given
        const context = chartContext(ChartType.BAR);
        const options = scaleOptions();

        // when
        formatter.format(context, timeColumn, options);

        // then
        const ticks = options.ticks as any;
        expect(ticks.callback(null, 0)).toBe('Jun 2010');
        expect(ticks.callback(null, 1)).toBe('Jul 2010');
    });

    it('#format horizontal bar chart & time column', () => {
        // given
        const context = chartContext(ChartType.HORIZONTAL_BAR);
        const options = scaleOptions();

        // when
        formatter.format(context, timeColumn, options);

        // then
        const ticks = options.ticks as any;
        expect(ticks.callback(null, 0)).toBe('Jun 2010');
        expect(ticks.callback(null, 1)).toBe('Jul 2010');
    });

    it('#format non-bar chart & time column', () => {
        // given
        const context = chartContext(ChartType.PIE);
        const options = scaleOptions();

        // when
        formatter.format(context, timeColumn, options);

        // then
        const ticks = options.ticks as any;
        expect(ticks.callback(1275343200000, 10)).toBe('Jun 2010');
    });

    function chartContext(chartType: ChartType): ChartContext {
        const context = new ChartContext([timeColumn, amountColumn], chartType.type, {});
        context.data = {
            labels: [1275343200000, 1277935200000],
            datasets: []
        };
        return context;
    }

    function scaleOptions(): ScaleOptions {
        return {
            ticks: {
                callback: (v: number) => v
            }
        } as any;
    }

});