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
         const dataColumnName = tokens.pop();
         dataColumn = context.dataColumns.find(c => c.name === dataColumnName) || dataColumn;
         groupKey = tokens.concat(String(point.y)).join(SeriesNameConverter.SEPARATOR);
      }
      const columnNames = context.splitColumns.map(c => c.name).concat(dataColumn.name);
      const values = this.seriesNameConverter.toValues(groupKey, dataColumn, context.splitColumns);
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
      if (data.labels?.length) {
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

}
