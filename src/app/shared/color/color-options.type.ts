import { ColorSchemeType, CategoricalColorScheme, SequentialColorScheme } from '.';

export interface ColorOptions {
    type: ColorSchemeType;
    scheme: CategoricalColorScheme | SequentialColorScheme;
    bgColorOpacity: number;
    borderColorOpacity: number
}