import {
    ColorProvider, ColorSchemeType, CategoricalColorScheme, SequentialColorScheme,
    CategoricalColorProvider, SequentialColorProvider
} from '.';

export class ColorProviderFactory {

    static create(type: ColorSchemeType, scheme: CategoricalColorScheme | SequentialColorScheme): ColorProvider {
        switch (type) {
            case ColorSchemeType.CATEGORICAL:
                return new CategoricalColorProvider(scheme as CategoricalColorScheme);
            case ColorSchemeType.SEQUENTIAL:
                return new SequentialColorProvider(scheme as SequentialColorScheme);
            default:
                throw new Error('unknown ColorSchemeType: ' + type);
        }
    }

}