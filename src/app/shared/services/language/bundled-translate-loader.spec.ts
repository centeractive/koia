import { TranslationObject } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { BundledTranslateLoader } from './bundled-translate-loader';

describe('BundledTranslateLoader', () => {

   const loader = new BundledTranslateLoader();

   function languageSelectOf(translations: TranslationObject): unknown {
      return (translations['language'] as TranslationObject)['select'];
   }

   it('#getTranslation should load German translations', async () => {

      // when
      const translations = await firstValueFrom(loader.getTranslation('de'));

      // then
      expect(languageSelectOf(translations)).toBe('Sprache');
   });

   it('#getTranslation should load Japanese translations of language tag with region', async () => {

      // when
      const translations = await firstValueFrom(loader.getTranslation('ja_JP'));

      // then
      expect(languageSelectOf(translations)).toBe('言語');
   });

   it('#getTranslation should load English translations when language is not supported', async () => {

      // when
      const translations = await firstValueFrom(loader.getTranslation('fr'));

      // then
      expect(languageSelectOf(translations)).toBe('Language');
   });
});
