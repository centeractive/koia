import { ColorOptions } from 'app/shared/color';

export abstract class ColorProvider {

    constructor(public options: ColorOptions) { }

    bgColors(count: number): string[] {
        return this.rgbaColors(count, this.options.bgColorOpacity);
    }

    borderColors(count: number): string[] {
        return this.rgbaColors(count, this.options.borderColorOpacity);
    }

    abstract rgbaColors(count: number, opacity: number): string[];

}