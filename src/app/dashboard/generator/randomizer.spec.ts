import { SequenceRandomSource } from 'app/shared/test';
import { Randomizer } from './randomizer';

describe('Randomizer', () => {

  it('#shuffled should return permutation without modifying given items', () => {

    // given
    const items = ['a', 'b', 'c', 'd', 'e'];
    const randomizer = new Randomizer(new SequenceRandomSource([0.3, 0.7, 0.1]));

    // when
    const shuffled = randomizer.shuffled(items);

    // then
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(shuffled).not.toBe(items);
    expect([...shuffled].sort()).toEqual(items);
  });

  it('#shuffled should order items deterministically by random source', () => {

    // given
    const randomizer = new Randomizer(new SequenceRandomSource([0.5, 0, 0.9]));

    // when
    const shuffled = randomizer.shuffled(['a', 'b', 'c', 'd']);

    // then
    expect(shuffled).toEqual(['d', 'b', 'a', 'c']);
  });

  it('#pick should return item at position of random value', () => {

    // given
    const randomizer = new Randomizer(new SequenceRandomSource([0, 0.5, 0.74]));

    // when
    const picked = [1, 2, 3].map(() => randomizer.pick(['a', 'b', 'c', 'd']));

    // then
    expect(picked).toEqual(['a', 'c', 'c']);
  });

  it('#pick should return last item when random value is just below one', () => {

    // given
    const randomizer = new Randomizer(new SequenceRandomSource([0.9999999]));

    // when
    const picked = randomizer.pick(['a', 'b', 'c']);

    // then
    expect(picked).toBe('c');
  });

  it('#chance should return true when random value is below half', () => {

    // given
    const randomizer = new Randomizer(new SequenceRandomSource([0, 0.4999]));

    // when
    const chances = [randomizer.chance(), randomizer.chance()];

    // then
    expect(chances).toEqual([true, true]);
  });

  it('#chance should return false when random value is half or above', () => {

    // given
    const randomizer = new Randomizer(new SequenceRandomSource([0.5, 0.9999]));

    // when
    const chances = [randomizer.chance(), randomizer.chance()];

    // then
    expect(chances).toEqual([false, false]);
  });
});
