import { NumberUtils } from 'app/shared/utils';
import { ColorProvider, ColorSchemeType, ColorScheme, ColorConverter, SequentialColorScheme, ColorUtils } from '.';

export class SequentialColorProvider implements ColorProvider {

    private colorFunction: (n: number) => string;

    constructor(private _scheme: SequentialColorScheme) {
        this.colorFunction = ColorUtils.colorFunctionOf(_scheme);
    }

    get colorScheme(): ColorScheme {
        return {
            type: ColorSchemeType.SEQUENTIAL,
            scheme: this._scheme
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