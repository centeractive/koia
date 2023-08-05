import { TimeUnit } from 'app/shared/model';
import { ValueRange } from 'app/shared/value-range/model';
import { DateTime } from 'luxon';
import { adjustTimeValueRange } from './adjust-time-value-range';

describe('adjust-time-value-range', () => {

    it('#adjustTimeValueRange MILLISECOND', () => {
        // given
        const start = toTime('01.01.2023 06:01:05 123');
        const end = toTime('01.01.2023 12:18:16 895');
        const valueRangeOrig: ValueRange = { min: start + 564, max: end - 844 };
        const valueRange: ValueRange = { ...valueRangeOrig };

        // when
        const adjusted = adjustTimeValueRange(start, end, valueRange, TimeUnit.MILLISECOND);

        // then
        expect(adjusted).toBeFalse();
        expect(valueRange).toEqual(valueRangeOrig);
    });

    it('#adjustTimeValueRange when min and max have to be adjusted', () => {
        // given
        const start = toTime('01.01.2023 06:01:05 123');
        const end = toTime('01.01.2023 12:18:16 895');
        const valueRange: ValueRange = { min: start + 5_000, max: end - 5_000 };

        // when
        const adjusted = adjustTimeValueRange(start, end, valueRange, TimeUnit.SECOND);

        // then
        expect(adjusted).toBeTrue();
        const expectedMin = toTime('01.01.2023 06:01:10 000');
        const expectedMax = toTime('01.01.2023 12:18:11 000');
        expect(valueRange).toEqual({ min: expectedMin, max: expectedMax, maxExcluding: true });
    });

    it('#adjustTimeValueRange when adjusted min is before start', () => {
        // given
        const start = toTime('01.01.2023 06:01:05 123');
        const end = toTime('01.01.2023 12:18:16 895');
        const valueRange: ValueRange = { min: start + 10_000, max: end };

        // when
        const adjusted = adjustTimeValueRange(start, end, valueRange, TimeUnit.MINUTE);

        // then
        expect(adjusted).toBeTrue();
        expect(valueRange).toEqual({ min: start, max: end, maxExcluding: false });
    });

    function toTime(s: string): number {
        return DateTime.fromFormat(s, 'dd.MM.yyyy HH:mm:ss SSS').toMillis();
    }
});