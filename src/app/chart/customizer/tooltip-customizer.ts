import { DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartOptions } from 'chart.js';
import { FormatUtils } from '../chartjs/formatter/format-utils';
import { TimeFormatter } from '../chartjs/formatter/time-formatter';

export class TooltipCustomizer extends TimeFormatter {

    customize(context: ChartContext, options: ChartOptions): void {
        const chartType = ChartType.fromType(context.chartType);
        if (context.isCategoryChart()) {
            const nameColumn = context.groupByColumns[0];
            options.plugins.tooltip.callbacks = {};
            if (nameColumn?.dataType === DataType.TIME) {
                const momentFormat = this.momentFormatOf(nameColumn);
                options.plugins.tooltip.callbacks.title = ctx => {
                    const label = ctx[0].chart.data.labels[ctx[0].dataIndex];
                    return this.formatTime(label, momentFormat);
                };
            } else if (context.isAggregationCountSelected()) {
                options.plugins.tooltip.callbacks.title = ctx => {
                    const label = ctx[0].chart.data.labels[ctx[0].dataIndex];
                    return context.dataColumns[0].name + ': ' + label;
                };
            } else {
                options.plugins.tooltip.callbacks.title = ctx => '' + ctx[0].chart.data.labels[ctx[0].dataIndex];
            }
            if (context.isAggregationCountSelected()) {
                options.plugins.tooltip.callbacks.label = ctx => 'Count: ' + ctx.formattedValue;
            } else if (context.isCircularChart() && chartType !== ChartType.RADAR) {
                options.plugins.tooltip.callbacks.label = ctx => context.dataColumns[ctx.datasetIndex].name + ': ' + ctx.formattedValue +
                    ' (' + FormatUtils.percentage(ctx.chart.data.datasets[ctx.datasetIndex].data, <number>ctx.raw) + ')';
            }
        }
    }


}