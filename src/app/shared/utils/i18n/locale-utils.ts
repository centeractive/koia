import { DateFormatProvider } from './date-format-provider';

export class LocaleUtils {

    static dateFormatProvider = new DateFormatProvider();

    static osDefaultLocale(): string {
        return navigator.language;
    }

    static browserDefaultLocale(): string {
        return Intl.DateTimeFormat().resolvedOptions().locale;
    }

    static allLocales(): string[] {
        return this.dateFormatProvider.localeKeys();
    }

    static supportedLocales(): string[] {
        return this.allLocales()
            .map(l => {
                try {
                    return Intl.DisplayNames.supportedLocalesOf([l])[0];
                } catch {
                    return null;
                }
            })
            .filter(l => l);
    }

}