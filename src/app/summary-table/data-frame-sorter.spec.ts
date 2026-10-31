import { DataFrameSorter } from './data-frame-sorter';
import { IDataFrame, DataFrame } from 'data-forge';
import { DataType, SummaryContext } from 'app/shared/model';

describe('DataFrameSorter', () => {

   let dataFrame: IDataFrame<number, object>;
   let context: SummaryContext;
   let sorter: DataFrameSorter;

   beforeEach(() => {
      const data = [
         { t: 'b', n: 2, g: '100 - 200' },
         { t: 'a', n: 3, g: '-100 - 0' },
         { t: 'f', n: -1, g: '300 - max' },
         { t: 'd', n: 0, g: 'min - -100' },
         { t: 'e', n: 1, g: '200 - 300' },
         { t: 'c', n: -2, g: '0 - 100' }
      ];
      dataFrame = new DataFrame(data);
      context = new SummaryContext([]);
      sorter = new DataFrameSorter();
   });

   it('#sort should return original data frame when sort is undefined', () => {

      // when
      const sortedDataFrame = sorter.sort(dataFrame, undefined, context);

      // then
      expect(sortedDataFrame).toBe(dataFrame);
   });

   it('#sort should return original data frame when sort column is not contained in data frame', () => {

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 'x', direction: 'asc' }, context);

      // then
      expect(sortedDataFrame).toBe(dataFrame);
   });

   it('#sort should ascending sort text column', () => {

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 't', direction: 'asc' }, context);

      // then
      expect(sortedDataFrame.getSeries('t').toArray()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
   });

   it('#sort should descending sort text column', () => {

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 't', direction: 'desc' }, context);

      // then
      expect(sortedDataFrame.getSeries('t').toArray()).toEqual(['f', 'e', 'd', 'c', 'b', 'a']);
   });

   it('#sort should ascending sort number column', () => {

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 'n', direction: 'asc' }, context);

      // then
      expect(sortedDataFrame.getSeries('n').toArray()).toEqual([-2, -1, 0, 1, 2, 3]);
   });

   it('#sort should descending sort number column', () => {

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 'n', direction: 'desc' }, context);

      // then
      expect(sortedDataFrame.getSeries('n').toArray()).toEqual([3, 2, 1, 0, -1, -2]);
   });

   it('#sort should ascending sort grouped column of small values', () => {

      // given
      const data = new DataFrame([
         { g: '8 - 10' },
         { g: '2 - 4' },
         { g: '6 - 8' },
         { g: '10 - max' },
         { g: '4 - 6' },
         { g: 'min - 2' }
      ]);
      groupByValueRanges();

      // when
      const sortedDataFrame = sorter.sort(data, { active: 'g', direction: 'asc' }, context);

      // then
      expect(sortedDataFrame.getSeries('g').toArray())
         .toEqual(['min - 2', '2 - 4', '4 - 6', '6 - 8', '8 - 10', '10 - max']);
   });

   it('#sort should ascending sort grouped column', () => {

      // given
      groupByValueRanges();

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 'g', direction: 'asc' }, context);

      // then
      expect(sortedDataFrame.getSeries('g').toArray())
         .toEqual(['min - -100', '-100 - 0', '0 - 100', '100 - 200', '200 - 300', '300 - max']);
   });

   it('#sort should descending sort grouped column', () => {

      // given
      groupByValueRanges();

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 'g', direction: 'desc' }, context);

      // then
      expect(sortedDataFrame.getSeries('g').toArray())
         .toEqual(['300 - max', '200 - 300', '100 - 200', '0 - 100', '-100 - 0', 'min - -100']);
   });

   it('#sort should ascending sort grouped column having values with thousands separator', () => {

      // given
      const range1 = toRange(-2_000_000, -1_000_000);
      const range2 = toRange(-1_000_000, 0);
      const range3 = toRange(0, 1_000_000);
      const range4 = toRange(1_000_000, 2_000_000);
      dataFrame = new DataFrame([{ g: range3 }, { g: range1 }, { g: range4 }, { g: range2 }]);
      groupByValueRanges();

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 'g', direction: 'asc' }, context);

      // then
      expect(sortedDataFrame.getSeries('g').toArray()).toEqual([range1, range2, range3, range4]);
   });

   it('#sort should descending sort grouped column having values with thousands separator', () => {

      // given
      const range1 = toRange(-2_000_000, -1_000_000);
      const range2 = toRange(-1_000_000, 0);
      const range3 = toRange(0, 1_000_000);
      const range4 = toRange(1_000_000, 2_000_000);
      dataFrame = new DataFrame([{ g: range3 }, { g: range1 }, { g: range4 }, { g: range2 }]);
      groupByValueRanges();

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 'g', direction: 'desc' }, context);

      // then
      expect(sortedDataFrame.getSeries('g').toArray()).toEqual([range4, range3, range2, range1]);
   });

   it('#sort should return original data frame when direction is empty', () => {

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 't', direction: '' }, context);

      // then
      expect(sortedDataFrame).toBe(dataFrame);
   });

   it('#sort should ascending sort empty values first', () => {

      // given
      dataFrame = new DataFrame<number, object>([{ t: 'b' }, { t: null }, { t: 'a' }, { n: 1 }]);

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 't', direction: 'asc' }, context);

      // then
      expect(sortedDataFrame.toArray().map(r => r['t'])).toEqual([null, undefined, 'a', 'b']);
   });

   it('#sort should descending sort empty values last', () => {

      // given
      dataFrame = new DataFrame<number, object>([{ t: 'b' }, { t: null }, { t: 'a' }, { n: 1 }]);

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 't', direction: 'desc' }, context);

      // then
      expect(sortedDataFrame.toArray().map(r => r['t'])).toEqual(['b', 'a', null, undefined]);
   });

   it('#sort should sort aggregation column by its values when value grouping exists for column of same name', () => {

      // given
      context.dataColumns = [{ name: 't', dataType: DataType.TEXT, width: 10 }];
      vi.spyOn(context, 'hasValueGrouping').mockImplementation(name => name === 'Count');
      dataFrame = new DataFrame([{ t: 'a', Count: 2 }, { t: 'b', Count: 10 }, { t: 'c', Count: 1 }]);

      // when
      const sortedDataFrame = sorter.sort(dataFrame, { active: 'Count', direction: 'asc' }, context);

      // then
      expect(sortedDataFrame.getSeries('Count').toArray()).toEqual([1, 2, 10]);
   });

   function groupByValueRanges(): void {
      context.groupByColumns = [{ name: 'g', dataType: DataType.NUMBER, width: 10 }];
      vi.spyOn(context, 'hasValueGrouping').mockReturnValue(true);
   }

   function toRange(from: number, to: number): string {
      return from.toLocaleString() + ' - ' + to.toLocaleString();
   }

});



