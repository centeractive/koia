import { ChartContext, ChartType } from 'app/shared/model/chart';

export class ChartJsUtils {

   static extractChartType(context: ChartContext): string {
      switch (ChartType.fromType(context.chartType)) {
         case ChartType.PIE:
            return 'pie';
         case ChartType.DONUT:
            return 'donut';
         case ChartType.BAR:
         case ChartType.MULTI_BAR:
            return 'bar';
         case ChartType.MULTI_HORIZONTAL_BAR:
            return 'horizontalBar';
         case ChartType.LINE:
         case ChartType.LINE_WITH_FOCUS:
            return 'line';
         case ChartType.SCATTER:
            return 'scatter';
         default:
            throw new Error('currently not supported')
      }
   }
}