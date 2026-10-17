/**
 * source of random numbers in the range [0, 1)
 */
export interface RandomSource {
  next(): number;
}

export class MathRandomSource implements RandomSource {

  next(): number {
    return Math.random();
  }
}
