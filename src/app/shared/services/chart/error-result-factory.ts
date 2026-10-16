import { EnumLabels } from 'app/shared/model/enum-labels';
import { ChartType } from 'app/shared/model/chart';
import { LanguageService } from 'app/shared/services/language/language.service';

export class ErrorResultFactory {

   toError(message: string): Error {
      return {
         name: undefined,
         message: message
      };
   }

   groupByColumnNotDefined(chartType: ChartType): Error {
      const axis = LanguageService.instant(ChartType.isHorizontalChart(chartType) ? 'chart.yAxis' : 'chart.xAxis');
      return {
         name: undefined,
         message: LanguageService.instant('chart.error.axisUndefined', { axis })
      };
   }

   exceedingValues(chartType: ChartType): Error {
      return {
         name: undefined,
         message: LanguageService.instant('chart.error.maxValuesExceeded', {
            chartType: EnumLabels.chartType(chartType.type),
            max: chartType.maxValues.toLocaleString(LanguageService.localeId())
         })
      };
   }
}
