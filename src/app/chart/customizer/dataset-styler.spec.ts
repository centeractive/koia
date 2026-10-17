import { ChartType } from 'app/shared/model/chart';
import { ChartData } from 'chart.js';
import { DatasetStyler } from './dataset-styler';

describe('DatasetStyler', () => {

    const styler = new DatasetStyler();

    it('#style should define point radius 3 of LINE dataset with 125 points', () => {
        // given
        const data = chartData(125);

        // when
        styler.style(data, ChartType.LINE);

        // then
        expect(data.datasets[0]['pointRadius']).toBe(3);
    });

    it('#style should define point radius 2 of LINE dataset with 126 points', () => {
        // given
        const data = chartData(126);

        // when
        styler.style(data, ChartType.LINE);

        // then
        expect(data.datasets[0]['pointRadius']).toBe(2);
    });

    it('#style should define point radius 2 of LINE dataset with 250 points', () => {
        // given
        const data = chartData(250);

        // when
        styler.style(data, ChartType.LINE);

        // then
        expect(data.datasets[0]['pointRadius']).toBe(2);
    });

    it('#style should define point radius 1 of LINE dataset with 251 points', () => {
        // given
        const data = chartData(251);

        // when
        styler.style(data, ChartType.LINE);

        // then
        expect(data.datasets[0]['pointRadius']).toBe(1);
    });

    it('#style should define point radius of AREA dataset', () => {
        // given
        const data = chartData(10);

        // when
        styler.style(data, ChartType.AREA);

        // then
        expect(data.datasets[0]['pointRadius']).toBe(3);
    });

    it('#style should not define point radius of BAR dataset', () => {
        // given
        const data = chartData(10);

        // when
        styler.style(data, ChartType.BAR);

        // then
        expect(data.datasets[0]['pointRadius']).toBeUndefined();
    });

    function chartData(pointCount: number): ChartData {
        return {
            datasets: [{
                label: 'Amount',
                data: Array.from({ length: pointCount }, (_, i) => i)
            }]
        };
    }

});
