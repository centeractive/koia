import {
    ArcElement, BarController, BarElement, CategoryScale, Chart, ChartConfiguration,
    ChartData, ChartType as ChartJsType, DoughnutController, Filler, Legend, LinearScale,
    LineController, LineElement, PieController, PointElement, PolarAreaController,
    RadarController, RadialLinearScale, ScatterController, TimeScale, Tooltip
} from 'chart.js';
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
        Chart.register(BarController, PieController, DoughnutController, RadarController, LineController, ScatterController,
            RadarController, PolarAreaController, CategoryScale, TimeScale, RadialLinearScale,
            BarElement, ArcElement, LineElement, PointElement, LinearScale, Legend, Tooltip, Filler,
            ChartDataLabels);
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

        console.log(JSON.stringify(config, undefined, '  '));

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