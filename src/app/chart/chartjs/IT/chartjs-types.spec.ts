import { ChartType } from 'app/shared/model/chart';
import { numberColumn, timeColumn } from './test-data';
import { canvas, chartJs } from './test-harness';

describe('ChartJs - types', () => {

    it('#create should create line chart for AREA', () => {

        // when
        const chartJsType = create(ChartType.AREA);

        // then
        expect(chartJsType).toBe('line');
    });

    it('#create should create bar chart for LINEAR_BAR', () => {

        // when
        const chartJsType = create(ChartType.LINEAR_BAR);

        // then
        expect(chartJsType).toBe('bar');
    });

    it('#create should create bar chart for HORIZONTAL_BAR', () => {

        // when
        const chartJsType = create(ChartType.HORIZONTAL_BAR);

        // then
        expect(chartJsType).toBe('bar');
    });

    it('#create should create bar chart for LINEAR_HORIZONTAL_BAR', () => {

        // when
        const chartJsType = create(ChartType.LINEAR_HORIZONTAL_BAR);

        // then
        expect(chartJsType).toBe('bar');
    });

    function create(chartType: ChartType): string {
        const harness = chartJs(chartType);
        const context = harness.context;
        context.dataColumns = [numberColumn];
        context.aggregations = [];
        context.groupByColumns = [{ ...timeColumn, format: 'yyyy-MM-dd' }];
        context.data = harness.dataService.createData(context).data;
        harness.chart.create(canvas(), context);
        return context.chart.config['type'];
    }

});
