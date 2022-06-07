import { interpolateCool } from 'd3';
import { SequentialColorProvider, SequentialColorScheme } from '.';
import { ColorOptions } from './color-options.type';
import { ColorSchemeType } from './color-scheme-type.enum';

describe('SequentialColorProvider', () => {

    const options = colorOptions(SequentialColorScheme.COOL);
    const colorProvider = new SequentialColorProvider(options);
    const colorFunction = interpolateCool;

    it('#rgbColors', () => {
        expect(colorProvider.rgbColors(1)).toEqual([colorFunction(0.5)]);
        expect(colorProvider.rgbColors(2)).toEqual([colorFunction(0), colorFunction(1)]);
    });

    it('#bgColors', () => {
        expect(colorProvider.bgColors(1)).toEqual([
            toRgba(colorFunction(0.5), options.bgColorOpacity)
        ]);
        expect(colorProvider.bgColors(2)).toEqual([
            toRgba(colorFunction(0), options.bgColorOpacity),
            toRgba(colorFunction(1), options.bgColorOpacity)
        ]);
    });

    it('#borderColors', () => {
        expect(colorProvider.borderColors(1)).toEqual([
            toRgba(colorFunction(0.5), options.borderColorOpacity)
        ]);
        expect(colorProvider.borderColors(2)).toEqual([
            toRgba(colorFunction(0), options.borderColorOpacity),
            toRgba(colorFunction(1), options.borderColorOpacity)
        ]);
    });

    function toRgba(rgb: string, opacity: number): string {
        return rgb
            .replace('rgb', 'rgba')
            .replace(')', ',' + opacity + ')');
    }

    it('every CategoricalColorScheme must be handled', () => {
        allSequentialColorSchemes().forEach(s => {
            const colors = new SequentialColorProvider(colorOptions(s)).rgbColors(10);
            expect(colors).toBeDefined();
        });
    });

    function colorOptions(scheme: SequentialColorScheme): ColorOptions {
        return {
            type: ColorSchemeType.SEQUENTIAL,
            scheme: scheme,
            bgColorOpacity: 0.6,
            borderColorOpacity: 0.8
        }
    };

    function allSequentialColorSchemes(): SequentialColorScheme[] {
        return Object.keys(SequentialColorScheme)
            .map(key => SequentialColorScheme[key]);;
    }


});