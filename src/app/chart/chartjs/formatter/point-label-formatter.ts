import { Column, DataType } from 'app/shared/model';
import { ScaleOptions } from 'chart.js';
import { TimeFormatter } from './time-formatter';

export class PointLabelFormatter extends TimeFormatter {

    format(column: Column, options: ScaleOptions<'radialLinear'>): void {
        if (column?.dataType === DataType.TIME) {
            options.pointLabels = {
                callback: (label: string) => this.formatTime(label, column.format)
            };
        }
    }
}