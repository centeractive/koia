import { CategoryCombinationCounter } from './category-combination-counter';

describe('CategoryCombinationCounter', () => {

  it('#count should count distinct value combinations of two columns', () => {

    // given
    const counter = new CategoryCombinationCounter([
      { A: 'x', B: 1 }, { A: 'x', B: 2 }, { A: 'x', B: 1 }, { A: 'y', B: 1 }, { A: 'y', B: 1 }
    ]);

    // when
    const count = counter.count('A', 'B');

    // then
    expect(count).toBe(3);
  });

  it('#count should count same combinations regardless of column order', () => {

    // given
    const counter = new CategoryCombinationCounter([{ A: 'x', B: 1 }, { A: 'x', B: 2 }, { A: 'y', B: 2 }]);

    // when
    const counts = [counter.count('A', 'B'), counter.count('B', 'A')];

    // then
    expect(counts).toEqual([3, 3]);
  });

  it('#count should count missing values as a value', () => {

    // given
    const counter = new CategoryCombinationCounter([
      { A: 'x', B: null }, { A: 'x' }, { A: 'x', B: null }, { B: 1 }, { A: undefined, B: 1 }, { A: null, B: 1 }
    ]);

    // when
    const count = counter.count('A', 'B');

    // then
    expect(count).toBe(4);
  });

  it('#count should compare numeric values by SameValueZero', () => {

    // given
    const counter = new CategoryCombinationCounter([
      { A: 0, B: NaN }, { A: -0, B: NaN }, { A: 0, B: 1 }, { A: '0', B: 1 }
    ]);

    // when
    const count = counter.count('A', 'B');

    // then
    expect(count).toBe(3);
  });

  it('#count should return zero without entries', () => {

    // given
    const counter = new CategoryCombinationCounter([]);

    // when
    const count = counter.count('A', 'B');

    // then
    expect(count).toBe(0);
  });

  it('#isUniform should detect every value combination holding the same number of rows', () => {

    // given
    const counter = new CategoryCombinationCounter([
      { A: 'x', B: 1 }, { A: 'x', B: 2 }, { A: 'y', B: 1 }, { A: 'y', B: 2 }, { A: 'x', B: 1 }, { A: 'x', B: 2 }, { A: 'y', B: 1 },
      { A: 'y', B: 2 }
    ]);

    // when
    const uniform = [counter.isUniform('A', 'B'), counter.isUniform('B', 'A')];

    // then
    expect(uniform).toEqual([true, true]);
  });

  it('#isUniform should not detect combinations holding different numbers of rows', () => {

    // given
    const counter = new CategoryCombinationCounter([{ A: 'x', B: 1 }, { A: 'x', B: 2 }, { A: 'y', B: 1 }, { A: 'y', B: 2 }, { A: 'y', B: 2 }]);

    // when
    const uniform = counter.isUniform('A', 'B');

    // then
    expect(uniform).toBe(false);
  });

  it('#isUniform should not detect missing value combination', () => {

    // given
    const counter = new CategoryCombinationCounter([{ A: 'x', B: 1 }, { A: 'x', B: 2 }, { A: 'y', B: 1 }]);

    // when
    const uniform = counter.isUniform('A', 'B');

    // then
    expect(uniform).toBe(false);
  });

  it('#isUniform should count missing values as one value', () => {

    // given
    const counter = new CategoryCombinationCounter([{ A: 'x', B: 1 }, { A: 'x' }, { A: null, B: 1 }, { B: null }]);

    // when
    const uniform = counter.isUniform('A', 'B');

    // then
    expect(uniform).toBe(true);
  });

  it('#isUniform should not detect without entries', () => {

    // given
    const counter = new CategoryCombinationCounter([]);

    // when
    const uniform = counter.isUniform('A', 'B');

    // then
    expect(uniform).toBe(false);
  });

  it('#isUniform should memoize its result', () => {

    // given
    const counter = new CategoryCombinationCounter([{ A: 'x', B: 1 }]);
    const computeSpy = vi.spyOn(counter as never as { computeUniform: () => boolean }, 'computeUniform');

    // when
    counter.isUniform('A', 'B');
    counter.isUniform('B', 'A');

    // then
    expect(computeSpy).toHaveBeenCalledTimes(1);
  });
});
