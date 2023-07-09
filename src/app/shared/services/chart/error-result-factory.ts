import { ChartType } from 'app/shared/model/chart';

export class ErrorResultFactory {

   toError(message: string): Error {
      return {
         name: undefined,
         message: message
      };
   }

   groupByColumnNotDefined(chartType: ChartType): Error {
      const axisType = ChartType.isHorizontalChart(chartType) ? 'Y' : 'X';
      return {
         name: undefined,
         message: axisType + '-Axis is not defined'
      };
   }

   exceedingValues(chartType: ChartType): Error {
      return {
         name: undefined,
         message: chartType.name + ' chart: Maximum number of ' + chartType.maxValues.toLocaleString()
            + ' values exceeded.' +
            '\n\nPlease re-configure the chart or apply/refine data filtering.'
      };
   }
}
