import { ChartContext, DataType } from 'app/shared/model';
import { RawDataLinkFactory } from 'app/shared/utils';
import { Router } from '@angular/router';

/**
 * Reveals (displays) raw data corresponding to a chart element selected by the user
 */
export class RawDataRevealer {

   constructor(private router: Router) {}

   reveal(event: any, context: ChartContext): void {
      let link: string;
      if (event.point) {
         link = this.createLinkFromDataPoint(event, context);
      } else if (context.isNonGrouping()) {
         link = this.createLinkFromFlatData(event, context);
      } else {
         link = this.createLinkFromGroupedData(event, context);
      }
      this.router.navigateByUrl(link);
   }

   private createLinkFromDataPoint(event: any, context: ChartContext): string {
      if (event.point && event.point.id) {
         return RawDataLinkFactory.createIDLink(event.point.id);
      } else {
         const dataColumnName = context.dataColumns[0].name;
         const dataColumnValue = context.isAggregationCountSelected() ? event.series.key : event.point.y;
         const xAxisColumn = context.groupByColumns[0];
         if (xAxisColumn.dataType === DataType.TIME) {
            const timeStart: number = event.point.x;
            const columnName = context.isAggregationCountSelected() ? dataColumnName : event.series.key;
            return RawDataLinkFactory.createTimeUnitLink(context, [xAxisColumn], [timeStart], [columnName], [dataColumnValue]);
         } else {
            return RawDataLinkFactory.createLink(context.query, [dataColumnName, xAxisColumn.name], [dataColumnValue, event.point.x]);
         }
      }
   }

   private createLinkFromFlatData(event: any, context: ChartContext): string {
      const query = context.query;
      const column = context.isAggregationCountSelected() ? context.dataColumns[0] : context.groupByColumns[0];

      console.log('RawDataLinkFactory.createLink ' + column.name + event.data.x);

      return RawDataLinkFactory.createLink(query, [column.name], [event.data.x]);
   }

   private createLinkFromGroupedData(event: any, context: ChartContext): string {
      if (event.data.id) {
         return RawDataLinkFactory.createIDLink(event.data.id);
      }
      const dataColumnName = context.dataColumns[0].name;
      const dataColumnValue = context.isAggregationCountSelected() ? event.data.key : event.data.y;
      const xAxisColumn = context.groupByColumns[0];
      if (xAxisColumn.dataType === DataType.TIME) {
         const timeStart: number = event.data.x;
         return RawDataLinkFactory.createTimeUnitLink(context, [xAxisColumn], [timeStart], [dataColumnName], [dataColumnValue]);
      } else {
         return RawDataLinkFactory.createLink(context.query, [dataColumnName, xAxisColumn.name], [dataColumnValue, event.data.x]);
      }
   }
}
