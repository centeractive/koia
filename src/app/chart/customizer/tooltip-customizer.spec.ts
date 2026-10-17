import { Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartOptions, TooltipItem } from 'chart.js';
import { DateTime } from 'luxon';
import { TooltipCustomizer } from './tooltip-customizer';

describe('TooltipCustomizer', () => {

    it('#customize should format time label as tooltip title when category chart is grouped by time column', () => {
        // given
        const timeColumn: Column = { name: 'Time', dataType: DataType.TIME, format: 'd MMM yyyy', width: 10 };
        const amountColumn: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
        const context = new ChartContext([timeColumn, amountColumn], ChartType.PIE.type, null);
        context.dataColumns = [amountColumn];
        context.groupByColumns = [timeColumn];
        const options: ChartOptions = { plugins: { tooltip: {} } };
        new TooltipCustomizer().customize(context, options);
        const tooltipItem = { chart: { data: { labels: [1230764400000] } }, dataIndex: 0 } as TooltipItem<'pie'>;

        // when
        const title = options.plugins.tooltip.callbacks.title.call(null, [tooltipItem]);

        // then
        expect(title).toBe(DateTime.fromMillis(1230764400000).toFormat('d MMM yyyy'));
    });
});