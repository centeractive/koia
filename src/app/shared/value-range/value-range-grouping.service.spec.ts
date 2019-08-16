import { ValueRangeGroupingService } from './value-range-grouping.service';
import { IDataFrame, DataFrame } from 'data-forge';
import { ValueRange } from './model/value-range.type';
import { ValueGrouping } from './model/value-grouping.type';

describe('ValueRangeGroupingService', () => {

   let baseDataFrame: IDataFrame<number, any>;
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
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }, { max: 30, active: true }]
      const groupings: ValueGrouping[] = [{ columnName: 'Amount', ranges: ranges }];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: '-', Amount: ValueRangeGroupingService.EMPTY },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 'min - 10' },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: '10 - 20' },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: '20 - 30' },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: '20 - 30' },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: '20 - 30' }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#compute should group data by non-sorted ranges', () => {

      // given
      const ranges: ValueRange[] = [{ max: 20, active: true }, { max: 10, active: true }, { max: 30, active: true }]
      const groupings: ValueGrouping[] = [{ columnName: 'Amount', ranges: ranges }];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: '-', Amount: ValueRangeGroupingService.EMPTY },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 'min - 10' },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: '10 - 20' },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: '20 - 30' },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: '20 - 30' },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: '20 - 30' }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#compute should group data by sorted active ranges', () => {

      // given
      const ranges: ValueRange[] = [{ max: 20, active: true }, { max: 10, active: false }, { max: 30, active: true }]
      const groupings: ValueGrouping[] = [{ columnName: 'Amount', ranges: ranges }];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: '-', Amount: ValueRangeGroupingService.EMPTY },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 'min - 20' },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: 'min - 20' },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: '20 - 30' },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: '20 - 30' },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: '20 - 30' }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });

   it('#compute should group data by defined sorted ranges and max range', () => {

      // given
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }]
      const groupings: ValueGrouping[] = [{ columnName: 'Amount', ranges: ranges }];

      // when
      const dataFrame = groupingService.compute(baseDataFrame, groupings);

      // then
      const expectedData = [
         { ID: 0, Level: 'ERROR', Data: '-', Amount: ValueRangeGroupingService.EMPTY },
         { ID: 1, Level: 'INFO', Data: 'one', Amount: 'min - 10' },
         { ID: 2, Level: 'INFO', Data: 'two', Amount: '10 - 20' },
         { ID: 3, Level: 'INFO', Data: 'three', Amount: '20 - max' },
         { ID: 4, Level: 'WARN', Data: 'four', Amount: '20 - max' },
         { ID: 5, Level: 'WARN', Data: 'fife', Amount: '20 - max' }
      ]
      expect(dataFrame.toArray()).toEqual(expectedData);
   });
});
