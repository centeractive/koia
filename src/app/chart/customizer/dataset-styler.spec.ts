import { ChartType } from 'app/shared/model/chart';
import { ChartData, ChartDataset } from 'chart.js';
import { DatasetStyler } from './dataset-styler';

describe('DatasetStyler', () => {

    const styler = new DatasetStyler();

    it('#style should set point radius 3 when line chart has up to 125 values', () => {
        // given
        const data = chartData(125);

        // when
        styler.style(data, ChartType.LINE);

        // then
        expect(pointRadius(data)).toBe(3);
    });

    it('#style should set point radius 2 when area chart has more than 125 values', () => {
        // given
        const data = chartData(126);

        // when
        styler.style(data, ChartType.AREA);

        // then
        expect(pointRadius(data)).toBe(2);
    });

    it('#style should set point radius 2 when line chart has 250 values', () => {
        // given
        const data = chartData(250);

        // when
        styler.style(data, ChartType.LINE);

        // then
        expect(pointRadius(data)).toBe(2);
    });

    it('#style should set point radius 1 when line chart has more than 250 values', () => {
        // given
        const data = chartData(251);

        // when
        styler.style(data, ChartType.LINE);

        // then
        expect(pointRadius(data)).toBe(1);
    });

    it('#style should not set point radius when bar chart', () => {
        // given
        const data = chartData(3);

        // when
        styler.style(data, ChartType.BAR);

        // then
        expect(pointRadius(data)).toBeUndefined();
    });

    function chartData(valuesCount: number): ChartData {
        return {
            datasets: [{
                data: Array.from({ length: valuesCount }, (_, i) => i)
            }]
        };
    }

    function pointRadius(data: ChartData): unknown {
        return (data.datasets[0] as ChartDataset<'line'>).pointRadius;
    }
});