import {
    interpolateCool, interpolatePlasma, interpolateRainbow, interpolateSinebow, interpolateSpectral,
    interpolateTurbo, interpolateWarm, schemeAccent, schemeCategory10, schemeDark2, schemePaired, schemePastel1, schemePastel2, schemeSet1, schemeSet2, schemeSet3, schemeTableau10
} from 'd3';
import { ColorScheme, ColorSchemeType, CategoricalColorScheme, SequentialColorScheme } from '.';

export class ColorUtils {

    static collectAllColorSchemes(): ColorScheme[] {
        return [
            ...this.allCategoricalColorSchemes().map(scheme => ({ type: ColorSchemeType.CATEGORICAL, scheme })),
            ...this.allSequentialColorScheme().map(scheme => ({ type: ColorSchemeType.SEQUENTIAL, scheme })),
        ];
    }

    static allCategoricalColorSchemes(): CategoricalColorScheme[] {
        return Object.keys(CategoricalColorScheme).map(key => CategoricalColorScheme[key]);
    }

    static allSequentialColorScheme(): SequentialColorScheme[] {
        return Object.keys(SequentialColorScheme).map(key => SequentialColorScheme[key]);
    }

    /**
     * @see https://github.com/d3/d3-scale-chromatic
    */
    static colorsOf(scheme: CategoricalColorScheme): ReadonlyArray<string> {
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

    /**
     * @see https://github.com/d3/d3-scale-chromatic
     */
    static colorFunctionOf(scheme: SequentialColorScheme): (n: number) => string {
        switch (scheme) {
            case SequentialColorScheme.COOL:
                return interpolateCool;
            case SequentialColorScheme.PLASMA:
                return interpolatePlasma;
            case SequentialColorScheme.RAINBOW:
                return interpolateRainbow;
            case SequentialColorScheme.SINEBOW:
                return interpolateSinebow;
            case SequentialColorScheme.SPECTRAL:
                return interpolateSpectral;
            case SequentialColorScheme.TURBO:
                return interpolateTurbo;
            case SequentialColorScheme.WARM:
                return interpolateWarm;
            default:
                throw new Error('no color function defined for scheme: ' + scheme);
        }
    }
}