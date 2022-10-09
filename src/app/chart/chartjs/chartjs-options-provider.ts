import { Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { ChartOptions, LayoutPosition, RadialLinearScaleOptions, ScaleOptions } from 'chart.js';
import { RawDataRevealer } from './raw-data-revealer';
import { FormatUtils } from './formatter/format-utils';
import { TooltipCustomizer } from '../customizer/tooltip-customizer';
import { LegendLabelFormatter } from './formatter/legend-label-formatter';
import { DateTimeUtils } from 'app/shared/utils';
import { TickLabelFormatter } from './formatter/tick-label-formatter';
import { PointLabelFormatter } from './formatter/point-label-formatter';
import { ChartJsUtils } from './chart-js-utils';

export class ChartJsOptionsProvider {

    private readonly chartTypesHiddenScales = [ChartType.PIE, ChartType.DOUGHNUT, ChartType.RADAR, ChartType.POLAR_AREA];
    private legendLabelFormatter = new LegendLabelFormatter();
    private tickLabelFormatter = new TickLabelFormatter();
    private pointLabelFormatter = new PointLabelFormatter();
    private tooltipCustomizer = new TooltipCustomizer();
    private rawDataRevealer: RawDataRevealer;

    constructor(rawDataRevealService: RawDataRevealService) {
        this.rawDataRevealer = new RawDataRevealer(rawDataRevealService);
    }

    createOptions(context: ChartContext): ChartOptions {
        const chartType = ChartType.fromType(context.chartType);
        const options = this.createCommonOptions(chartType, context);
        switch (chartType) {
            case ChartType.RADAR:
                options.scales = {
                    r: this.radarScaleOptions(context)
                };
                break;
            case ChartType.HORIZONTAL_BAR:
                options.indexAxis = 'y';
                options.parsing = { yAxisKey: 'x', xAxisKey: 'y' };
                options.scales = {
                    y: this.xScaleOptions(chartType, context),
                    x: this.yScaleOptions(chartType, context)
                };
                break;
            default:
                if (!context.isCircularChart()) {
                    options.scales = {
                        y: this.yScaleOptions(chartType, context),
                        x: this.xScaleOptions(chartType, context)
                    };
                }
                break;
        }
        this.legendLabelFormatter.format(context, options);
        this.tooltipCustomizer.customize(context, options);
        return options;
    }

    private createCommonOptions(chartType: ChartType, context: ChartContext): ChartOptions {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: context.showLegend,
                    position: <LayoutPosition>context.legendPosition,
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: context.data.datasets.length === 1 || !ChartType.isCategoryChart(chartType) ? 'nearest' : 'index',
                    intersect: true
                },
                datalabels: {
                    display: ChartType.isCircularChart(chartType) && chartType !== ChartType.RADAR,
                    formatter: (v, ctx) => context.valueAsPercent ? FormatUtils.percentage(ctx.dataset.data, v) : v
                }
            },
            layout: {
                padding: context.margin
            },
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            onHover: (e, elements, chart) => chart.canvas.style.cursor = elements.length ? 'pointer' : 'default',
            onClick: (e, elements, chart) => this.rawDataRevealer.reveal(elements, chart, context)
        };
    }

    private radarScaleOptions(context: ChartContext): ScaleOptions {
        const scaleOptions = {
            grid: {
                circular: true
            }
        } as RadialLinearScaleOptions;
        this.pointLabelFormatter.format(context.groupByColumns[0], scaleOptions);
        return scaleOptions;
    }

    private yScaleOptions(chartType: ChartType, context: ChartContext): ScaleOptions {
        return {
            display: !this.chartTypesHiddenScales.includes(chartType),
            stacked: context.stacked
        };
    }

    private xScaleOptions(chartType: ChartType, context: ChartContext): ScaleOptions {
        if (this.chartTypesHiddenScales.includes(chartType)) {
            return { display: false };
        }
        const scaleOptions: ScaleOptions = {
            display: !this.chartTypesHiddenScales.includes(chartType),
            stacked: context.stacked
        };
        if (context.xLabelRotation != undefined) {
            scaleOptions.ticks = {
                maxRotation: -context.xLabelRotation,
                minRotation: -context.xLabelRotation
            };
        }
        const column = context.groupByColumns[0];

        if (context.isCategoryChart()) {
            this.tickLabelFormatter.format(column, scaleOptions);

            // TODO: consider using time-axis instead (see TickLabelFormatter#format)
            if (column?.dataType === DataType.TIME) {
                scaleOptions.type = 'linear';
                scaleOptions.offset = false;
            }
        } else {
            switch (column.dataType) {
                case DataType.NUMBER:
                    scaleOptions.type = 'linear';
                    const xRange = ChartJsUtils.overallXRangeOf(context.data);

                    // not using min/max to avoid cut data-points at the chart border
                    scaleOptions['suggestedMin'] = xRange.min;
                    scaleOptions['suggestedMax'] = xRange.max;
                    break;
                case DataType.TIME:
                    this.addTimeOptions(scaleOptions, column);
                    break;
                default:
                    break;
            }
        }
        return scaleOptions;
    }

    private addTimeOptions(scaleOptions: ScaleOptions, timeColumn: Column): void {
        scaleOptions.type = 'time';
        const timeScaleOptions: any = scaleOptions; // TODO: consider using TimeScaleOptions type

        // TODO: use timeColumn.groupingTimeUnit when grouped
        const timeUnit = DateTimeUtils.timeUnitFromNgFormat(timeColumn.format);
        const timeFormat = DateTimeUtils.momentFormatOf(timeUnit);

        timeScaleOptions.time = {
            unit: timeUnit,
            displayFormats: {
                [timeUnit]: timeFormat,
            },
            tooltipFormat: timeFormat
        };
    }

}