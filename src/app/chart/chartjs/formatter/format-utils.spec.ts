import { BubbleDataPoint, ScatterDataPoint } from 'chart.js';
import { FormatUtils } from './format-utils';

describe('FormatUtils', () => {

    it('#percentage when some data is missing (number)', () => {

        // when
        const formatted = FormatUtils.percentage([undefined, 4, 8, null, 6], 2);

        // then
        expect(formatted).toBe('11.1%');
    });

    it('#percentage when value is missing (number)', () => {

        // when
        const formatted = FormatUtils.percentage([3, 4, 8, 6], undefined);

        // then
        expect(formatted).toBe('');
    });

    it('#percentage when data contains missing y (ScatterDataPoint)', () => {

        // given
        const data: ScatterDataPoint[] = [
            { x: 1, y: undefined },
            { x: 2, y: 5 },
            { x: 3, y: null },
            { x: 4, y: 10 }
        ];

        // when
        const formatted = FormatUtils.percentage(data, 5);

        // then
        expect(formatted).toBe('33.3%');
    });

    it('#percentage when value is missing (ScatterDataPoint)', () => {

        // given
        const data: ScatterDataPoint[] = [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 3 },
            { x: 4, y: 4 }
        ];

        // when
        const formatted = FormatUtils.percentage(data, undefined);

        // then
        expect(formatted).toBe('');
    });

    it('#percentage when data contains missing y (BubbleDataPoint)', () => {

        // given
        const data: BubbleDataPoint[] = [
            { x: 1, y: undefined, r: 3 },
            { x: 2, y: 5, r: 3 },
            { x: 3, y: null, r: 3 },
            { x: 4, y: 10, r: 3 }
        ];

        // when
        const formatted = FormatUtils.percentage(data, 5);

        // then
        expect(formatted).toBe('33.3%');
    });

    it('#percentage when value is missing (BubbleDataPoint)', () => {

        // given
        const data: BubbleDataPoint[] = [
            { x: 1, y: 1, r: 3 },
            { x: 2, y: 2, r: 3 },
            { x: 3, y: 3, r: 3 },
            { x: 4, y: 4, r: 3 }
        ];

        // when
        const formatted = FormatUtils.percentage(data, undefined);

        // then
        expect(formatted).toBe('');
    });

});