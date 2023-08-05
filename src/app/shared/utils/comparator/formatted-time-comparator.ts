import { TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';

export function compareFormattedTime(v1: string, v2: string, timeUnit: TimeUnit): number {
    const luxonFormat = DateTimeUtils.luxonFormatOf(timeUnit);
    const t1 = toDate(v1, luxonFormat).getTime();
    const t2 = toDate(v2, luxonFormat).getTime();
    if (t1 === t2) {
        return 0;
    }
    return t1 < t2 ? -1 : 1;
}

function toDate(formattedTime: string, luxonFormat: string): Date {
    return DateTimeUtils.parseDate(formattedTime, luxonFormat);
}