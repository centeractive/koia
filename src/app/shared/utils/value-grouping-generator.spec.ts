import { DataFrame } from 'data-forge';
import { ValueGroupingGenerator } from './value-grouping-generator';
import { ValueGrouping, Column, DataType } from 'app/shared/model';
import { TestUtils } from '../test';

describe('ValueGroupingGenerator', () => {

   let columns: Column[];
   const valueGroupingGenerator = new ValueGroupingGenerator();

   beforeAll(() => {
      columns = [
         { name: 'ID', dataType: DataType.NUMBER, width: 30 },
         { name: 'Time', dataType: DataType.TIME, width: 100 },
         { name: 'Level', dataType: DataType.TEXT, width: 60 },
         { name: 'Data', dataType: DataType.TEXT, width: 400 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 70 }
      ];
   });

   it('#generate should return empty array when too few distinct values', () => {

      // given
      const numberOfEntries = ValueGroupingGenerator.MIN_DISTINCT_VALUES - 1;
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', numberOfEntries, 0, 570));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      expect(groupings).toEqual([]);
   });

   it('#generate should generate grouping when all values are zero or positive', () => {

      // given
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', 1000, 0, 570));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: 600, active: true },
            { max: 500, active: true },
            { max: 400, active: true },
            { max: 300, active: true },
            { max: 200, active: true },
            { max: 100, active: true }
         ],
         minMaxValues: { min: 0, max: 570 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when values are missing', () => {

      // given
      const entries = TestUtils.generateEntries('Amount', 1000, 0, 570);
      entries.push({});
      entries[10]['Amount'] = undefined;
      entries[20]['Amount'] = null;
      const baseDataFrame = new DataFrame(entries);

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: 600, active: true },
            { max: 500, active: true },
            { max: 400, active: true },
            { max: 300, active: true },
            { max: 200, active: true },
            { max: 100, active: true }
         ],
         minMaxValues: { min: 0, max: 570 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when values are non numeric', () => {

      // given
      const entries = TestUtils.generateEntries('Amount', 1000, 0, 570);
      entries[10]['Amount'] = 'X';
      entries[20]['Amount'] = 'Y';
      const baseDataFrame = new DataFrame(entries);

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: 600, active: true },
            { max: 500, active: true },
            { max: 400, active: true },
            { max: 300, active: true },
            { max: 200, active: true },
            { max: 100, active: true }
         ],
         minMaxValues: { min: 0, max: 570 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when all values are positive', () => {

      // given
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', 1000, 1, 12));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: 10, active: true },
            { max: 8, active: true },
            { max: 6, active: true },
            { max: 4, active: true },
            { max: 2, active: true }
         ],
         minMaxValues: { min: 1, max: 12 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when all values are negative or zero', () => {

      // given
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', 1000, -570, 0));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: -100, active: true },
            { max: -200, active: true },
            { max: -300, active: true },
            { max: -400, active: true },
            { max: -500, active: true },
         ],
         minMaxValues: { min: -570, max: 0 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when values are huge', () => {

      // given
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', 1000, 60_400_030_924, 6_011_996_444_007_713));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: 7_000_000_000_000_000, active: true },
            { max: 6_000_000_000_000_000, active: true },
            { max: 5_000_000_000_000_000, active: true },
            { max: 4_000_000_000_000_000, active: true },
            { max: 3_000_000_000_000_000, active: true },
            { max: 2_000_000_000_000_000, active: true },
            { max: 1_000_000_000_000_000, active: true }
         ],
         minMaxValues: { min: 60_400_030_924, max: 6_011_996_444_007_713 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when values are between 0 and 1', () => {

      // given
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', 1000, 0.567, 0.925));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: 1, active: true },
            { max: 0.9, active: true },
            { max: 0.8, active: true },
            { max: 0.7, active: true },
            { max: 0.6, active: true }
         ],
         minMaxValues: { min: 0.567, max: 0.925 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when values are between -1 and 0', () => {

      // given
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', 1000, -0.925, -0.567));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: -0.5, active: true },
            { max: -0.6, active: true },
            { max: -0.7, active: true },
            { max: -0.8, active: true },
            { max: -0.9, active: true }
         ],
         minMaxValues: { min: -0.925, max: -0.567 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when value range is small and positive', () => {

      // given
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', 1000, 100.5, 109.5));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: 110, active: true },
            { max: 109, active: true },
            { max: 108, active: true },
            { max: 107, active: true },
            { max: 106, active: true },
            { max: 105, active: true },
            { max: 104, active: true },
            { max: 103, active: true },
            { max: 102, active: true },
            { max: 101, active: true }
         ],
         minMaxValues: { min: 100.5, max: 109.5 }
      }];
      expect(groupings).toEqual(expected);
   });

   it('#generate should generate grouping when values are very small and around zero', () => {

      // given
      const baseDataFrame = new DataFrame(TestUtils.generateEntries('Amount', 1000, -0.0000285, 0.0000186));

      // when
      const groupings = valueGroupingGenerator.generate(baseDataFrame, columns);

      // then
      const expected: ValueGrouping[] = [{
         columnName: 'Amount',
         ranges: [
            { max: 0.00002, active: true },
            { max: 0.00001, active: true },
            { max: 0, active: true },
            { max: -0.00001, active: true },
            { max: -0.00002, active: true }
         ],
         minMaxValues: { min: -0.0000285, max: 0.0000186 }
      }];
      expect(groupings).toEqual(expected);
   });
});
