import { ForceYComputer } from './force-y-computer';

describe('ForceYComputer', () => {

   const forceYComputer = new ForceYComputer();

   it('#compute should return non-adjusted Y-axis when all values are same', () => {

      // when
      const forceY = forceYComputer.compute({ min: 1000, max: 1000 });

      // then
      expect(forceY).toBeUndefined();
   });

   it('#compute should return non-adjusted Y-axis when all values are positive and of big difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: 1, max: 1000 });

      // then
      expect(forceY).toBeUndefined();
   });

   it('#compute should return non-adjusted Y-axis when all values are negative and of big difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: -1000, max: -1 });

      // then
      expect(forceY).toBeUndefined();
   });

   it('#compute should return non-adjusted Y-axis when values range from negative to positive', () => {

      // when
      const forceY = forceYComputer.compute({ min: -1, max: 1 });

      // then
      expect(forceY).toBeUndefined();
   });

   it('#compute should return adjusted Y-axis min when all values are big positive integers of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: 980, max: 1000 });

      // then
      expect(forceY).toEqual([960, undefined]);
   });

   it('#compute should return adjusted Y-axis min when all values are floats of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: 618.6, max: 627.9 });

      // then
      expect(forceY).toEqual([609, undefined]);
   });

   it('#compute should return adjusted Y-axis min when all values are rather small floats of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: 9.1, max: 9.2 });

      // then
      expect(forceY).toEqual([9, undefined]);
   });

   it('#compute should return adjusted Y-axis min when all values are small floats of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: 1.1, max: 1.2 });

      // then
      expect(forceY).toEqual([1, undefined]);
   });

   it('#compute should return adjusted Y-axis min when all values are really small floats of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: 0.091, max: 0.092 });

      // then
      expect(forceY).toEqual([0.09, undefined]);
   });

   it('#compute should return adjusted Y-axis max when all values are big negatives integers of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: -1000, max: -980 });

      // then
      expect(forceY).toEqual([undefined, -960]);
   });

   it('#compute should return adjusted Y-axis min when all values are floats of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: -627.9, max: -618.6 });

      // then
      expect(forceY).toEqual([undefined, -609]);
   });

   it('#compute should return adjusted Y-axis min when all values are rather small floats of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: -9.2, max: -9.1 });

      // then
      expect(forceY).toEqual([undefined, -9]);
   });

   it('#compute should return adjusted Y-axis min when all values are small floats of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: -1.2, max: -1.1 });

      // then
      expect(forceY).toEqual([undefined, -1]);
   });

   it('#compute should return adjusted Y-axis min when all values are really small floats of little difference', () => {

      // when
      const forceY = forceYComputer.compute({ min: -0.092, max: -0.091 });

      // then
      expect(forceY).toEqual([undefined, -0.09]);
   });
});
