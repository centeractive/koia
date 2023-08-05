import { TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { ValueRange } from 'app/shared/value-range/model';

/** 
 * @returns <true> if the value range was adjusted, <false> otherwise
 */
export function adjustTimeValueRange(start: number, end: number, valueRange: ValueRange, timeUnit: TimeUnit): boolean {
    let min = valueRange.min;
    let max = valueRange.max;
    let maxExcluding = valueRange.maxExcluding;
    if (timeUnit === TimeUnit.MILLISECOND) {
        maxExcluding = false;
    } else {
        if (min != start) {
            min = DateTimeUtils.startOf(min, timeUnit);
            if (min < start) {
                min = start;
            }
        }
        if (max === end) {
            maxExcluding = false;
        } else {
            max = DateTimeUtils.startOf(max, timeUnit);
            maxExcluding = true;
        }
    }
    if (min != valueRange.min || max != valueRange.max || !!maxExcluding != !!valueRange.maxExcluding) {
        valueRange.min = min;
        valueRange.max = max;
        valueRange.maxExcluding = maxExcluding;
        return true;
    } else {
        return false;
    }
}