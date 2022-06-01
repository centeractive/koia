import {
    interpolateCool, interpolatePlasma, interpolateRainbow, interpolateSinebow, interpolateSpectral,
    interpolateTurbo, interpolateWarm, schemeAccent, schemeCategory10, schemePaired, schemeSet1, schemeTableau10
} from 'd3';
import { CategoricalColorScheme, SequentialColorScheme } from '.';
import { ColorSchemeType } from './color-scheme-type.enum';

/**
 * @see https://github.com/d3/d3-scale-chromatic
 */
export class ColorUtils {

    /**
     * @returns an array of all [[ColorSchemeType]]s
     */
    static allColorSchemeTypes(): ColorSchemeType[] {
        return Object.keys(ColorSchemeType).map(key => ColorSchemeType[key]);
    }

    /**
     * @returns an array of all [[CategoricalColorScheme]]s
     */
    static allCategoricalColorSchemes(): CategoricalColorScheme[] {
        return Object.keys(CategoricalColorScheme).map(key => CategoricalColorScheme[key]);
    }

    /**
     * @returns an array of all [[SequentialColorScheme]]s
     */
    static allSequentialColorScheme(): SequentialColorScheme[] {
        return Object.keys(SequentialColorScheme).map(key => SequentialColorScheme[key]);
    }

    static categoricalColorsOf(scheme: CategoricalColorScheme): ReadonlyArray<string> {
        switch (scheme) {
            case CategoricalColorScheme.ACCENT:
                return schemeAccent;
            case CategoricalColorScheme.DISTINCT:
                return schemeCategory10;
            case CategoricalColorScheme.PAIRED:
                return schemePaired;
            case CategoricalColorScheme.TABLEAU:
                return schemeTableau10;
            default:
                return schemeSet1;
        }
    }

    static sequentialColorFunctionOf(scheme: SequentialColorScheme): (n: number) => string {
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
                return interpolateTurbo;
        }
    }
}