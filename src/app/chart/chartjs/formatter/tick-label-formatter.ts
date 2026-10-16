import { Column, DataType } from 'app/shared/model';
import { ScaleOptions } from 'chart.js';
import { TimeFormatter } from './time-formatter';

export class TickLabelFormatter extends TimeFormatter {

    /**
     * formats the tick labels of a category scale grouped by a time column; since category scales pass the label index
     * as tick value, the label is resolved through the scale
     * @see https://www.chartjs.org/docs/latest/axes/labelling.html#creating-custom-tick-formats
     */
    format(column: Column, options: ScaleOptions): void {
        if (column?.dataType === DataType.TIME) {
            if (!options.ticks) {
                options.ticks = {};
            }
            const format = (v: string | number) => this.formatTime(v, column.format);
            options.ticks.callback = function (value) {
                return format(this.getLabelForValue(value as number));
            };
        }
    }
}
