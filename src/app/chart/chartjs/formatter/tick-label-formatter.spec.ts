import { Column, DataType } from 'app/shared/model';
import { Scale, ScaleOptions } from 'chart.js';
import { DateTime } from 'luxon';
import { TickLabelFormatter } from './tick-label-formatter';

describe('TickLabelFormatter', () => {

    const timeColumn: Column = { name: 'Time', dataType: DataType.TIME, format: 'MMM yyyy', width: 1 };
    const amountColumn: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 1 };
    const labels = [1275343200000, 1277935200000];
    const scale = { getLabelForValue: (i: number) => labels[i] } as unknown as Scale;

    const formatter = new TickLabelFormatter();

    it('#format should not change tick callback of non-time column', () => {
        // given
        const options = scaleOptions();
        const callback = options.ticks.callback;

        // when
        formatter.format(amountColumn, options);

        // then
        expect(options.ticks.callback).toBe(callback);
        expect(invokeCallback(options, 15, 0)).toEqual(15);
    });

    it('#format should not change options when column is missing', () => {
        // given
        const options: ScaleOptions = {};

        // when
        formatter.format(undefined, options);

        // then
        expect(options).toEqual({});
    });

    it('#format should format labels of time column', () => {
        // given
        const options = scaleOptions();

        // when
        formatter.format(timeColumn, options);

        // then
        expect(invokeCallback(options, 0, 0)).toBe(formatTime(labels[0], timeColumn.format));
        expect(invokeCallback(options, 1, 1)).toBe(formatTime(labels[1], timeColumn.format));
    });

    it('#format should format label of tick value when it differs from tick index', () => {
        // given
        const options = scaleOptions();

        // when
        formatter.format(timeColumn, options);

        // then
        expect(invokeCallback(options, 1, 0)).toBe(formatTime(labels[1], timeColumn.format));
    });

    it('#format should create ticks options when missing', () => {
        // given
        const options: ScaleOptions = {};

        // when
        formatter.format(timeColumn, options);

        // then
        expect(invokeCallback(options, 0, 0)).toBe(formatTime(labels[0], timeColumn.format));
    });

    function invokeCallback(options: ScaleOptions, value: number, index: number): unknown {
        return options.ticks.callback.call(scale, value, index, []);
    }

    function scaleOptions(): ScaleOptions {
        return {
            ticks: {
                callback: (v: number | string) => v
            }
        } as ScaleOptions;
    }

    function formatTime(time: number, format: string): string {
        return DateTime.fromMillis(time).toFormat(format)
    }

});
