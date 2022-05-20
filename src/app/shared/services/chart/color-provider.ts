import { NumberUtils } from 'app/shared/utils';

export class ColorProvider {

    readonly defaultColors = [
        '255, 99, 132',
        '54, 162, 235',
        '255, 206, 86',
        '231, 233, 237',
        '75, 192, 192',
        '151, 187, 205',
        '220, 220, 220',
        '247, 70, 74',
        '70, 191, 189',
        '253, 180, 92',
        '148, 159, 177',
        '77, 83, 96'
    ];

    private rgbColors: string[];
    private rgbaColors: string[];

    constructor() {
        this.rgbColors = this.defaultColors.map(c => 'rgb(' + c + ')');
        this.rgbaColors = this.defaultColors.map(c => 'rgba(' + c + ', 0.6)');
    }

    bgColors(count: number): string[] {
        return NumberUtils.intArray(0, count - 1)
            .map(n => this.bgColorAt(n));
    }

    bgColorAt(index: number): string {
        return this.rgbaColors[index % this.defaultColors.length];
    }

    borderColors(count: number): string[] {
        return NumberUtils.intArray(0, count - 1)
            .map(n => this.borderColorAt(n));
    }

    borderColorAt(index: number): string {
        return this.rgbColors[index % this.defaultColors.length];
    }

}