import { PivotContextFactory } from './pivot-context-factory';

describe('PivotContextFactory', () => {

   const factory = new PivotContextFactory();

   it('#create should use muted palette ends', () => {

      // when
      const context = factory.create();

      // then
      expect(context.negativeColor).toBe('#E57373');
      expect(context.positiveColor).toBe('#81C784');
   });

   it.each([
      { legacy: '#FF3333', muted: '#E57373' },
      { legacy: '#FF6633', muted: '#FF8A65' },
      { legacy: '#FFFF33', muted: '#FFF176' },
      { legacy: '#0080FF', muted: '#64B5F6' },
      { legacy: '#00FF00', muted: '#81C784' }
   ])('#adoptPalette should replace former palette color $legacy by $muted', ({ legacy, muted }) => {

      // given
      const context = { ...factory.create(), negativeColor: legacy, positiveColor: legacy };

      // when
      factory.adoptPalette(context);

      // then
      expect(context.negativeColor).toBe(muted);
      expect(context.positiveColor).toBe(muted);
   });

   it('#adoptPalette should keep colors outside former palette', () => {

      // given
      const context = { ...factory.create(), negativeColor: 'yellow', positiveColor: 'red' };

      // when
      factory.adoptPalette(context);

      // then
      expect(context.negativeColor).toBe('yellow');
      expect(context.positiveColor).toBe('red');
   });
});
