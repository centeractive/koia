import { schemeAccent } from 'd3';
import { CategoricalColorProvider, CategoricalColorScheme } from '.';

describe('CategoricalColorProvider', () => {

    const colorProvider = new CategoricalColorProvider(CategoricalColorScheme.ACCENT);
    const baseColors = schemeAccent;
    const opacity = 0.6;

    it('#rgbColors', () => {
        expect(colorProvider.rgbColors(1)).toEqual(['rgb(127,201,127)']);
        expect(colorProvider.rgbColors(2)).toEqual(['rgb(127,201,127)', 'rgb(190,174,212)']);
    });

    it('#rgbColors when count exceeds number of available colors', () => {
        // given
        const count = baseColors.length + 1;

        // when
        const colors = colorProvider.rgbColors(count);

        // then
        expect(colors.length).toBe(count);
        expect(colors[0]).toBe('rgb(127,201,127)');
        expect(colors[count - 1]).toBe(colors[0]);
    });

    it('#rgbaColors', () => {
        expect(colorProvider.rgbaColors(1, opacity)).toEqual(['rgba(127,201,127,0.6)']);
        expect(colorProvider.rgbaColors(2, opacity)).toEqual(['rgba(127,201,127,0.6)', 'rgba(190,174,212,0.6)']);
    });

    it('#rgbaColors when count exceeds number of available colors', () => {

        // given
        const count = baseColors.length + 1;

        // when
        const colors = colorProvider.rgbaColors(count, opacity);

        // then
        expect(colors.length).toBe(count);
        expect(colors[0]).toBe('rgba(127,201,127,0.6)');
        expect(colors[count - 1]).toBe(colors[0]);
    });

});