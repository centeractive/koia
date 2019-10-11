import { DataType } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { SeriesNameConverter } from 'app/shared/services/chart';

/**
 * Reveals (displays) raw data corresponding to a chart element selected by the user
 */
export class RawDataRevealer {

   private seriesNameConverter = new SeriesNameConverter();

   constructor(private rawDataRevealService: RawDataRevealService) { }

   reveal(event: any, context: ChartContext): void {
      if (event.point) {
         if (event.point.id) {
            this.rawDataRevealService.ofID(event.point.id);
         } else {
            this.fromDataPoint(event, context);
         }
      } else if (context.isNonGrouping()) {
         this.fromFlatData(event, context);
      } else {
         if (event.data.id) {
            this.rawDataRevealService.ofID(event.data.id);
         } else {
            this.fromGroupedData(event, context);
         }
      }
   }

   private fromDataPoint(event: any, context: ChartContext): void {
      const dataColumnName = context.isAggregationCountSelected() ? context.dataColumns[0].name : event.series.key;
      const columnNames = context.splitColumns.map(c => c.name).concat(dataColumnName);
      const seriesName = context.isAggregationCountSelected() ? event.series.key : event.point.y;
      const values = this.seriesNameConverter.toValues(seriesName, context.dataColumns[0], context.splitColumns);
      const groupByColumn = context.groupByColumns[0];
      if (groupByColumn.dataType === DataType.TIME) {
         const timeStart: number = event.point.x;
         this.rawDataRevealService.ofTimeUnit(context.query, [groupByColumn], [timeStart], columnNames, values, context);
      } else {
         columnNames.push(groupByColumn.name);
         values.push(event.point.x);
         this.rawDataRevealService.ofQuery(context.query, columnNames, values, context);
      }
   }

   private fromFlatData(event: any, context: ChartContext): void {
      const query = context.query;
      const column = context.isAggregationCountSelected() ? context.dataColumns[0] : context.groupByColumns[0];
      this.rawDataRevealService.ofQuery(query, [column.name], [event.data.x], context);
   }

   private fromGroupedData(event: any, context: ChartContext): void {
      const columnNames = context.splitColumns.map(c => c.name).concat(context.dataColumns[0].name);
      const groupName = context.isAggregationCountSelected() ? event.data.key : event.data.y;
      const values = this.seriesNameConverter.toValues(groupName, context.dataColumns[0], context.splitColumns);
      const groupByColumn = context.groupByColumns[0];
      if (context.groupByColumns[0].dataType === DataType.TIME) {
         const timeStart: number = event.data.x;
         this.rawDataRevealService.ofTimeUnit(context.query, [groupByColumn], [timeStart], columnNames, values, context);
      } else {
         columnNames.push(groupByColumn.name);
         values.push(event.data.x);
         this.rawDataRevealService.ofQuery(context.query, columnNames, values, context);
      }
   }
}
