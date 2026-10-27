import { LANGUAGES } from '../../language/language';
import { LogLevelCategory, LogLevels } from './log-levels';

describe('LogLevels', () => {

   it.each([
      ['error', LogLevelCategory.ERROR],
      ['FATAL', LogLevelCategory.ERROR],
      [' Warning ', LogLevelCategory.WARN],
      ['INFO', LogLevelCategory.OTHER],
      ['finest', LogLevelCategory.OTHER],
      ['Request', undefined],
      [42, undefined],
      [undefined, undefined]
   ])('#categoryOf %s should be %s in English', (value, category) => {
      expect(LogLevels.categoryOf(value, 'en')).toBe(category);
   });

   it('#categoryOf should recognize German level in German only', () => {
      expect(LogLevels.categoryOf('Schwerwiegend', 'de')).toBe(LogLevelCategory.ERROR);
      expect(LogLevels.categoryOf('Schwerwiegend', 'en')).toBeUndefined();
   });

   it('#categoryOf should recognize Japanese level in Japanese only', () => {
      expect(LogLevels.categoryOf('警告', 'ja')).toBe(LogLevelCategory.WARN);
      expect(LogLevels.categoryOf('警告', 'de')).toBeUndefined();
   });

   it('#namesOf English should contain no names of other languages', () => {

      // when
      const names = LogLevels.namesOf('en');

      // then
      expect(names).toContain('WARNING');
      expect(names).not.toContain('WARNUNG');
      expect(names).not.toContain('警告');
   });

   it.each(LANGUAGES)('#namesOf %s should be sorted longest first', language => {

      // when
      const names = LogLevels.namesOf(language);

      // then
      expect(names.map(n => n.length)).toEqual(names.map(n => n.length).sort((a, b) => b - a));
   });

   it.each(LANGUAGES)('#namesOf %s should consist of letters and spaces only', language => {
      expect(LogLevels.namesOf(language).filter(name => !/^[\p{L} ]+$/u.test(name))).toEqual([]);
   });

   it.each([
      [LogLevelCategory.ERROR, '#ff785a'],
      [LogLevelCategory.WARN, '#fed255'],
      [LogLevelCategory.OTHER, undefined]
   ])('#bgColorOf %s should be %s', (category, color) => {
      expect(LogLevels.bgColorOf(category)).toBe(color);
   });
});
