import { Column, DataType } from 'app/shared/model';
import { ScaleOptions } from 'chart.js';
import { TimeFormatter } from './time-formatter';

export class TickLabelFormatter extends TimeFormatter {

    /**
     * only works if scale type is 'linear'
     * @see https://github.com/chartjs/Chart.js/issues/7850 
     * 
     * TODO: consider using time-axis and get rid of the formatting below
     */
    format(column: Column, options: ScaleOptions): void {
        if (column?.dataType === DataType.TIME) {
            const momentFormat = this.momentFormatOf(column);
            // options.afterTickToLabelConversion = axis => axis.ticks.forEach(t => t.label = this.formatTime(t.value, momentFormat));

            if (!options.ticks) {
                options.ticks = {};
            }
            options.ticks.callback = v => {
                return this.formatTime(v, momentFormat);
            };
        };
    }
}