import { shuffler } from 'd3';
import { RandomSource } from './random-source';

export class Randomizer {

  constructor(private readonly source: RandomSource) { }

  /**
   * @returns a shuffled copy of the specified items
   */
  shuffled<T>(items: readonly T[]): T[] {
    return shuffler(() => this.source.next())([...items]);
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.source.next() * items.length)];
  }

  chance(): boolean {
    return this.source.next() < 0.5;
  }
}
