import { ErrorResultFactory } from './error-result-factory';
import { ChartType } from 'app/shared/model/chart';

describe('ErrorResultFactory', () => {

   const factory = new ErrorResultFactory();

   it('#groupByColumnNotDefined when non-MULTI_HORIZONTAL_BAR chart', () => {

      // when
      const error = factory.groupByColumnNotDefined(ChartType.LINE);

      // then
      expect(error.name).toBeUndefined();
      expect(error.message).toBe('X-Axis is not defined');
   });

   it('#groupByColumnNotDefined when MULTI_HORIZONTAL_BAR chart', () => {

      // when
      const error = factory.groupByColumnNotDefined(ChartType.HORIZONTAL_BAR);

      // then
      expect(error.name).toBeUndefined();
      expect(error.message).toBe('Y-Axis is not defined');
   });

   it('#exceedingValues', () => {

      // when
      const error = factory.exceedingValues(ChartType.BAR);

      // then
      expect(error.name).toBeUndefined();
      expect(error.message).toBe(ChartType.BAR.name + ' chart: Maximum number of ' + ChartType.BAR.maxValues + ' values exceeded.' +
         '\n\nPlease re-configure the chart or apply/refine data filtering.');
   });
});
