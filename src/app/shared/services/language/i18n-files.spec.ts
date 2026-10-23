import de from 'assets/i18n/de.json';
import en from 'assets/i18n/en.json';
import ja from 'assets/i18n/ja.json';
import { FORMAL_GERMAN_ADDRESS } from 'app/shared/test/german-address';

describe('translation files', () => {

   /**
    * @returns the translations by their flat key (e.g. 'front.title')
    */
   function flatten(obj: object, prefix = ''): Map<string, unknown> {
      const result = new Map<string, unknown>();
      Object.entries(obj).forEach(([key, value]) => {
         if (value !== null && typeof value === 'object') {
            flatten(value, prefix + key + '.').forEach((v, k) => result.set(k, v));
         } else {
            result.set(prefix + key, value);
         }
      });
      return result;
   }

   function placeholdersOf(text: unknown): string[] {
      return (String(text).match(/{{\s*[\w.]+\s*}}/g) ?? []).map(p => p.replace(/\s/g, '')).sort();
   }

   const english = flatten(en);

   [['de', de], ['ja', ja]].forEach(([language, translations]) => describe(language as string, () => {

      const translated = flatten(translations as object);

      it('should contain same keys as English', () => {
         expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
      });

      it('should contain same placeholders as English', () => {
         english.forEach((text, key) => expect(placeholdersOf(translated.get(key)), key).toEqual(placeholdersOf(text)));
      });
   }));

   [['en', en], ['de', de], ['ja', ja]].forEach(([language, translations]) => {

      it(language + ' should contain non-empty texts only', () => {
         flatten(translations as object).forEach((text, key) => {
            expect(typeof text, key).toBe('string');
            expect((text as string).trim(), key).not.toBe('');
         });
      });
   });

   it('de should address user informally', () => {
      flatten(de).forEach((text, key) => expect(text, key).not.toMatch(FORMAL_GERMAN_ADDRESS));
   });
});
