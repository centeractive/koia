import { Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ScaleOptions } from 'chart.js';
import { TimeFormatter } from './time-formatter';

export class TickLabelFormatter extends TimeFormatter {

    /**
     * only works if scale type is 'linear'
     * @see https://github.com/chartjs/Chart.js/issues/7850 
     */
    format(context: ChartContext, column: Column, options: ScaleOptions): void {
        if (column?.dataType === DataType.TIME) {
            if (!options.ticks) {
                options.ticks = {};
            }
            options.ticks.callback = (v, i) => {
                const chartType = ChartType.fromType(context.chartType);
                if ([ChartType.BAR, ChartType.HORIZONTAL_BAR].includes(chartType)) {
                    return this.formatTime(context.data.labels[i] as any, column.format);
                }
                return this.formatTime(v, column.format);
            };
        }
    }
}