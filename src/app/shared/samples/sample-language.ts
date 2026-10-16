export type SampleLanguage = 'en' | 'de' | 'ja';

/**
 * maps an Angular locale ID (e.g. 'de', 'de-CH', 'ja-JP') to the language of the bundled sample data, English by default
 */
export function sampleLanguageOf(localeId: string): SampleLanguage {
   const language = (localeId ?? '').toLowerCase().split('-')[0];
   return language === 'de' || language === 'ja' ? language : 'en';
}
