import { ColorScheme } from 'app/shared/color';

export interface ColorProvider {

    get colorScheme(): ColorScheme;

    rgbColors(count: number): string[];

    rgbaColors(count: number, opacity: number): string[];

}