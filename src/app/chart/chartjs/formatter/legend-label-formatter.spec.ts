import { Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartOptions, LegendItem } from 'chart.js';
import { LegendLabelFormatter } from './legend-label-formatter';

describe('LegendLabelFormatter', () => {

    const timeColumn: Column = { name: 'Time', dataType: DataType.TIME, format: 'd MMM yyyy', width: 1 };
    const amountColumn: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 1 };

    const formatter = new LegendLabelFormatter();

    it('#format non-circular chart & time column', () => {
        // given
        const context = chartContext(ChartType.BAR, timeColumn);
        const options = chartOptions();
        const legendItem: LegendItem = { text: 1230764400000 as any };

        // when
        formatter.format(context, options);
        options.plugins.legend.labels.filter(legendItem, null);

        // then
        expect(legendItem.text.toString()).toBe('1230764400000');
    });

    it('#format circular chart & non-time column', () => {
        // given
        const context = chartContext(ChartType.PIE, amountColumn);
        const options = chartOptions();
        const legendItem: LegendItem = { text: 1230764400000 as any };

        // when
        formatter.format(context, options);
        options.plugins.legend.labels.filter(legendItem, null);

        // then
        expect(legendItem.text.toString()).toBe('1230764400000');
    });

    it('#format pie chart & time column', () => {
        // given
        const context = chartContext(ChartType.PIE, timeColumn);
        const options = chartOptions();
        const legendItem: LegendItem = { text: 1230764400000 as any };

        // when
        formatter.format(context, options);
        options.plugins.legend.labels.filter(legendItem, null);

        // then
        expect(legendItem.text).toBe('1 Jan 2009');
    });

    it('#format coughnut chart & time column', () => {
        // given
        const context = chartContext(ChartType.DOUGHNUT, timeColumn);
        const options = chartOptions();
        const legendItem: LegendItem = { text: 1230764400000 as any };

        // when
        formatter.format(context, options);
        options.plugins.legend.labels.filter(legendItem, null);

        // then
        expect(legendItem.text).toBe('1 Jan 2009');
    });

    it('#format doughnut chart & time column', () => {
        // given
        const context = chartContext(ChartType.DOUGHNUT, timeColumn);
        const options = chartOptions();
        const legendItem: LegendItem = { text: 1230764400000 as any };

        // when
        formatter.format(context, options);
        options.plugins.legend.labels.filter(legendItem, null);

        // then
        expect(legendItem.text).toBe('1 Jan 2009');
    });

    it('#format radar chart & time column', () => {
        // given
        const context = chartContext(ChartType.RADAR, timeColumn);
        const options = chartOptions();
        const legendItem: LegendItem = { text: 1230764400000 as any };

        // when
        formatter.format(context, options);
        options.plugins.legend.labels.filter(legendItem, null);

        // then
        expect(legendItem.text.toString()).toBe('1230764400000');
    });

    it('#format polar area chart & time column', () => {
        // given
        const context = chartContext(ChartType.POLAR_AREA, timeColumn);
        const options = chartOptions();
        const legendItem: LegendItem = { text: 1230764400000 as any };

        // when
        formatter.format(context, options);
        options.plugins.legend.labels.filter(legendItem, null);

        // then
        expect(legendItem.text).toBe('1 Jan 2009');
    });

    function chartContext(chartType: ChartType, nameColumn: Column): ChartContext {
        const columns = [timeColumn, amountColumn];
        const context = new ChartContext(columns, chartType.type, {});
        context.groupByColumns = [nameColumn];
        return context;
    }

    function chartOptions(): ChartOptions {
        return {
            plugins: {
                legend: {
                    labels: {
                        filter: () => null
                    }
                }
            }
        };
    }
});