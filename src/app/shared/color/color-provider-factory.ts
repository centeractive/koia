import {
    ColorProvider, ColorSchemeType, ColorOptions, CategoricalColorScheme,
    CategoricalColorProvider, SequentialColorProvider
} from '.';

export class ColorProviderFactory {

    private static DEF_BG_OPACITY = 0.75;
    private static DEF_BORDER_OPACITY = 1;

    private static currColorProvider: ColorProvider;

    static create(options?: ColorOptions): ColorProvider {
        if (options) {
            switch (options.type) {
                case ColorSchemeType.CATEGORICAL:
                    this.currColorProvider = new CategoricalColorProvider(options);
                    break;
                case ColorSchemeType.SEQUENTIAL:
                    this.currColorProvider = new SequentialColorProvider(options);
                    break;
                default:
                    throw new Error('unknown ColorSchemeType: ' + options.type);
            }
        }
        if (!this.currColorProvider) {
            this.currColorProvider = this.createDefaultColorProvider();
        }
        return this.currColorProvider;
    }

    private static createDefaultColorProvider(): ColorProvider {
        return new CategoricalColorProvider({
            type: ColorSchemeType.CATEGORICAL,
            scheme: CategoricalColorScheme.TABLEAU_10,
            bgColorOpacity: this.DEF_BG_OPACITY,
            borderColorOpacity: this.DEF_BORDER_OPACITY
        });
    }

}