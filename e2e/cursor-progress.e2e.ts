import { cursorProgressAt } from './support/cursor-progress';
import { expect, test } from './support/fixtures';

test('cursor progress starts at zero and ends at one', () => {
   const times = [0, 1];

   const progress = times.map(cursorProgressAt);

   expect(progress[0]).toBeCloseTo(0, 6);
   expect(progress[1]).toBeCloseTo(1, 6);
});

test('cursor progress lags early and leads late like the eased cursor', () => {
   const times = [0.25, 0.5];

   const progress = times.map(cursorProgressAt);

   expect(progress[0]).toBeCloseTo(0.130, 3);
   expect(progress[1]).toBeCloseTo(0.669, 3);
});

test('cursor progress never decreases', () => {
   const times = Array.from({ length: 21 }, (_, i) => i / 20);

   const progress = times.map(cursorProgressAt);

   progress.slice(1).forEach((p, i) => expect(p).toBeGreaterThanOrEqual(progress[i]));
});
