import { normalQuantile } from './normal-quantile';

describe('normalQuantile', () => {

   it.each([
      [0.5, 0],
      [0.975, 1.959964],
      [0.99, 2.326348],
      [1 - 1e-6, 4.753424],
      [0.01, -2.326348],
      [0.02, -2.053749]
   ])('should return quantile at probability %s', (p, expected) => {

      // when
      const quantile = normalQuantile(p);

      // then
      expect(quantile).toBeCloseTo(expected, 5);
   });
});
