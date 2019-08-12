import { ChartContext, DataType } from 'app/shared/model';
import { RawDataRevealService } from 'app/shared/services';

/**
 * Reveals (displays) raw data corresponding to a chart element selected by the user
 */
export class RawDataRevealer {

   constructor(private rawDataRevealService: RawDataRevealService) { }

   reveal(event: any, context: ChartContext): void {
      if (event.point) {
         this.createLinkFromDataPoint(event, context);
      } else if (context.isNonGrouping()) {
         this.createLinkFromFlatData(event, context);
      } else {
         this.createLinkFromGroupedData(event, context);
      }
   }

   private createLinkFromDataPoint(event: any, context: ChartContext): void {
      if (event.point && event.point.id) {
         this.rawDataRevealService.ofID(event.point.id);
      } else {
         const dataColumnName = context.isAggregationCountSelected() ? context.dataColumns[0].name : event.series.key;
         const dataColumnValue = context.isAggregationCountSelected() ? event.series.key : event.point.y;
         const xAxisColumn = context.groupByColumns[0];
         if (xAxisColumn.dataType === DataType.TIME) {
            const timeStart: number = event.point.x;
            this.rawDataRevealService.ofTimeUnit(context, [xAxisColumn], [timeStart], [dataColumnName], [dataColumnValue]);
         } else {
            this.rawDataRevealService.ofQuery(context.query, [dataColumnName, xAxisColumn.name], [dataColumnValue, event.point.x]);
         }
      }
   }

   private createLinkFromFlatData(event: any, context: ChartContext): void {
      const query = context.query;
      const column = context.isAggregationCountSelected() ? context.dataColumns[0] : context.groupByColumns[0];
      this.rawDataRevealService.ofQuery(query, [column.name], [event.data.x]);
   }

   private createLinkFromGroupedData(event: any, context: ChartContext): void {
      if (event.data.id) {
         this.rawDataRevealService.ofID(event.data.id);
      } else {
         const dataColumnName = context.dataColumns[0].name;
         const dataColumnValue = context.isAggregationCountSelected() ? event.data.key : event.data.y;
         const xAxisColumn = context.groupByColumns[0];
         if (xAxisColumn.dataType === DataType.TIME) {
            const timeStart: number = event.data.x;
            this.rawDataRevealService.ofTimeUnit(context, [xAxisColumn], [timeStart], [dataColumnName], [dataColumnValue]);
         } else {
            this.rawDataRevealService.ofQuery(context.query, [dataColumnName, xAxisColumn.name], [dataColumnValue, event.data.x]);
         }
      }
   }
}
