import { ColorProviderFactory } from '.';
import { ColorSchemeType, CategoricalColorScheme, SequentialColorScheme } from 'app/shared/color';

describe('ColorProviderFactory', () => {

    it('#create should return default color provider', () => {

        // when
        const colorProvider = ColorProviderFactory.create();

        // then
        expect(colorProvider).toBeDefined();
    });

    it('#create should return current color provider', () => {

        // given
        const currentColorProvider = ColorProviderFactory.create({
            type: ColorSchemeType.SEQUENTIAL,
            scheme: SequentialColorScheme.COOL
        });

        // when
        const colorProvider = ColorProviderFactory.create();

        // then
        expect(colorProvider).toBe(currentColorProvider);
    });

    it('#create should return categorical color provider', () => {

        // when
        const colorProvider = ColorProviderFactory.create({
            type: ColorSchemeType.CATEGORICAL,
            scheme: CategoricalColorScheme.ACCENT
        });

        // then
        expect(colorProvider).toBeDefined();
        expect(colorProvider.colorScheme.type).toBe(ColorSchemeType.CATEGORICAL);
        expect(colorProvider.colorScheme.scheme).toBe(CategoricalColorScheme.ACCENT);
    });

    it('#create should return sequential color provider', () => {

        // when
        const colorProvider = ColorProviderFactory.create({
            type: ColorSchemeType.SEQUENTIAL,
            scheme: SequentialColorScheme.RAINBOW
        });

        // then
        expect(colorProvider).toBeDefined();
        expect(colorProvider.colorScheme.type).toBe(ColorSchemeType.SEQUENTIAL);
        expect(colorProvider.colorScheme.scheme).toBe(SequentialColorScheme.RAINBOW);
    });

});