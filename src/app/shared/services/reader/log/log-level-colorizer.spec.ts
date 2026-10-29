import { ColumnPair, DataType } from 'app/shared/model';
import { LogLevelColorizer } from './log-level-colorizer';

describe('LogLevelColorizer', () => {

   function pair(source: string, target = source): ColumnPair {
      return {
         source: { name: source, dataType: DataType.TEXT, width: 10 },
         target: { name: target, dataType: DataType.TEXT, width: 10 }
      };
   }

   function colorized(colorizer: LogLevelColorizer, entry: object): object {
      colorizer.colorize(entry);
      return entry;
   }

   it('#colorize should color error and warn entries', () => {

      // given
      const colorizer = LogLevelColorizer.of([pair('Message'), pair('Level')], 'Level', 'en');

      // when
      const error = colorized(colorizer, { Level: 'ERROR' });
      const warn = colorized(colorizer, { Level: 'warn' });

      // then
      expect(error).toEqual({ Level: 'ERROR', bgcolor: '#ff785a' });
      expect(warn).toEqual({ Level: 'warn', bgcolor: '#fed255' });
   });

   it.each([
      ['info level', { Level: 'INFO' }],
      ['missing level', { Message: 'started' }],
      ['numeric level', { Level: 3 }]
   ])('#colorize should not color entry with %s', (_, entry) => {

      // given
      const colorizer = LogLevelColorizer.of([pair('Message'), pair('Level')], 'Level', 'en');

      // when
      const result = colorized(colorizer, { ...entry });

      // then
      expect(result).toEqual(entry);
   });

   it('#colorize should color entry by level of specified language', () => {

      // given
      const colorizer = LogLevelColorizer.of([pair('Level')], 'Level', 'de');

      // when
      const entry = colorized(colorizer, { Level: 'Warnung' });

      // then
      expect(entry).toEqual({ Level: 'Warnung', bgcolor: '#fed255' });
   });

   it('#colorize should read level of renamed target column', () => {

      // given
      const colorizer = LogLevelColorizer.of([pair('Level', 'Severity')], 'Level', 'en');

      // when
      const entry = colorized(colorizer, { Severity: 'FATAL' });

      // then
      expect(entry).toEqual({ Severity: 'FATAL', bgcolor: '#ff785a' });
   });

   it('#of should give no colorizer without level column', () => {
      expect(LogLevelColorizer.of([pair('Level')], undefined, 'en')).toBeUndefined();
   });

   it('#of should give no colorizer when level column is skipped', () => {

      // given
      const levelPair = { ...pair('Level'), skip: true };

      // when
      const colorizer = LogLevelColorizer.of([pair('Message'), levelPair], 'Level', 'en');

      // then
      expect(colorizer).toBeUndefined();
   });

   it('#of should ignore ID mapping when level column is named like it', () => {

      // given
      const idPair = { ...pair('ID'), sequence: true };

      // when
      const colorizer = LogLevelColorizer.of([idPair], 'ID', 'en');

      // then
      expect(colorizer).toBeUndefined();
   });

   it('#of should give no colorizer when only pattern column has level source', () => {

      // given
      const levelPair = pair('Level');
      levelPair.target.patternOf = 'Level';

      // when
      const colorizer = LogLevelColorizer.of([levelPair], 'Level', 'en');

      // then
      expect(colorizer).toBeUndefined();
   });

   it('#of should give no colorizer when adopted columns lack level source', () => {
      expect(LogLevelColorizer.of([pair('Time'), pair('Message')], 'Level', 'en')).toBeUndefined();
   });

   it.each(['bgcolor', 'fgcolor'])('#of should give no colorizer when data has %s column', colorColumn => {
      expect(LogLevelColorizer.of([pair('Level'), pair(colorColumn)], 'Level', 'en')).toBeUndefined();
   });
});
