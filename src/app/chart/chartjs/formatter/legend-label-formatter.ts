import { DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartOptions, LegendItem } from 'chart.js';
import { TimeFormatter } from './time-formatter';

export class LegendLabelFormatter extends TimeFormatter {

    /**
     * we use the legend filter function for formatting the legend labels because no other
     * appropriate callback function was found, note however that no legend label is filtered out.
     */
    format(context: ChartContext, options: ChartOptions): void {
        const chartType = ChartType.fromType(context.chartType);
        const nameColumn = context.groupByColumns[0];
        if (context.isCircularChart() && chartType !== ChartType.RADAR && nameColumn?.dataType === DataType.TIME) {
            options.plugins.legend.labels.filter = (item: LegendItem) => {
                item.text = this.formatTime(item.text, nameColumn.format);
                return true;
            };
        }
    }
}