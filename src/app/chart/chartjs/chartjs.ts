import { Chart, ChartType as ChartJsType, ChartConfiguration, registerables } from 'chart.js';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { ChartJsOptionsProvider } from './chartjs-options-provider';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chartjs-adapter-moment';
import { DatasetStyler } from '../customizer/dataset-styler';
import { BarLegendCustomizer } from '../customizer/bar-legend-customizer';

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

        new BarLegendCustomizer().customize(context, config);
        context.chart = new Chart(canvas, config);
    }

    private toChartJsType(chartType: ChartType): ChartJsType {
        switch (chartType) {
            case ChartType.AREA:
                return 'line';
            case ChartType.HORIZONTAL_BAR:
                return 'bar';
            default:
                return <ChartJsType>chartType.type;
        }
    }

}