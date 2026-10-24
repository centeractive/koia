import { BubbleDataPoint, Point } from 'chart.js';

export class FormatUtils {

    static percentage(data: (number | [number, number] | Point | BubbleDataPoint)[], value: number): string {
        if (value == null || value == undefined) {
            return '';
        }
        const total = data
            .filter(v => v != null && v != undefined)
            .map(v => v['y'] || v)
            .filter(v => !isNaN(v))
            .reduce((a, b) => a + b, 0);
        if (total === 0) {
            return '';
        }
        return Math.round(1000 / total * value) / 10 + '%';
    }
}