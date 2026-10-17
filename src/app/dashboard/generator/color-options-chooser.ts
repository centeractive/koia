import { CategoricalColorScheme, ColorOptions, ColorSchemeType } from 'app/shared/color';
import { Randomizer } from './randomizer';

export class ColorOptionsChooser {

  constructor(private readonly randomizer: Randomizer) { }

  next(current: ColorOptions[]): ColorOptions {
    const schemes = Object.values(CategoricalColorScheme);
    const usedSchemes = current.map(o => o.scheme);
    let candidates = schemes.filter(s => !usedSchemes.includes(s));
    if (candidates.length === 0) {
      candidates = schemes.filter(s => s !== current[0].scheme);
    }
    return {
      type: ColorSchemeType.CATEGORICAL,
      scheme: this.randomizer.pick(candidates),
      bgColorOpacity: current[0].bgColorOpacity,
      borderColorOpacity: current[0].borderColorOpacity
    };
  }
}
