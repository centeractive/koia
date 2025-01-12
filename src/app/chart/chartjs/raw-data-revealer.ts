import { DataType } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { SeriesNameConverter } from 'app/shared/services/chart';
import { ActiveElement, BarElement, ChartData, ChartDataset, Point, PointElement } from 'chart.js';

/**
 * Reveals (displays) raw data corresponding to a Chart.js element selected by the user
 */
export class RawDataRevealer {

   private seriesNameConverter = new SeriesNameConverter();

   constructor(private rawDataRevealService: RawDataRevealService) { }

   reveal(elements: ActiveElement[], data: ChartData, context: ChartContext): void {
      console.log('elements', elements)
      console.log('data', data)
      console.log('context', context)

      if (!elements.length) {
         return;
      }
      const element = elements[0];
      const groupByColumnDataType = context.groupByColumns[0]?.dataType;
      if (context.isCategoryChart() || (groupByColumnDataType === DataType.TEXT && !context.isAggregationCountSelected())) {
         this.fromFlatData(elements, data, context);
      } else if (element.element instanceof PointElement || element.element instanceof BarElement) {
         const point = this.findDataPoint(data.datasets, element.datasetIndex, element.index);
         if (point['id']) {
            this.rawDataRevealService.ofID(point['id']);
         } else {
            this.fromDataPoint(point, data.datasets, element.datasetIndex, context);
         }
      } else {
         this.fromGroupedData(data.datasets, element.datasetIndex, context);
      }
   }

   private findDataPoint(datasets: ChartDataset[], datasetIndex: number, index: number): Point {
      return datasets[datasetIndex].data[index] as Point;
   }

   private fromDataPoint(point: Point, datasets: ChartDataset[], datasetIndex: number, context: ChartContext): void {
      const dataColumnName = context.isAggregationCountSelected() ? context.dataColumns[0].name : datasets[datasetIndex].label;
      const columnNames = context.splitColumns.map(c => c.name).concat(dataColumnName);
      const dsLabel = datasets[datasetIndex].label;
      const seriesName = context.isAggregationCountSelected() ? dsLabel : point.y;
      const values = this.seriesNameConverter.toValues(seriesName, context.dataColumns[0], context.splitColumns);
      const groupByColumn = context.groupByColumns[0];
      if (groupByColumn.dataType === DataType.TIME) {
         const timeStart: number = point.x;
         this.rawDataRevealService.ofTimeUnit(context.query, [groupByColumn], [timeStart], columnNames, values, context);
      } else {
         columnNames.push(groupByColumn.name);
         values.push(point.x);
         this.rawDataRevealService.ofQuery(context.query, columnNames, values, context);
      }
   }

   private fromFlatData(elements: ActiveElement[], data: ChartData, context: ChartContext): void {
      if (!!data.labels?.length) {
         const dsIndex = elements[0].datasetIndex;
         const index = elements[0].index;
         const column = context.isAggregationCountSelected() ? context.dataColumns[dsIndex] : context.groupByColumns[0];
         const label = data.labels[index];
         this.rawDataRevealService.ofQuery(context.query, [column.name], [label], context);
      } else {
         const dsIndex = elements[0].datasetIndex;
         const column = context.isAggregationCountSelected() ? context.dataColumns[0] : context.groupByColumns[0];
         const ds = data.datasets[dsIndex];
         const label = ds['originalLabel'] || ds.label;
         this.rawDataRevealService.ofQuery(context.query, [column.name], [label], context);
      }
   }

   private fromGroupedData(datasets: ChartDataset[], dsIndex: number, context: ChartContext): void {
      const columnNames = context.splitColumns.map(c => c.name).concat(context.dataColumns[0].name);
      const groupName = context.isAggregationCountSelected() ? context.dataColumns[dsIndex] : context.groupByColumns[dsIndex];
      const values = this.seriesNameConverter.toValues(groupName, context.dataColumns[0], context.splitColumns);
      const groupByColumn = context.groupByColumns[0];
      if (context.groupByColumns[0].dataType === DataType.TIME) {
         // const timeStart: number = datasets[dsIndex].label;
         // this.rawDataRevealService.ofTimeUnit(context.query, [groupByColumn], [timeStart], columnNames, values, context);
      } else {
         columnNames.push(groupByColumn.name);
         values.push(datasets[dsIndex].label);
         this.rawDataRevealService.ofQuery(context.query, columnNames, values, context);
      }
   }

}
