import { TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { ValueRange } from 'app/shared/value-range/model';

/** 
 * @returns <true> if the value range had to be adjusted, <false> otherwise
 */
export function adjustTimeValueRange(start: number, end: number, valueRange: ValueRange, timeUnit: TimeUnit): boolean {
    let min = valueRange.min;
    let max = valueRange.max;
    if (timeUnit != TimeUnit.MILLISECOND) {
        if (min != start) {
            min = DateTimeUtils.startOf(min, timeUnit);
            if (min < start) {
                min = start;
            }
        }
        if (max != end) {
            max = DateTimeUtils.startOf(max, timeUnit);
        }
        if (min != valueRange.min || max != valueRange.max) {
            valueRange.min = min;
            valueRange.max = max;
            return true;
        }
    }
    return false;
}