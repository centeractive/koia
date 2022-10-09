import { ChartType } from 'app/shared/model/chart';
import { ChartData } from 'chart.js';

export class DatasetStyler {

    style(data: ChartData, chartType: ChartType): void {
        data.datasets.forEach(ds => {
            switch (chartType) {
                case ChartType.LINE:
                case ChartType.AREA:
                    (ds as any).pointRadius = this.pointRadiusOf(ds.data.length);
                    break;
                default:
                    break;
            }
        });
    }

    private pointRadiusOf(valuesCount: number): number {
        if (valuesCount > 250) {
            return 1;
        }
        return valuesCount > 125 ? 2 : 3;
    }

}