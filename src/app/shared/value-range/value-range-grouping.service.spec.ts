import { ValueRangeGroupingService } from './value-range-grouping.service';
import { IDataFrame, DataFrame } from 'data-forge';
import { ValueRange } from './model/value-range.type';
import { ValueGrouping } from './model/value-grouping.type';
import { ValueRangeConverter } from './value-range-converter';

describe('ValueRangeGroupingService', () => {

   let baseDataFrame: IDataFrame<number, object>;
   const groupingService = new ValueRangeGroupingService();

   beforeAll(() => {
      baseDataFrame = new DataFrame([
         { ID: 0, Level: 'ERROR', Data: '-' },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 8 },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 13 },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: 20 },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: 22 },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: 29 }
      ]);
   });

   it('#compute should group data by defined sorted ranges', () => {

      // given
      const ranges: ValueRange[] = [
         { max: 10, active: true },
         { max: 20, active: true },
         { max: 30, active: true }
      ];
      const groupings: ValueGrouping[] = [
         { columnName: 'Amount', ranges: ranges }
      ];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: '-', Amount: ValueRangeConverter.EMPTY },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 'min - 10' },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: '10 - 20' },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: '20 - 30' },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: '20 - 30' },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: '20 - 30' }
      ];
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#compute should group data by non-sorted ranges', () => {

      // given
      const ranges: ValueRange[] = [
         { max: 20, active: true },
         { max: 10, active: true },
         { max: 30, active: true }
      ];
      const groupings: ValueGrouping[] = [
         { columnName: 'Amount', ranges: ranges }
      ];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: '-', Amount: ValueRangeConverter.EMPTY },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 'min - 10' },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: '10 - 20' },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: '20 - 30' },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: '20 - 30' },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: '20 - 30' }
      ];
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#compute should group data by sorted active ranges', () => {

      // given
      const ranges: ValueRange[] = [
         { max: 20, active: true },
         { max: 10, active: false },
         { max: 30, active: true }
      ];
      const groupings: ValueGrouping[] = [
         { columnName: 'Amount', ranges: ranges }
      ];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: '-', Amount: ValueRangeConverter.EMPTY },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 'min - 20' },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 'min - 20' },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: '20 - 30' },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: '20 - 30' },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: '20 - 30' }
      ];
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#compute should group data by defined sorted ranges and max range', () => {

      // given
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }];
      const groupings: ValueGrouping[] = [{ columnName: 'Amount', ranges: ranges }];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: '-', Amount: ValueRangeConverter.EMPTY },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 'min - 10' },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: '10 - 20' },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: '20 - max' },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: '20 - max' },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: '20 - max' }
      ];
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#compute should label all values "min - max" when no range is active', () => {

      // given
      const groupings: ValueGrouping[] = [{ columnName: 'Amount', ranges: [{ max: 10, active: false }] }];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      expect(dataFrame.getSeries('Amount').toArray()).toEqual([ValueRangeConverter.EMPTY, 'min - max', 'min - max', 'min - max',
         'min - max', 'min - max']);
   });

   it('#compute should ignore active ranges without max', () => {

      // given
      const ranges: ValueRange[] = [{ max: null, active: true }, { max: 20, active: true }];
      const groupings: ValueGrouping[] = [{ columnName: 'Amount', ranges: ranges }];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      expect(dataFrame.getSeries('Amount').toArray()).toEqual([ValueRangeConverter.EMPTY, 'min - 20', 'min - 20', '20 - max',
         '20 - max', '20 - max']);
   });

   it('#compute should group rows lacking value of column named valueOf as empty', () => {

      // given
      const dataFrame = new DataFrame<number, object>([{ ID: 0 }, { ID: 1, valueOf: 8 }, { ID: 2, valueOf: 13 }]);
      const groupings: ValueGrouping[] = [{ columnName: 'valueOf', ranges: [{ max: 10, active: true }] }];

      // when
      const result = groupingService.compute(dataFrame, groupings);

      // then
      expect(result.toArray()).toEqual([
         { ID: 0, valueOf: ValueRangeConverter.EMPTY },
         { ID: 1, valueOf: 'min - 10' },
         { ID: 2, valueOf: '10 - max' }
      ]);
   });
});
