import { TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { ValueRangeConverter } from 'app/shared/value-range';

export function compareFormattedTime(v1: string, v2: string, timeUnit: TimeUnit): number {
    try {
        if (isMissing(v1)) {
            return isMissing(v2) ? 0 : -1;
        } else if (isMissing(v2)) {
            return 1;
        }
        const t1 = DateTimeUtils.parseFormattedTime(v1, timeUnit).getTime();
        const t2 = DateTimeUtils.parseFormattedTime(v2, timeUnit).getTime();
        if (t1 === t2) {
            return 0;
        }
        return t1 < t2 ? -1 : 1;
    } catch (e) {
        console.error(v1, v2, timeUnit);
        throw e;
    }
}

function isMissing(v: string): boolean {
    return !v || v === ValueRangeConverter.EMPTY;
}