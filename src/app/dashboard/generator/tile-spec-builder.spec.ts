import { Aggregation } from 'app/shared/model';
import { measureProfile as measure } from 'app/shared/test';
import { TileSize } from './tile-spec';
import { tileSpecOf, triplesOf } from './tile-spec-builder';

describe('tile-spec-builder', () => {

  it('triplesOf should return index ordered triples', () => {

    // when
    const triples = triplesOf(['a', 'b', 'c', 'd']);

    // then
    expect(triples).toEqual([['a', 'b', 'c'], ['a', 'b', 'd'], ['a', 'c', 'd'], ['b', 'c', 'd']]);
  });

  it('triplesOf should return none for fewer than three items', () => {

    // when
    const triples = triplesOf(['a', 'b']);

    // then
    expect(triples).toEqual([]);
  });

  it('tileSpecOf should default aggregation choices to none', () => {

    // when
    const spec = tileSpecOf({ dataColumns: [measure('N')], aggregations: [Aggregation.SUM], size: TileSize.WIDE });

    // then
    expect(spec.aggregationChoices).toEqual([]);
  });
});
