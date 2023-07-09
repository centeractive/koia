import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { Chart, ChartConfiguration, ChartType as ChartJsType, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BarLegendCustomizer } from '../customizer/bar-legend-customizer';
import { DatasetStyler } from '../customizer/dataset-styler';
import { ChartJsOptionsProvider } from './options/chartjs-options-provider';

export class ChartJs {

    private datasetStyler = new DatasetStyler();
    private optionsProvider: ChartJsOptionsProvider;

    constructor(rawDataRevealService: RawDataRevealService) {
        this.optionsProvider = new ChartJsOptionsProvider(rawDataRevealService);
        Chart.register(...registerables, ChartDataLabels);
    }

    create(canvas: HTMLCanvasElement, context: ChartContext): void {
        if (context.chart) {
            context.chart.destroy();
        }
        const chartType = ChartType.fromType(context.chartType);
        this.datasetStyler.style(context.data, chartType);
        const config: ChartConfiguration = {
            type: this.toChartJsType(chartType),
            data: context.data,
            options: this.optionsProvider.createOptions(context)
        };

        console.log('chart config', config);

        new BarLegendCustomizer().customize(context, config);
        context.chart = new Chart(canvas, config);
    }

    private toChartJsType(chartType: ChartType): ChartJsType {
        switch (chartType) {
            case ChartType.AREA:
                return 'line';
            case ChartType.LINEAR_BAR:
            case ChartType.HORIZONTAL_BAR:
            case ChartType.LINEAR_HORIZONTAL_BAR:
                return 'bar';
            default:
                return chartType.type as ChartJsType;
        }
    }

}