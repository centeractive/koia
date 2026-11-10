export type Language = 'en' | 'de' | 'ja';

export const LANGUAGES: readonly Language[] = ['en', 'de', 'ja'];

export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * query parameter with which a third-party program (e.g. Retrospective) requests the language
 */
export const LANGUAGE_QUERY_PARAM = 'lang';

/**
 * language names in their own language, as shown in the language selection
 */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
   en: 'English',
   de: 'Deutsch',
   ja: '日本語'
};

/**
 * short language names in their own language, as shown on the language button
 */
export const LANGUAGE_ABBREVIATIONS: Readonly<Record<Language, string>> = {
   en: 'EN',
   de: 'DE',
   ja: '日'
};

const LOCALE_IDS: Readonly<Record<Language, string>> = {
   en: 'en-US',
   de: 'de',
   ja: 'ja'
};

/**
 * @returns the supported language of the specified language tag (e.g. 'de', 'de-CH', 'ja_JP'), [[undefined]] when not supported
 */
export function languageOf(tag: string | null | undefined): Language | undefined {
   const language = (tag ?? '').trim().toLowerCase().split(/[-_]/)[0];
   return LANGUAGES.find(l => l === language);
}

/**
 * @returns the Angular locale ID of the specified language, used to format dates and, when neither a fixed number format nor a
 * regional variant of the language applies, numbers
 */
export function localeIdOf(language: Language): string {
   return LOCALE_IDS[language];
}

/**
 * number formats offered in the language menu: automatic, or a fixed one named by a locale that formats numbers that way,
 * 1'234.5 (de-CH), 1,234.5 (en-US), 1.234,5 (de-DE) and 1 234,5 (fr-FR)
 */
export type NumberFormat = 'auto' | 'de-CH' | 'en-US' | 'de-DE' | 'fr-FR';

export const AUTOMATIC_NUMBER_FORMAT: NumberFormat = 'auto';

export const NUMBER_FORMATS: readonly NumberFormat[] = [AUTOMATIC_NUMBER_FORMAT, 'de-CH', 'en-US', 'de-DE', 'fr-FR'];

/**
 * @returns the number format of the specified (e.g. stored) value, [[undefined]] when not supported
 */
export function numberFormatOf(value: string | null): NumberFormat | undefined {
   return NUMBER_FORMATS.find(f => f === value);
}

/**
 * @returns the locale used to format and parse numbers: the locale of a fixed number format, for the automatic one the first
 * of the browser's preferred languages (tags) in the specified language that names a region (e.g. 'de-CH' among 'en-US', 'de',
 * 'de-CH'), else the locale ID of the language; malformed tags are skipped
 */
export function numberLocaleIdOf(language: Language, format: NumberFormat, browserTags: readonly string[]): string {
   if (format !== AUTOMATIC_NUMBER_FORMAT) {
      return format;
   }
   const regional = browserTags.map(localeOf).find(locale => locale?.language === language && !!locale.region);
   return regional?.baseName ?? localeIdOf(language);
}

function localeOf(tag: string): Intl.Locale | undefined {
   try {
      return new Intl.Locale(tag);
   } catch {
      return undefined;
   }
}
