import { LanguageService } from 'app/shared/services/language/language.service';
import { Aggregation } from './aggregation.enum';
import { DataType } from './data-type.enum';
import { ExportFormat } from './export-format.enum';
import { Operator } from './operator.enum';
import { TimeUnit } from './time-unit.enum';

/**
 * Provides the translation keys and the translated labels of enum values. Enum values are persisted (e.g. in views) and must
 * therefore never be translated themselves, only their labels are shown in the language of the user interface.
 *
 * Keys are composed of the enum member names (e.g. 'enum.aggregation.AVG'), chart types use their type (e.g. 'enum.chartType.linearBar').
 */
export class EnumLabels {

   static aggregationKey(aggregation: Aggregation): string {
      return 'enum.aggregation.' + memberNameOf(Aggregation, aggregation);
   }

   static aggregation(aggregation: Aggregation): string {
      return translate(EnumLabels.aggregationKey(aggregation), aggregation);
   }

   static operatorKey(operator: Operator): string {
      return 'enum.operator.' + memberNameOf(Operator, operator);
   }

   static operator(operator: Operator): string {
      return translate(EnumLabels.operatorKey(operator), operator);
   }

   static timeUnitKey(timeUnit: TimeUnit): string {
      return 'enum.timeUnit.' + memberNameOf(TimeUnit, timeUnit);
   }

   static timeUnit(timeUnit: TimeUnit): string {
      return translate(EnumLabels.timeUnitKey(timeUnit), timeUnit);
   }

   static dataTypeKey(dataType: DataType): string {
      return 'enum.dataType.' + memberNameOf(DataType, dataType);
   }

   static dataType(dataType: DataType): string {
      return translate(EnumLabels.dataTypeKey(dataType), dataType);
   }

   static exportFormatKey(exportFormat: ExportFormat): string {
      return 'enum.exportFormat.' + memberNameOf(ExportFormat, exportFormat);
   }

   static exportFormat(exportFormat: ExportFormat): string {
      return translate(EnumLabels.exportFormatKey(exportFormat), exportFormat);
   }

   /**
    * @param chartType type of a chart (e.g. 'linearBar', see ChartType#type)
    */
   static chartTypeKey(chartType: string): string {
      return 'enum.chartType.' + chartType;
   }

   /**
    * @param chartType type of a chart (e.g. 'linearBar', see ChartType#type)
    */
   static chartType(chartType: string): string {
      return translate(EnumLabels.chartTypeKey(chartType), chartType);
   }
}

function memberNameOf(enumType: object, value: string): string {
   return Object.keys(enumType).find(k => enumType[k] === value) ?? value;
}

/**
 * @returns the translation or the specified fallback (typically the enum value) when no translation exists
 */
function translate(key: string, fallback: string): string {
   const label = LanguageService.instant(key);
   return label === key ? fallback : label;
}
