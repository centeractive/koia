import { schemeAccent } from 'd3';
import { CategoricalColorProvider, CategoricalColorScheme } from '.';
import { ColorOptions } from './color-options.type';
import { ColorSchemeType } from './color-scheme-type.enum';

describe('CategoricalColorProvider', () => {

    const options = colorOptions(CategoricalColorScheme.ACCENT);
    const colorProvider = new CategoricalColorProvider(options);
    const baseColors = schemeAccent;

    it('#rgbColors', () => {
        expect(colorProvider.rgbColors(1)).toEqual(['rgb(127,201,127)']);
        expect(colorProvider.rgbColors(2)).toEqual(['rgb(127,201,127)', 'rgb(190,174,212)']);
    });

    it('#bgColors when count exceeds number of available colors', () => {
        // given
        const count = baseColors.length + 1;

        // when
        const colors = colorProvider.bgColors(count);

        // then
        expect(colors.length).toBe(count);
        expect(colors[0]).toBe('rgb(127,201,127)');
        expect(colors[count - 1]).toBe(colors[0]);
    });

    it('#borderColors', () => {
        expect(colorProvider.borderColors(1)).toEqual(['rgba(127,201,127,0.6)']);
        expect(colorProvider.borderColors(2)).toEqual(['rgba(127,201,127,0.6)', 'rgba(190,174,212,0.6)']);
    });

    it('#borderColors when count exceeds number of available colors', () => {

        // given
        const count = baseColors.length + 1;

        // when
        const colors = colorProvider.borderColors(count);

        // then
        expect(colors.length).toBe(count);
        expect(colors[0]).toBe('rgba(127,201,127,0.6)');
        expect(colors[count - 1]).toBe(colors[0]);
    });

    it('every CategoricalColorScheme must be handled', () => {
        allCategoricalColorSchemes().forEach(s => {
            const colors = new CategoricalColorProvider(colorOptions(s)).rgbColors(10);
            expect(colors).toBeDefined();
        });
    });

    function colorOptions(scheme: CategoricalColorScheme): ColorOptions {
        return {
            type: ColorSchemeType.CATEGORICAL,
            scheme: scheme,
            bgColorOpacity: 0.6,
            borderColorOpacity: 0.8
        }
    };

    function allCategoricalColorSchemes(): CategoricalColorScheme[] {
        return Object.keys(CategoricalColorScheme)
            .map(key => CategoricalColorScheme[key]);;
    }

});