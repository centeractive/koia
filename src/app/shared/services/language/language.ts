export type Language = 'en' | 'de' | 'ja';

export const LANGUAGES: readonly Language[] = ['en', 'de', 'ja'];

export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * language names in their own language, as shown in the language selection
 */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
   en: 'English',
   de: 'Deutsch',
   ja: '日本語'
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
 * @returns the Angular locale ID used to format dates and numbers in the specified language
 */
export function localeIdOf(language: Language): string {
   return LOCALE_IDS[language];
}
