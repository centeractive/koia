import { NumberUtils } from 'app/shared/utils';
import { ColorProvider, ColorOptions, ColorConverter, SequentialColorScheme } from '.';
import {
    interpolateCool, interpolateInferno, interpolatePlasma, interpolateRainbow, interpolateSinebow,
    interpolateSpectral, interpolateTurbo, interpolateViridis, interpolateWarm
} from 'd3';

export class SequentialColorProvider extends ColorProvider {

    private colorFunction: (n: number) => string;

    constructor(options: ColorOptions) {
        super(options);
        this.colorFunction = this.colorFunctionOf(options.scheme as SequentialColorScheme);
    }

    /**
     * @see https://github.com/d3/d3-scale-chromatic
     */
    private colorFunctionOf(scheme: SequentialColorScheme): (n: number) => string {
        switch (scheme) {
            case SequentialColorScheme.COOL:
                return interpolateCool;
            case SequentialColorScheme.INFERNO:
                return interpolateInferno;
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
            case SequentialColorScheme.VIRIDIS:
                return interpolateViridis;
            case SequentialColorScheme.WARM:
                return interpolateWarm;
            default:
                throw new Error('no color function defined for scheme: ' + scheme);
        }
    }

    rgbColors(count: number): string[] {
        return NumberUtils.rangeFloatArray(count)
            .map(n => this.rgbColor(n));
    }

    rgbaColors(count: number, opacity: number): string[] {
        return NumberUtils.rangeFloatArray(count)
            .map(n => ColorConverter.rgbToRgba(this.rgbColor(n), opacity));
    }

    private rgbColor(interval: number): string {
        const color = this.colorFunction(interval);
        return color.startsWith('#') ? ColorConverter.hexToRgb(color) : color;
    }

}