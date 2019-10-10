import { ChartType, ChartDataResult } from 'app/shared/model/chart';

export class ErrorResultFactory {

   groupByColumnNotDefined(chartType: ChartType): ChartDataResult {
      const axisType = chartType === ChartType.MULTI_HORIZONTAL_BAR ? 'Y' : 'X';
      return { error: axisType + '-Axis is not defined' };
   }

   exceedingValues(chartType: ChartType): ChartDataResult {
      return {
         error: chartType.name + ' chart: Maximum number of ' + chartType.maxValues + ' values exceeded.' +
            '\n\nPlease re-configure the chart or apply/refine data filtering.'
      };
   }
}
