import { ChartData } from "chart.js";
import { tooltipMode } from "./tooltip-mode";

describe('tooltip-mode', () => {

    it('#tooltipMode single dataset of primitive values', () => {
        // given
        const data: ChartData = {
            labels: ['a', 'b'],
            datasets: [
                { data: [1, 5] }
            ]
        };

        // when
        const mode = tooltipMode(data);

        // then
        expect(mode).toBe('nearest');
    });

    it('#tooltipMode multiple datasets of primitive values', () => {
        // given
        const data: ChartData = {
            labels: ['a', 'b'],
            datasets: [
                { data: [1, 5] },
                { data: [4, 2] },
            ]
        };

        // when
        const mode = tooltipMode(data);

        // then
        expect(mode).toBe('index');
    });

    it('#tooltipMode single dataset of data points', () => {
        // given
        const data: ChartData = {
            datasets: [
                { data: [{ x: 1, y: 2 }, { x: 2, y: 5 }, { x: 3, y: 4 }] }
            ]
        };

        // when
        const mode = tooltipMode(data);

        // then
        expect(mode).toBe('nearest');
    });

    it('#tooltipMode multiple datasets of non-aligned data points', () => {
        // given
        const data: ChartData = {
            datasets: [
                { data: [{ x: 1, y: 2 }, { x: 2, y: 5 }, { x: 3, y: 4 }] },
                { data: [{ x: 1, y: 5 }, { x: 3, y: 2 }, { x: 5, y: 7 }] },
            ]
        };

        // when
        const mode = tooltipMode(data);

        // then
        expect(mode).toBe('nearest');
    });

    it('#tooltipMode multiple datasets of aligned data points', () => {
        // given
        const data: ChartData = {
            datasets: [
                { data: [{ x: 1, y: 2 }, { x: 2, y: 5 }, { x: 3, y: 4 }] },
                { data: [{ x: 1, y: 5 }, { x: 2, y: 2 }, { x: 3, y: 7 }] },
            ]
        };

        // when
        const mode = tooltipMode(data);

        // then
        expect(mode).toBe('index');
    });

});