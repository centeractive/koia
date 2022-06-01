import { ColorSchemeType, CategoricalColorScheme, SequentialColorScheme } from '.';

export interface ColorProvider {

    get schemeType(): ColorSchemeType;

    get scheme(): CategoricalColorScheme | SequentialColorScheme;

    rgbColors(count: number): string[];

    rgbaColors(count: number, opacity: number): string[];

}