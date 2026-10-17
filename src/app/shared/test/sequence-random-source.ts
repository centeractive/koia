import { RandomSource } from 'app/dashboard/generator/random-source';

/**
 * returns the specified values in a cycle
 */
export class SequenceRandomSource implements RandomSource {

  private index = 0;

  constructor(private readonly values: number[]) { }

  next(): number {
    return this.values[this.index++ % this.values.length];
  }
}
