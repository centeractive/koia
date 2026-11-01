import { Aggregation, DataType } from 'app/shared/model';
import { categoryProfile as category, measureProfile as measure, timeProfile as time } from 'app/shared/test';
import { TileSize } from './tile-spec';
import { axisCategoriesOf, MAX_AXIS_CATEGORIES, tileSpecOf, timeRowsOf, triplesOf } from './tile-spec-builder';

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

  it('axisCategoriesOf should keep text categories within the axis category limit', () => {

    // given
    const categories = [category('A', MAX_AXIS_CATEGORIES), category('B', MAX_AXIS_CATEGORIES + 1), category('C', 3, 10, DataType.NUMBER),
      category('D', 2, 10, DataType.BOOLEAN), category('E', 2)];

    // when
    const axisCategories = axisCategoriesOf(categories);

    // then
    expect(axisCategories.map(c => c.name)).toEqual(['A', 'E']);
  });

  it('timeRowsOf should return the smaller of time bucket count and distinct count', () => {

    // when
    const rows = [timeRowsOf(time('T', 1, 12, 30)), timeRowsOf(time('T', 1, 30, 12))];

    // then
    expect(rows).toEqual([12, 12]);
  });
});
