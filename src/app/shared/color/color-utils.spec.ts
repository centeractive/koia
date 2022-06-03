import { ColorSchemeType, CategoricalColorScheme, SequentialColorScheme } from 'app/shared/color';
import { ColorUtils } from '.';

describe('ColorUtils', () => {

    it('#allCategoricalColorSchemes', () => {
        const cat = ColorSchemeType.CATEGORICAL;
        const seq = ColorSchemeType.SEQUENTIAL;
        expect(ColorUtils.collectAllColorSchemes()).toEqual([
            { type: cat, scheme: CategoricalColorScheme.ACCENT },
            { type: cat, scheme: CategoricalColorScheme.CATEGORY_10 },
            { type: cat, scheme: CategoricalColorScheme.DARK_2 },
            { type: cat, scheme: CategoricalColorScheme.PAIRED },
            { type: cat, scheme: CategoricalColorScheme.PASTEL_1 },
            { type: cat, scheme: CategoricalColorScheme.PASTEL_2 },
            { type: cat, scheme: CategoricalColorScheme.SET_1 },
            { type: cat, scheme: CategoricalColorScheme.SET_2 },
            { type: cat, scheme: CategoricalColorScheme.SET_3 },
            { type: cat, scheme: CategoricalColorScheme.TABLEAU_10 },
            { type: seq, scheme: SequentialColorScheme.COOL },
            { type: seq, scheme: SequentialColorScheme.PLASMA },
            { type: seq, scheme: SequentialColorScheme.RAINBOW },
            { type: seq, scheme: SequentialColorScheme.SINEBOW },
            { type: seq, scheme: SequentialColorScheme.SPECTRAL },
            { type: seq, scheme: SequentialColorScheme.TURBO },
            { type: seq, scheme: SequentialColorScheme.WARM }
        ]);
    });

    it('#allCategoricalColorSchemes', () => {
        expect(ColorUtils.allCategoricalColorSchemes()).toEqual([
            CategoricalColorScheme.ACCENT,
            CategoricalColorScheme.CATEGORY_10,
            CategoricalColorScheme.DARK_2,
            CategoricalColorScheme.PAIRED,
            CategoricalColorScheme.PASTEL_1,
            CategoricalColorScheme.PASTEL_2,
            CategoricalColorScheme.SET_1,
            CategoricalColorScheme.SET_2,
            CategoricalColorScheme.SET_3,
            CategoricalColorScheme.TABLEAU_10
        ]);
    });

    it('#allSequentialColorScheme', () => {
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

    it('#colorsOf should return colors for each CategoricalColorScheme', () => {
        ColorUtils.allCategoricalColorSchemes().forEach(s => {
            expect(ColorUtils.colorsOf(s)).toBeDefined();
        });
    });

    it('#colorFunctionOf should return colors for each SequentialColorScheme', () => {
        ColorUtils.allSequentialColorScheme().forEach(s => {
            expect(ColorUtils.colorFunctionOf(s)).toBeDefined();
        });
    });

});