import { NumberUtils } from 'app/shared/utils';
import { scaleOrdinal } from 'd3';
import { ColorProvider, ColorSchemeType, ColorScheme, ColorConverter, CategoricalColorScheme, ColorUtils } from '.';

export class CategoricalColorProvider implements ColorProvider {

    private colors: ReadonlyArray<string>;
    private colorScale: any;

    constructor(private _scheme: CategoricalColorScheme) {
        this.colors = ColorUtils.colorsOf(_scheme);
        this.colorScale = scaleOrdinal(this.colors);
    }

    get colorScheme(): ColorScheme {
        return {
            type: ColorSchemeType.CATEGORICAL,
            scheme: this._scheme
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