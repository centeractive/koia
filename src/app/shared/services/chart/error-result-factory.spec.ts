import { DataType, Column } from 'app/shared/model';
import { ErrorResultFactory } from './error-result-factory';
import { ChartType } from 'app/shared/model/chart';

describe('ErrorResultFactory', () => {

   const factory = new ErrorResultFactory();

   it('#groupByColumnNotDefined should return error result when non-MULTI_HORIZONTAL_BAR chart', () => {

      // when
      const chartDataResult = factory.groupByColumnNotDefined(ChartType.LINE);

      // then
      expect(chartDataResult.data).toBeUndefined();
      expect(chartDataResult.error).toBe('X-Axis is not defined');
   });

   it('#groupByColumnNotDefined should return error result when MULTI_HORIZONTAL_BAR chart', () => {

      // when
      const chartDataResult = factory.groupByColumnNotDefined(ChartType.MULTI_HORIZONTAL_BAR);

      // then
      expect(chartDataResult.data).toBeUndefined();
      expect(chartDataResult.error).toBe('Y-Axis is not defined');
   });

   it('#exceedingValues should return error result', () => {

      // when
      const chartDataResult = factory.exceedingValues(ChartType.BAR);

      // then
      expect(chartDataResult.data).toBeUndefined();
      expect(chartDataResult.error).toBe(ChartType.BAR.name + ' chart: Maximum number of ' + ChartType.BAR.maxValues + ' values exceeded.' +
         '\n\nPlease re-configure the chart or apply/refine data filtering.');
   });
});
