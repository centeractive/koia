import { Aggregation } from 'app/shared/model/aggregation.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { TimeUnit } from 'app/shared/model/time-unit.enum';
import { Texts } from './texts';

/**
 * composes the titles a chart derives from its configuration
 */
export class ChartTitles {

   constructor(private readonly texts: Texts) {
   }

   rowCount(): string {
      return this.texts.get(EnumLabelKeys.aggregation(Aggregation.ROW_COUNT));
   }

   aggregationOf(aggregation: Aggregation, columns: string): string {
      return this.texts.get('chart.title.aggregationOf', { aggregation: this.texts.get(EnumLabelKeys.aggregation(aggregation)), columns });
   }

   groupedByMonth(title: string, timeColumn: string): string {
      const columns = timeColumn + ' ' + this.texts.get(EnumLabelKeys.groupingTimeUnit(TimeUnit.MONTH));
      return this.texts.get('chart.title.groupedBy', { title, columns });
   }

   splitBy(title: string, columns: string): string {
      return this.texts.get('chart.title.splitBy', { title, columns });
   }
}
