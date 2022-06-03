import {
    ColorProvider, ColorSchemeType, ColorScheme, CategoricalColorScheme, SequentialColorScheme,
    CategoricalColorProvider, SequentialColorProvider
} from '.';

export class ColorProviderFactory {

    private static currColorProvider: ColorProvider;

    static create(colorScheme?: ColorScheme): ColorProvider {
        if (colorScheme) {
            switch (colorScheme.type) {
                case ColorSchemeType.CATEGORICAL:
                    this.currColorProvider = new CategoricalColorProvider(colorScheme.scheme as CategoricalColorScheme);
                    break;
                case ColorSchemeType.SEQUENTIAL:
                    this.currColorProvider = new SequentialColorProvider(colorScheme.scheme as SequentialColorScheme);
                    break;
                default:
                    throw new Error('unknown ColorSchemeType: ' + colorScheme.type);
            }
        }
        if (!this.currColorProvider) {
            this.currColorProvider = new CategoricalColorProvider(CategoricalColorScheme.TABLEAU_10);
        }
        return this.currColorProvider;
    }

}