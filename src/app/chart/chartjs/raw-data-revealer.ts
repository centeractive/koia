import { Column, DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { SeriesNameConverter } from 'app/shared/services/chart';
import { DataTypeUtils } from 'app/shared/utils';
import { isComputedColumn } from 'app/shared/utils/column-utils';
import { ActiveElement, BarElement, ChartData, ChartDataset, Point, PointElement } from 'chart.js';

/**
 * Reveals (displays) raw data corresponding to a Chart.js element selected by the user
 */
export class RawDataRevealer {

   private seriesNameConverter = new SeriesNameConverter();

   constructor(private rawDataRevealService: RawDataRevealService) { }

   reveal(elements: ActiveElement[], data: ChartData, context: ChartContext): void {
      if (!elements.length) {
         return;
      }
      const element = elements[0];
      const groupByColumnDataType = context.groupByColumns[0]?.dataType;
      if (context.isCategoryChart() || (groupByColumnDataType === DataType.TEXT && !context.isAggregationCountSelected() && !context.isAggregatedChart())) {
         this.fromFlatData(elements, data, context);
      } else if (element.element instanceof PointElement || element.element instanceof BarElement) {
         const point = this.findDataPoint(data.datasets, element.datasetIndex, element.index);
         if (point['id']) {
            this.rawDataRevealService.ofID(point['id']);
         } else if (context.isAggregatedChart()) {
            this.fromAggregatedDataPoint(point, data.datasets[element.datasetIndex], context);
         } else {
            this.fromDataPoint(point, data.datasets, element.datasetIndex, context);
         }
      }
   }

   private findDataPoint(datasets: ChartDataset[], datasetIndex: number, index: number): Point {
      return datasets[datasetIndex].data[index] as Point;
   }

   private fromDataPoint(point: Point, datasets: ChartDataset[], datasetIndex: number, context: ChartContext): void {
      const dsLabel = datasets[datasetIndex].label;
      let dataColumn = context.dataColumns[0];
      let groupKey = dsLabel;
      if (!context.isAggregationCountSelected()) {

         // series name consists of split column values followed by the data column name
         const tokens = dsLabel.split(SeriesNameConverter.SEPARATOR);
         tokens.pop();
         dataColumn = this.dataColumnOf(dsLabel, context);
         groupKey = tokens.concat(String(point.y)).join(SeriesNameConverter.SEPARATOR);
      }
      const columnNames = context.splitColumns.map(c => c.name).concat(dataColumn.name);
      const values = this.seriesNameConverter.toValues(groupKey, dataColumn, context.splitColumns);
      this.revealGroup(context.query, point, columnNames, values, context);
   }

   private fromAggregatedDataPoint(point: Point, dataset: ChartDataset, context: ChartContext): void {
      const query = context.isRowCountSelected() ? context.query : this.dataValueQuery(this.dataColumnOf(dataset.label, context), context);
      const columnNames = context.splitColumns.map(c => c.name);
      const values = this.seriesNameConverter.toSplitValues(dataset.label, context.splitColumns);
      this.revealGroup(query, point, columnNames, values, context);
   }

   private dataColumnOf(seriesName: string, context: ChartContext): Column {
      const dataColumnName = seriesName.split(SeriesNameConverter.SEPARATOR).pop();
      return context.dataColumns.find(c => c.name === dataColumnName) || context.dataColumns[0];
   }

   /**
    * computed values are not stored, hence raw data cannot be filtered by them
    */
   private dataValueQuery(dataColumn: Column, context: ChartContext): Query {
      if (isComputedColumn(dataColumn)) {
         return context.query;
      }
      const query = context.query.clone();
      query.addPropertyFilter(new PropertyFilter(dataColumn.name, Operator.NOT_EMPTY, ''));
      return query;
   }

   private revealGroup(query: Query, point: Point, columnNames: string[], values: (string | number | boolean)[], context: ChartContext): void {
      const groupByColumn = context.groupByColumns[0];
      if (groupByColumn.dataType === DataType.TIME) {
         const timeStart: number = point.x;
         this.rawDataRevealService.ofTimeUnit(query, [groupByColumn], [timeStart], columnNames, values, context);
      } else {
         columnNames.push(groupByColumn.name);
         values.push(point.x);
         this.rawDataRevealService.ofQuery(query, columnNames, values, context);
      }
   }

   private fromFlatData(elements: ActiveElement[], data: ChartData, context: ChartContext): void {
      const dsIndex = elements[0].datasetIndex;
      const count = context.isAggregationCountSelected();
      if (data.labels?.length) {
         const column = count ? context.dataColumns[dsIndex] : context.groupByColumns[0];
         const query = count ? context.query : this.dataValueQuery(context.dataColumns[dsIndex], context);
         this.revealValue(query, column, data.labels[elements[0].index], context);
      } else {
         const column = count ? context.dataColumns[0] : context.groupByColumns[0];
         const query = count ? context.query : this.dataValueQuery(context.dataColumns[0], context);
         const ds = data.datasets[dsIndex];
         this.revealValue(query, column, ds['originalLabel'] ?? ds.label, context);
      }
   }

   private revealValue(query: Query, column: Column, value: unknown, context: ChartContext): void {
      const typedValue = column.dataType === DataType.BOOLEAN ? DataTypeUtils.asBoolean(value as string | boolean) : value;
      this.rawDataRevealService.ofQuery(query, [column.name], [typedValue], context);
   }

}
