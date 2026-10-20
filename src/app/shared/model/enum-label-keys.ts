import { Aggregation } from './aggregation.enum';
import { ComputeOperator } from './compute-operator.enum';
import { DataType } from './data-type.enum';
import { ExportFormat } from './export-format.enum';
import { Operator } from './operator.enum';
import { TimeUnit } from './time-unit.enum';

/**
 * translation keys of enum labels, composed of the enum member names (e.g. 'enum.aggregation.AVG'),
 * chart types use their type (e.g. 'enum.chartType.linearBar')
 */
export class EnumLabelKeys {

   static aggregation(aggregation: Aggregation): string {
      return 'enum.aggregation.' + memberNameOf(Aggregation, aggregation);
   }

   static operator(operator: Operator): string {
      return 'enum.operator.' + memberNameOf(Operator, operator);
   }

   static timeUnit(timeUnit: TimeUnit): string {
      return 'enum.timeUnit.' + memberNameOf(TimeUnit, timeUnit);
   }

   static groupingTimeUnit(timeUnit: TimeUnit): string {
      return 'ui.per.' + timeUnit;
   }

   static dataType(dataType: DataType): string {
      return 'enum.dataType.' + memberNameOf(DataType, dataType);
   }

   static exportFormat(exportFormat: ExportFormat): string {
      return 'enum.exportFormat.' + memberNameOf(ExportFormat, exportFormat);
   }

   static computeOperator(operator: ComputeOperator): string {
      return 'enum.computeOperator.' + memberNameOf(ComputeOperator, operator);
   }

   static computeOperatorFormula(operator: ComputeOperator): string {
      return 'computedColumn.formula.' + memberNameOf(ComputeOperator, operator);
   }

   /**
    * @param chartType type of a chart (e.g. 'linearBar', see ChartType#type)
    */
   static chartType(chartType: string): string {
      return 'enum.chartType.' + chartType;
   }
}

function memberNameOf(enumType: object, value: string): string {
   return Object.keys(enumType).find(key => enumType[key] === value) ?? value;
}
