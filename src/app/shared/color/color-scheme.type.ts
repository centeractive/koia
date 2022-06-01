import { ColorSchemeType, CategoricalColorScheme, SequentialColorScheme } from '.';

export interface ColorScheme {
    type: ColorSchemeType;
    scheme: CategoricalColorScheme | SequentialColorScheme;
}