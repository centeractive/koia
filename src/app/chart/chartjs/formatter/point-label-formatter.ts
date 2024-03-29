import { Column, DataType } from 'app/shared/model';
import { RadialLinearScaleOptions } from 'chart.js';
import { TimeFormatter } from './time-formatter';

export class PointLabelFormatter extends TimeFormatter {

    format(column: Column, options: RadialLinearScaleOptions): void {
        if (column?.dataType === DataType.TIME) {
            options.pointLabels = {
                callback: (label: string) => this.formatTime(label, column.format)
            } as any;
        }
    }
}