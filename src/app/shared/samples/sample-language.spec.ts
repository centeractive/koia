import { sampleLanguageOf } from './sample-language';

describe('sampleLanguageOf', () => {

   it('should map German locales to German', () => {
      expect(sampleLanguageOf('de')).toBe('de');
      expect(sampleLanguageOf('de-CH')).toBe('de');
   });

   it('should map Japanese locales to Japanese', () => {
      expect(sampleLanguageOf('ja')).toBe('ja');
      expect(sampleLanguageOf('ja-JP')).toBe('ja');
   });

   it('should fall back to English', () => {
      expect(sampleLanguageOf('en-US')).toBe('en');
      expect(sampleLanguageOf('fr')).toBe('en');
      expect(sampleLanguageOf(undefined)).toBe('en');
   });
});
