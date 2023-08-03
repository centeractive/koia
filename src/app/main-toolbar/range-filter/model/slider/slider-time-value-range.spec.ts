import { TimeUnit } from 'app/shared/model';
import { ValueRange } from 'app/shared/value-range/model';
import { DateTime } from 'luxon';
import { SliderTimeValueRange } from './slider-time-value-range';

const start = toTime('01.01.2023 06:00:00');
const end = toTime('01.01.2023 12:00:00');
let valueRange: ValueRange;

describe('SliderTimeValueRange - full range', () => {

    beforeEach(() => {
        valueRange = { min: start, max: end };
    });

    it('MILLISECOND', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.MILLISECOND);

        expect(range.min).toBe(0);
        expect(range.max).toBe(21_600_000);

        range.min = 5;
        range.max = 21_599_995;

        expect(valueRange.min).toBe(start + 5);
        expect(valueRange.max).toBe(end - 5);
    });

    it('SECOND', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.SECOND);

        expect(range.min).toBe(0);
        expect(range.max).toBe(21_600);

        range.min = 5;
        range.max = 21_595;

        expect(valueRange.min).toBe(start + 5_000);
        expect(valueRange.max).toBe(end - 5_000);
    });

    it('MINUTE', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.MINUTE);

        expect(range.min).toBe(0);
        expect(range.max).toBe(360);

        range.min = 5;
        range.max = 355;

        expect(valueRange.min).toBe(start + 300_000);
        expect(valueRange.max).toBe(end - 300_000);
    });

    it('HOUR', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.HOUR);

        expect(range.min).toBe(0);
        expect(range.max).toBe(6);

        range.min = 2;
        range.max = 4;

        expect(valueRange.min).toBe(start + 7_200_000);
        expect(valueRange.max).toBe(end - 7_200_000);
    });

    it('DAY', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.DAY);

        expect(range.min).toBe(0);
        expect(range.max).toBe(1);

        range.max = 0;

        expect(valueRange.min).toBe(start);
        expect(valueRange.max).toBe(start);
    });

});

describe('SliderTimeValueRange - restricted range', () => {

    beforeEach(() => {
        valueRange = { min: start + 7_200_000, max: end - 7_200_000 };
    });

    it('MILLISECOND', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.MILLISECOND);

        expect(range.min).toBe(7_200_000);
        expect(range.max).toBe(14_400_000);

        range.min = 0;
        range.max = 21_600_000;

        expect(valueRange.min).toBe(start);
        expect(valueRange.max).toBe(end);
    });

    it('SECOND', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.SECOND);

        expect(range.min).toBe(7_200);
        expect(range.max).toBe(14_400);

        range.min = 0;
        range.max = 21_600;

        expect(valueRange.min).toBe(start);
        expect(valueRange.max).toBe(end);
    });

    it('MINUTE', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.MINUTE);

        expect(range.min).toBe(120);
        expect(range.max).toBe(240);

        range.min = 0;
        range.max = 360;

        expect(valueRange.min).toBe(start);
        expect(valueRange.max).toBe(end);
    });

    it('HOUR', () => {
        const range = new SliderTimeValueRange(start, end, valueRange, () => TimeUnit.HOUR);

        expect(range.min).toBe(2);
        expect(range.max).toBe(4);

        range.min = 0;
        range.max = 6;

        expect(valueRange.min).toBe(start);
        expect(valueRange.max).toBe(end);
    });
});

function toTime(s: string): number {
    return DateTime.fromFormat(s, 'dd.MM.yyyy HH:mm:ss').toMillis();
}

function startOf(time: number, timeUnit: TimeUnit): number {
    return DateTime.fromMillis(time).startOf(timeUnit).toMillis();
}