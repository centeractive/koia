import { ChartContext, ChartType } from 'app/shared/model/chart';
import { relevantData } from './result-filter';
import { textColumn } from './test-data';
import { TestHarness, canvas, chartJs } from './test-harness';

describe('ChartJs - bar', () => {

    let harness: TestHarness;
    let context: ChartContext;

    beforeEach(() => {
        harness = chartJs(ChartType.BAR);
        context = harness.context;
    });

    it('#create should count distinct text values', () => {
        // given
        context.dataColumns = [textColumn];

        // when
        create();

        // then
        expect(relevantData(context)).toEqual({
            labels: [],
            datasets: [
                {
                    label: 'x',
                    data: [{ x: 1, y: 2 }]
                },
                {
                    label: 'y',
                    data: [{ x: 2, y: 1 }]
                }
            ]
        });
    });

    function create(): void {
        context.data = harness.dataService.createData(context).data;
        harness.chart.create(canvas(), context);
    }

});