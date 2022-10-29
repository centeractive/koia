import { DateFormatProvider } from './date-format-provider';

describe('ColumnMappingGenerator', () => {

    const provider = new DateFormatProvider();

    it('#default', () => {
        expect(provider.default).toBe('yyyy-MM-dd');
    });

    it('#distinct', () => {
        const formats = provider.distinct();
        expect(new Set(formats).size).toBe(formats.length);
    });

    it('#provide when locale is undefined or unknown', () => {
        expect(provider.provide(undefined)).toBe(provider.default);
        expect(provider.provide('xx')).toBe(provider.default);
        expect(provider.provide('xx-CH')).toBe(provider.default);
    });

    it('#provide when locale includes language and country', () => {
        expect(provider.provide('en-AU')).toBe('d/MM/yyyy');
        expect(provider.provide('fr-CH')).toBe('dd.MM.yyyy');
    });

    it('#provide when locale includes language only', () => {
        expect(provider.provide('en')).toBe('dd/MM/yyyy');
        expect(provider.provide('es')).toBe('dd/MM/yyyy');
        expect(provider.provide('fr')).toBe('dd/MM/yyyy');
        expect(provider.provide('nl')).toBe('d-M-yyyy');
    });

});
