import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { ArrayUtils, DateTimeUtils } from 'app/shared/utils';
import { ChartOptions, LayoutPosition, RadialLinearScaleOptions, ScaleOptions } from 'chart.js';
import { TooltipCustomizer } from '../../customizer/tooltip-customizer';
import { ChartJsUtils } from '../chart-js-utils';
import { FormatUtils } from '../formatter/format-utils';
import { LegendLabelFormatter } from '../formatter/legend-label-formatter';
import { PointLabelFormatter } from '../formatter/point-label-formatter';
import { TickLabelFormatter } from '../formatter/tick-label-formatter';
import { RawDataRevealer } from '../raw-data-revealer';
import { tooltipMode } from './tooltip-mode';

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
            case ChartType.LINEAR_HORIZONTAL_BAR:
                options.indexAxis = 'y';
                options.parsing = { yAxisKey: 'x', xAxisKey: 'y' };
                options.scales = {
                    y: this.baseScaleOptions(chartType, context),
                    x: this.valueScaleOptions(chartType, context)
                };
                this.addAdditionalValueAxes(context, options.scales);
                break;
            default:
                if (!context.isCircularChart()) {
                    options.scales = {
                        y: this.valueScaleOptions(chartType, context),
                        x: this.baseScaleOptions(chartType, context)
                    };
                    this.addAdditionalValueAxes(context, options.scales);
                }
                break;
        }
        this.legendLabelFormatter.format(context, options);
        this.tooltipCustomizer.customize(context, options);
        return options;
    }

    private addAdditionalValueAxes(context: ChartContext, scaleOptions: ScaleOptions): void {
        if (context.dataColumns.length > 1 && context.multiValueAxes) {
            const chartType = ChartType.fromType(context.chartType);
            for (let i = 1; i < context.dataColumns.length; i++) {
                if (context.isHorizontalChart()) {
                    const id = 'x' + (i + 1);
                    scaleOptions[id] = this.valueScaleOptions(chartType, context, i);
                    if (i % 2) {
                        scaleOptions[id].position = 'top';
                    }
                } else {
                    const id = 'y' + (i + 1);
                    scaleOptions[id] = this.valueScaleOptions(chartType, context, i);
                    if (i % 2) {
                        scaleOptions[id].position = 'right';
                    }
                }
            }
        }
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
                    mode: tooltipMode(context.data),
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
            onClick: (e, elements, chart) => this.rawDataRevealer.reveal(elements, chart.data, context)
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

    private valueScaleOptions(chartType: ChartType, context: ChartContext, columnIdx = 0): ScaleOptions {
        const title = this.valueScaleTitle(context, columnIdx);
        const scaleOptions: ScaleOptions = {
            display: !this.chartTypesHiddenScales.includes(chartType),
            stacked: context.stacked,
            title: {
                display: !!title,
                text: title
            }
        };
        const ticks = context.valueScales[columnIdx].ticks;
        if (ticks.stepSize) {
            scaleOptions.ticks = {
                stepSize: ticks.stepSize
            };
        }
        if (ticks.rotation) {
            scaleOptions.ticks = {
                ...scaleOptions.ticks || {},
                maxRotation: -ticks.rotation,
                minRotation: -ticks.rotation
            };
        }
        return scaleOptions;
    }

    private valueScaleTitle(context: ChartContext, columnIdx: number): string {
        if (context.isAggregationCountSelected()) {
            return 'Count';
        } else if (context.dataColumns.length == 1 || context.multiValueAxes) {
            return context.dataColumns[columnIdx].name;
        } else {
            return null;
        }
    }

    private baseScaleOptions(chartType: ChartType, context: ChartContext): ScaleOptions {
        if (this.chartTypesHiddenScales.includes(chartType)) {
            return { display: false };
        }
        const scaleOptions: ScaleOptions = {
            display: !this.chartTypesHiddenScales.includes(chartType),
            stacked: context.stacked
        };
        const ticks = context.baseScale.ticks;
        if (ticks.stepSize) {
            scaleOptions.ticks = {
                stepSize: ticks.stepSize
            };
        }
        if (ticks.rotation) {
            scaleOptions.ticks = {
                ...scaleOptions.ticks || {},
                maxRotation: -ticks.rotation,
                minRotation: -ticks.rotation
            };
        }
        const column = context.groupByColumns[0];
        if (column) {
            scaleOptions.title = {
                display: true,
                text: column.name
            }
        }

        if (context.isCategoryChart()) {
            this.tickLabelFormatter.format(context, column, scaleOptions);
        } else if (column.dataType) {
            switch (column.dataType) {
                case DataType.NUMBER: {
                    scaleOptions.type = 'linear';
                    const xRange = ChartJsUtils.overallXRangeOf(context.data);

                    // not using min/max to avoid cut data-points at the chart border
                    scaleOptions['suggestedMin'] = xRange.min;
                    scaleOptions['suggestedMax'] = xRange.max;
                    break;
                }
                case DataType.TIME:
                    this.addTimeOptions(scaleOptions, column, context);
                    break;
                default:
                    break;
            }
        }
        return scaleOptions;
    }

    private addTimeOptions(scaleOptions: ScaleOptions, timeColumn: Column, context: ChartContext): void {
        scaleOptions.type = 'time';
        const timeScaleOptions: any = scaleOptions; // TODO: consider using TimeScaleOptions type

        const scaleTimeUnit = this.scaleTimeUnit(timeColumn, context);
        timeScaleOptions.time = {
            unit: scaleTimeUnit,
            displayFormats: {
                [scaleTimeUnit]: DateTimeUtils.luxonFormatOf(scaleTimeUnit),
            },
            tooltipFormat: this.tooltipFormat(timeColumn)
        };
    }

    private scaleTimeUnit(timeColumn: Column, context: ChartContext): TimeUnit {
        const columnTimeUnit = DateTimeUtils.timeUnitFromNgFormat(timeColumn.format);
        const largestMatchingTimeUnit = DateTimeUtils.largestMatchingTimeUnit(this.duration(timeColumn, context), 10);
        return DateTimeUtils.maxTimeUnit(columnTimeUnit, timeColumn.groupingTimeUnit, largestMatchingTimeUnit);
    }

    private duration(timeColumn: Column, context: ChartContext): number {
        const timeRange = ArrayUtils.numberValueRange(context.entries, timeColumn.name);
        return timeRange.max - timeRange.min;
    }

    private tooltipFormat(timeColumn: Column): string {
        if (timeColumn.groupingTimeUnit) {
            return DateTimeUtils.luxonFormatOf(timeColumn.groupingTimeUnit);
        }
        return timeColumn.format;
    }

}