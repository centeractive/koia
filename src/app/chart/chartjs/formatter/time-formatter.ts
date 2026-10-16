import { LanguageService } from 'app/shared/services/language';
import { DateTime } from 'luxon';

export abstract class TimeFormatter {

    formatTime(time: string | number, format: string): string {
        if (typeof time === 'string') {
            time = parseInt(time);
        }
        return DateTime.fromMillis(time, { locale: LanguageService.localeId() }).toFormat(format);
    }
}