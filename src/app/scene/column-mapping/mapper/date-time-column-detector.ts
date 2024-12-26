import { ColumnPair, DataType, TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { DateFormatProvider } from 'app/shared/utils/i18n/date-format-provider';

export class DateTimeColumnDetector {

    /**
     * formats for date/time strings that cannot be parsed by default
     */
    private static readonly TIME_FORMATS_TO_TIMEUNITS: FormatToTimeUnit[] = [
        { format: 'HH:mm:ss,SSS', timeUnit: TimeUnit.MILLISECOND },
        { format: 'HH:mm:ss SSS', timeUnit: TimeUnit.MILLISECOND },
        { format: 'HH:mm:ss SS', timeUnit: TimeUnit.MILLISECOND },
        { format: 'HH:mm:ss S', timeUnit: TimeUnit.MILLISECOND },
        { format: 'HH:mm:ss.SSS', timeUnit: TimeUnit.MILLISECOND },
        { format: 'HH:mm:ss.SS', timeUnit: TimeUnit.MILLISECOND },
        { format: 'HH:mm:ss.S', timeUnit: TimeUnit.MILLISECOND },
        { format: 'HH:mm:ss', timeUnit: TimeUnit.SECOND },
        { format: 'HH:mm', timeUnit: TimeUnit.MINUTE },
        { format: 'HH', timeUnit: TimeUnit.HOUR },
        { format: '', timeUnit: TimeUnit.DAY }
    ];

    private static readonly ZONES = ['', 'Z', 'ZZ', 'ZZZ', 'ZZZZ', 'ZZZZZ', 'O', 'OO', 'OOO', 'OOOO', 'zzzz', 'zzz', 'zz', 'z'];

    private dateFormatProvider = new DateFormatProvider();

    detect(columnPair: ColumnPair, value: string, locale: string): void {
        const dateFormat = this.dateFormatProvider.provide(locale);
        if (this.detectByDateFormat(columnPair, value, dateFormat, locale)) {
            return;
        }
        if (this.detectByDateFormat(columnPair, value, this.dateFormatProvider.default)) {
            return;
        }
        for (const dateFormat of this.dateFormatProvider.distinct()) {
            if (this.detectByDateFormat(columnPair, value, dateFormat, locale)) {
                return;
            }
        }
    }

    private detectByDateFormat(columnPair: ColumnPair, value: string, dateFormat: string, locale?: string): boolean {
        for (const formatToTimeUnit of DateTimeColumnDetector.TIME_FORMATS_TO_TIMEUNITS) {
            const baseFormat = (dateFormat + ' ' + formatToTimeUnit.format).trim();
            for (const zone of DateTimeColumnDetector.ZONES) {
                const format = (baseFormat + ' ' + zone).trim();
                if (DateTimeUtils.parseDate(value, format, locale == '?' ? null : locale)) {
                    columnPair.source.format = format;
                    columnPair.target.dataType = DataType.TIME;
                    if (formatToTimeUnit.timeUnit) {
                        columnPair.target.format = DateTimeUtils.ngFormatOf(formatToTimeUnit.timeUnit);
                    }
                    return true;
                }
            }
        }
        return false;
    }

    refineDateTimeFormat(columnPair: ColumnPair, value: string, locale: string): void {
        for (const formatToTimeUnit of DateTimeColumnDetector.TIME_FORMATS_TO_TIMEUNITS) {
            if (formatToTimeUnit.format && DateTimeUtils.parseDate(value, formatToTimeUnit.format, locale)) {
                columnPair.source.format = formatToTimeUnit.format;
                break;
            }
        }
    }

}

interface FormatToTimeUnit {
    format: string,
    timeUnit: TimeUnit
}