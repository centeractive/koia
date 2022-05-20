import { BubbleDataPoint, ScatterDataPoint } from 'chart.js';

export class FormatUtils {

    static percentage(data: (number | ScatterDataPoint | BubbleDataPoint)[], value: number): string {
        let total: number = data
            .map(v => v['y'] || v)
            .reduce((a, b) => a + b, 0);
        return Math.round(1000 / total * value) / 10 + '%';
    }
}