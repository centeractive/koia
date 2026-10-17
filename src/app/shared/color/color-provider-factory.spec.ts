import { ColorProviderFactory } from '.';
import { ColorSchemeType, CategoricalColorScheme, SequentialColorScheme } from 'app/shared/color';
import { ColorOptions } from './color-options.type';

describe('ColorProviderFactory', () => {

    it('#create should return default color provider', () => {

        // when
        const colorProvider = ColorProviderFactory.create();

        // then
        expect(colorProvider).toBeDefined();
    });

    it('#create should return current color provider', () => {

        // given
        const options = colorOptions(ColorSchemeType.SEQUENTIAL, SequentialColorScheme.COOL);
        const currentColorProvider = ColorProviderFactory.create(options);

        // when
        const colorProvider = ColorProviderFactory.create();

        // then
        expect(colorProvider).toBe(currentColorProvider);
    });

    it('#create should return categorical color provider', () => {

        // when
        const options = colorOptions(ColorSchemeType.CATEGORICAL, CategoricalColorScheme.ACCENT);
        const colorProvider = ColorProviderFactory.create(options);

        // then
        expect(colorProvider).toBeDefined();
        expect(colorProvider.options.type).toBe(ColorSchemeType.CATEGORICAL);
        expect(colorProvider.options.scheme).toBe(CategoricalColorScheme.ACCENT);
    });

    it('#create should return sequential color provider', () => {

        // when
        const options = colorOptions(ColorSchemeType.SEQUENTIAL, SequentialColorScheme.RAINBOW);
        const colorProvider = ColorProviderFactory.create(options);

        // then
        expect(colorProvider).toBeDefined();
        expect(colorProvider.options.type).toBe(ColorSchemeType.SEQUENTIAL);
        expect(colorProvider.options.scheme).toBe(SequentialColorScheme.RAINBOW);
    });

    it('#create should throw error when color scheme type is unknown', () => {

        // given
        const options = colorOptions('unknown' as ColorSchemeType, CategoricalColorScheme.ACCENT);

        // when
        const creation = () => ColorProviderFactory.create(options);

        // then
        expect(creation).toThrow('unknown ColorSchemeType: unknown');
    });

    function colorOptions(type: ColorSchemeType, scheme: CategoricalColorScheme | SequentialColorScheme): ColorOptions {
        return {
            type,
            scheme,
            bgColorOpacity: 0.7,
            borderColorOpacity: 1
        };
    }

});