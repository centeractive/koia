import { ChartOptions, ChartType } from 'chart.js';

export class BarChartOptionsProvider {

    provide(): ChartOptions<'bar'> {
        const options: ChartOptions<'bar'> = {};
        options.scales.x.type = 'linear';
        return options;
    }

}