import { interpolateCool } from 'd3';
import { SequentialColorProvider, SequentialColorScheme } from '.';

describe('SequentialColorProvider', () => {

    const colorProvider = new SequentialColorProvider(SequentialColorScheme.COOL);
    const colorFunction = interpolateCool;
    const opacity = 0.6;

    it('#rgbColors', () => {
        expect(colorProvider.rgbColors(1)).toEqual([colorFunction(0)]);
        expect(colorProvider.rgbColors(2)).toEqual([colorFunction(0), colorFunction(1)]);
    });

    it('#rgbaColors', () => {
        expect(colorProvider.rgbaColors(1, opacity)).toEqual([toRgba(colorFunction(0))]);
        expect(colorProvider.rgbaColors(2, opacity)).toEqual([toRgba(colorFunction(0)), toRgba(colorFunction(1))]);
    });

    function toRgba(rgb: string): string {
        return rgb
            .replace('rgb', 'rgba')
            .replace(')', ',' + opacity + ')');
    }

});