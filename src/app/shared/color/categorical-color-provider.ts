import { NumberUtils } from 'app/shared/utils';
import {
    scaleOrdinal, schemeAccent, schemeCategory10, schemeDark2, schemePaired, schemePastel1,
    schemePastel2, schemeSet1, schemeSet2, schemeSet3, schemeTableau10
} from 'd3';
import { ColorProvider, ColorOptions, ColorConverter, CategoricalColorScheme } from '.';

export class CategoricalColorProvider extends ColorProvider {

    private colors: ReadonlyArray<string>;
    private colorScale: any;

    constructor(options: ColorOptions) {
        super(options);
        this.colors = this.colorsOf(options.scheme as CategoricalColorScheme);
        this.colorScale = scaleOrdinal(this.colors);
    }

    /**
     * @see https://github.com/d3/d3-scale-chromatic
    */
    private colorsOf(scheme: CategoricalColorScheme): ReadonlyArray<string> {
        switch (scheme) {
            case CategoricalColorScheme.ACCENT:
                return schemeAccent;
            case CategoricalColorScheme.CATEGORY_10:
                return schemeCategory10;
            case CategoricalColorScheme.DARK_2:
                return schemeDark2;
            case CategoricalColorScheme.PAIRED:
                return schemePaired;
            case CategoricalColorScheme.PASTEL_1:
                return schemePastel1;
            case CategoricalColorScheme.PASTEL_2:
                return schemePastel2;
            case CategoricalColorScheme.SET_1:
                return schemeSet1;
            case CategoricalColorScheme.SET_2:
                return schemeSet2;
            case CategoricalColorScheme.SET_3:
                return schemeSet3;
            case CategoricalColorScheme.TABLEAU_10:
                return schemeTableau10;
            default:
                throw new Error('no colors defined for scheme: ' + scheme);
        }
    }

    rgbColors(count: number): string[] {
        return NumberUtils.intArray(0, count - 1)
            .map(i => this.rgbColor(i));
    }

    rgbaColors(count: number, opacity: number): string[] {
        return NumberUtils.intArray(0, count - 1)
            .map(i => ColorConverter.rgbToRgba(this.rgbColor(i), opacity));
    }

    private rgbColor(index: number): string {
        const color = this.colorScale(index % this.colors.length);
        return color.startsWith('#') ? ColorConverter.hexToRgb(color) : color;
    }

}