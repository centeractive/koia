import { ColorUtils, ColorSchemeType, CategoricalColorScheme, SequentialColorScheme } from '.';

describe('ColorUtils', () => {

    it('#allColorSchemeTypes', () => {
        expect(ColorUtils.allColorSchemeTypes()).toEqual([
            ColorSchemeType.CATEGORICAL,
            ColorSchemeType.SEQUENTIAL
        ]);
    });

    it('#allColorSchemeTypes', () => {
        expect(ColorUtils.allCategoricalColorSchemes()).toEqual([
            CategoricalColorScheme.ACCENT,
            CategoricalColorScheme.DISTINCT,
            CategoricalColorScheme.PAIRED,
            CategoricalColorScheme.TABLEAU
        ]);
    });

    it('#allColorSchemeTypes', () => {
        expect(ColorUtils.allSequentialColorScheme()).toEqual([
            SequentialColorScheme.COOL,
            SequentialColorScheme.PLASMA,
            SequentialColorScheme.RAINBOW,
            SequentialColorScheme.SINEBOW,
            SequentialColorScheme.SPECTRAL,
            SequentialColorScheme.TURBO,
            SequentialColorScheme.WARM
        ]);
    });

});