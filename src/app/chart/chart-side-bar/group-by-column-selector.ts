import { Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartDataHelper } from 'app/shared/services/chart/chart-data-helper';

export class GroupByColumnSelector {

   constructor(private readonly context: ChartContext) { }

   /**
    * @returns the current group-by column if it produces valid chart data, the preferred valid column otherwise,
    * or an empty array if no group-by column is required or valid
    */
   select(): Column[] {
      const countSelected = this.context.isAggregationCountSelected();
      if (this.context.isCategoryChart() && countSelected) {
         return [];
      }
      const current = this.context.groupByColumns[0];
      if (current && this.isValid(current, countSelected, this.context.dataColumns)) {
         return [current];
      }
      const column = this.findValidColumn(countSelected, this.context.dataColumns);
      return column ? [column] : [];
   }

   hasValidColumnForIndividualValues(dataColumns: Column[] = this.context.dataColumns): boolean {
      return !!this.findValidColumn(false, dataColumns);
   }

   private findValidColumn(countSelected: boolean, dataColumns: Column[]): Column {
      return this.preferredDataTypes()
         .flatMap(dataType => this.context.columns.filter(c => c.dataType === dataType))
         .find(c => this.isValid(c, countSelected, dataColumns));
   }

   private preferredDataTypes(): DataType[] {
      return this.context.isCategoryChart() ?
         [DataType.TEXT, DataType.TIME, DataType.NUMBER] : [DataType.TIME, DataType.NUMBER, DataType.TEXT];
   }

   private isValid(column: Column, countSelected: boolean, dataColumns: Column[]): boolean {
      return !dataColumns.includes(column)
         && (this.context.isCategoryChart() || !this.context.splitColumns.includes(column))
         && (countSelected || !this.requiresUniqueNames(column) || this.hasValidNameCount(column, dataColumns));
   }

   private requiresUniqueNames(column: Column): boolean {
      return this.context.isCategoryChart() || column.dataType === DataType.TEXT;
   }

   private hasValidNameCount(column: Column, dataColumns: Column[]): boolean {
      const count = ChartDataHelper.uniqueNameCount(this.context.entries, column, dataColumns);
      const maxValues = ChartType.fromType(this.context.chartType).maxValues;
      return count !== undefined && (maxValues === undefined || count <= maxValues);
   }
}
