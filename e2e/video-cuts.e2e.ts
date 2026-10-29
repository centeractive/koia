import { expect, test } from './support/fixtures';
import { cutFilterOf, keptDurationOf } from './videos/support/cuts.mjs';

test('video without cuts keeps its duration', () => {
   const cuts = [];

   const duration = keptDurationOf(70, cuts);

   expect(duration).toBe(70);
});

test('video without cuts gets no cut filter', () => {
   const cuts = [];

   const filter = cutFilterOf(cuts);

   expect(filter).toBeUndefined();
});

test('cut shortens the duration by its length', () => {
   const cuts = [{ start: 40, end: 55 }];

   const duration = keptDurationOf(100, cuts);

   expect(duration).toBe(85);
});

test('cut filter drops the frames of the cut and moves the later frames back', () => {
   const cuts = [{ start: 40, end: 55.25 }];

   const filter = cutFilterOf(cuts);

   expect(filter).toBe(`select='not(between(t,40,55.25))',setpts='PTS-(gte(T,55.25)*15.25)/TB'`);
});

test('cut filter of two cuts drops both and moves the later frames back by both', () => {
   const cuts = [{ start: 10, end: 12.5 }, { start: 40, end: 55.25 }];

   const filter = cutFilterOf(cuts);

   expect(filter).toBe(`select='not(between(t,10,12.5)+between(t,40,55.25))',setpts='PTS-(gte(T,12.5)*2.5+gte(T,55.25)*15.25)/TB'`);
});

test('cut times are rounded to milliseconds in the filter', () => {
   const cuts = [{ start: 1, end: 2.00049 }];

   const filter = cutFilterOf(cuts);

   expect(filter).toContain('between(t,1,2)');
});

test('cut lengths are rounded to milliseconds in the duration', () => {
   const cuts = [{ start: 1, end: 2.00049 }];

   const duration = keptDurationOf(10, cuts);

   expect(duration).toBe(9);
});
