import { CategoricalColorScheme, ColorOptions, ColorSchemeType, SequentialColorScheme } from 'app/shared/color';
import { SequenceRandomSource } from 'app/shared/test';
import { ColorOptionsChooser } from './color-options-chooser';
import { Randomizer } from './randomizer';

describe('ColorOptionsChooser', () => {

  const VALUES = [0, 0.5, 0.99];
  const SCHEMES = Object.values(CategoricalColorScheme);

  function chooserOf(value: number): ColorOptionsChooser {
    return new ColorOptionsChooser(new Randomizer(new SequenceRandomSource([value])));
  }

  function optionsOf(scheme: CategoricalColorScheme | SequentialColorScheme, type = ColorSchemeType.CATEGORICAL): ColorOptions {
    return { type, scheme, bgColorOpacity: 0.3, borderColorOpacity: 0.8 };
  }

  it('#next should choose categorical scheme other than current', () => {
    for (const value of VALUES) {

      // given
      const current = [optionsOf(CategoricalColorScheme.SET_2)];

      // when
      const options = chooserOf(value).next(current);

      // then
      expect(options.type).toBe(ColorSchemeType.CATEGORICAL);
      expect(SCHEMES).toContain(options.scheme);
      expect(options.scheme).not.toBe(CategoricalColorScheme.SET_2);
    }
  });

  it('#next should keep opacities of first current options', () => {

    // given
    const current: ColorOptions[] = [
      { type: ColorSchemeType.CATEGORICAL, scheme: CategoricalColorScheme.ACCENT, bgColorOpacity: 0.4, borderColorOpacity: 0.6 },
      optionsOf(CategoricalColorScheme.DARK_2)
    ];

    // when
    const options = chooserOf(0.5).next(current);

    // then
    expect(options.bgColorOpacity).toBe(0.4);
    expect(options.borderColorOpacity).toBe(0.6);
  });

  it('#next should choose categorical scheme when current options are sequential', () => {

    // given
    const current = [optionsOf(SequentialColorScheme.COOL, ColorSchemeType.SEQUENTIAL)];

    // when
    const schemes = VALUES.map(v => chooserOf(v).next(current));

    // then
    schemes.forEach(o => expect(o.type).toBe(ColorSchemeType.CATEGORICAL));
    expect(schemes.map(o => o.scheme)).toEqual([SCHEMES[0], SCHEMES[5], SCHEMES[9]]);
  });

  it('#next should avoid schemes of all current tiles', () => {

    // given
    const current = SCHEMES.filter(s => s !== CategoricalColorScheme.PAIRED).map(s => optionsOf(s));

    // when
    const schemes = VALUES.map(v => chooserOf(v).next(current).scheme);

    // then
    expect(schemes).toEqual([CategoricalColorScheme.PAIRED, CategoricalColorScheme.PAIRED, CategoricalColorScheme.PAIRED]);
  });

  it('#next should avoid only scheme of first tile when current tiles use all schemes', () => {

    // given
    const current = SCHEMES.map(s => optionsOf(s));

    // when
    const schemes = [0, 0.99].map(v => chooserOf(v).next(current).scheme);

    // then
    expect(schemes).toEqual([SCHEMES[1], SCHEMES[9]]);
  });
});
