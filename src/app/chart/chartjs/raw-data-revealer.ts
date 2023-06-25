import { DataType } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { SeriesNameConverter } from 'app/shared/services/chart';
import { ActiveElement, BarElement, Chart, ChartDataset, Point, PointElement } from 'chart.js';

/**
 * Reveals (displays) raw data corresponding for a Chart.js element selected by the user
 */
export class RawDataRevealer {

   private seriesNameConverter = new SeriesNameConverter();

   constructor(private rawDataRevealService: RawDataRevealService) { }

   reveal(elements: ActiveElement[], chart: Chart, context: ChartContext): void {
      // console.log('elements', elements);
      if (!elements.length) {
         return;
      }
      const element = elements[0];
      if (context.isCircularChart() || element.element instanceof BarElement || context.groupByColumns[0]?.dataType === DataType.TEXT) {
         this.fromFlatData(elements, chart, context);
      } else if (element.element instanceof PointElement) {
         const point = this.findDataPoint(chart.data.datasets, element.datasetIndex, element.index);
         // console.log('point', point)
         if (point['id'] != undefined) {
            // console.log('point with id', point)
            this.rawDataRevealService.ofID(point['id']);
         } else {
            this.fromDataPoint(point, chart.data.datasets, element.datasetIndex, context);
         }
      } else {
         this.fromGroupedData(chart.data.datasets, element.datasetIndex, context);
      }
   }

   private findDataPoint(datasets: ChartDataset[], datasetIndex: number, index: number): Point {
      return <Point>datasets[datasetIndex].data[index];
   }

   private fromDataPoint(point: Point, datasets: ChartDataset[], datasetIndex: number, context: ChartContext): void {
      const dataColumnName = context.isAggregationCountSelected() ? context.dataColumns[0].name : datasets[datasetIndex].label;
      const columnNames = context.splitColumns.map(c => c.name).concat(dataColumnName);
      const seriesName = context.isAggregationCountSelected() ? datasets[datasetIndex].label : point.y;
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

   private fromFlatData(elements: ActiveElement[], chart: Chart, context: ChartContext): void {
      if (chart.data.labels?.length) {
         const dsIndex = elements[0].datasetIndex;
         const index = elements[0].index;
         const column = context.isAggregationCountSelected() ? context.dataColumns[dsIndex] : context.groupByColumns[0];
         const label = chart.data.labels[index];
         this.rawDataRevealService.ofQuery(context.query, [column.name], [label], context);
      } else {
         const dsIndex = elements[0].datasetIndex;
         const column = context.isAggregationCountSelected() ? context.dataColumns[0] : context.groupByColumns[0];
         const label = chart.data.datasets[dsIndex].label;
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
