import { ElementContext } from 'app/shared/model';
import { Randomizer } from './randomizer';
import { TileSignature } from './tile-signature';
import { TileSpec } from './tile-spec';

/**
 * orders specs so that tiles differ from the current tiles as far as possible
 */
export class TileSpecRanker {

  /**
   * @returns the specs of unused signatures, followed by those of used signatures with other keys and finally those of used keys,
   * each rank shuffled
   */
  rank(specs: TileSpec[], currentContexts: ElementContext[], randomizer: Randomizer): TileSpec[] {
    const signatures = new Set(currentContexts.map(c => TileSignature.ofContext(c)));
    const keys = new Set(currentContexts.map(c => TileSignature.keyOfContext(c)));
    const ranks: TileSpec[][] = [[], [], []];
    specs.forEach(s => ranks[keys.has(s.key) ? 2 : signatures.has(s.signature) ? 1 : 0].push(s));
    return ranks.flatMap(r => randomizer.shuffled(r));
  }
}
