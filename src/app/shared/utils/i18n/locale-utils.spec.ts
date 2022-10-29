import { LocaleUtils } from './locale-utils';

describe('LocaleUtils', () => {

    it('#osDefaultLocale', () => {
        expect(LocaleUtils.osDefaultLocale()).toBeDefined();
    });

    it('#browserDefaultLocale', () => {
        expect(LocaleUtils.browserDefaultLocale()).toBeDefined();
    });

    it('#supportedLocales should include default locales', () => {
        const supportedLocales = LocaleUtils.supportedLocales();

        expect(supportedLocales.includes(LocaleUtils.osDefaultLocale())).toBeTrue();
        expect(supportedLocales.includes(LocaleUtils.browserDefaultLocale())).toBeTrue();
    });

});