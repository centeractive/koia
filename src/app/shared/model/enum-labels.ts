import { LanguageService } from 'app/shared/services/language/language.service';
import { Aggregation } from './aggregation.enum';
import { ComputeOperator } from './compute-operator.enum';
import { DataType } from './data-type.enum';
import { EnumLabelKeys } from './enum-label-keys';
import { ExportFormat } from './export-format.enum';
import { Operator } from './operator.enum';
import { TimeUnit } from './time-unit.enum';

/**
 * Provides the translation keys and the translated labels of enum values. Enum values are persisted (e.g. in views) and must
 * therefore never be translated themselves, only their labels are shown in the language of the user interface.
 */
export class EnumLabels {

   static aggregationKey(aggregation: Aggregation): string {
      return EnumLabelKeys.aggregation(aggregation);
   }

   static aggregation(aggregation: Aggregation): string {
      return translate(EnumLabels.aggregationKey(aggregation), aggregation);
   }

   static operatorKey(operator: Operator): string {
      return EnumLabelKeys.operator(operator);
   }

   static operator(operator: Operator): string {
      return translate(EnumLabels.operatorKey(operator), operator);
   }

   static timeUnitKey(timeUnit: TimeUnit): string {
      return EnumLabelKeys.timeUnit(timeUnit);
   }

   static timeUnit(timeUnit: TimeUnit): string {
      return translate(EnumLabels.timeUnitKey(timeUnit), timeUnit);
   }

   static dataTypeKey(dataType: DataType): string {
      return EnumLabelKeys.dataType(dataType);
   }

   static dataType(dataType: DataType): string {
      return translate(EnumLabels.dataTypeKey(dataType), dataType);
   }

   static exportFormatKey(exportFormat: ExportFormat): string {
      return EnumLabelKeys.exportFormat(exportFormat);
   }

   static exportFormat(exportFormat: ExportFormat): string {
      return translate(EnumLabels.exportFormatKey(exportFormat), exportFormat);
   }

   static computeOperatorKey(operator: ComputeOperator): string {
      return EnumLabelKeys.computeOperator(operator);
   }

   static computeOperator(operator: ComputeOperator): string {
      return translate(EnumLabels.computeOperatorKey(operator), operator);
   }

   /**
    * @param chartType type of a chart (e.g. 'linearBar', see ChartType#type)
    */
   static chartTypeKey(chartType: string): string {
      return EnumLabelKeys.chartType(chartType);
   }

   /**
    * @param chartType type of a chart (e.g. 'linearBar', see ChartType#type)
    */
   static chartType(chartType: string): string {
      return translate(EnumLabels.chartTypeKey(chartType), chartType);
   }
}

/**
 * @returns the translation or the specified fallback (typically the enum value) when no translation exists
 */
function translate(key: string, fallback: string): string {
   const label = LanguageService.instant(key);
   return label === key ? fallback : label;
}
