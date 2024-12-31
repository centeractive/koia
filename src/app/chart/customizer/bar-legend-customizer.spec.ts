import { Column, DataType } from "app/shared/model";
import { ChartContext, ChartType } from "app/shared/model/chart";
import { ChartConfiguration, ChartData } from "chart.js";
import { BarLegendCustomizer } from "./bar-legend-customizer";

describe('BarLegendCustomizer', () => {

    it('#customize - BAR', () => {
        // given
        const data = chartData();
        const ctx = context(ChartType.BAR, data)
        const cfg = config(data);

        // when
        new BarLegendCustomizer(3).customize(ctx, cfg);

        // then
        expect(cfg.options.scales).toEqual({
            x: {
                display: false
            },
            x1: {
                offset: true,
                ticks: {}
            },
            y: {}
        });
    });

    it('#customize - HORIZONTAL_BAR', () => {
        // given
        const data = chartData();
        const ctx = context(ChartType.HORIZONTAL_BAR, data)
        const cfg = config(data);

        // when
        new BarLegendCustomizer(3).customize(ctx, cfg);

        // then
        expect(cfg.options.scales).toEqual({
            x: {},
            y: {
                display: false
            },
            y1: {
                offset: true,
                ticks: {}
            }
        });
    });

    function context(type: ChartType, data: ChartData): ChartContext {
        const colName: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };
        const colAmount: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
        const context = new ChartContext([colName, colAmount], type.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colName];
        context.data = data;
        return context;
    }

    function config(data: ChartData): ChartConfiguration {
        const config: any = {
            data,
            options: {
                plugins: {
                    tooltip: {
                    }
                },
                scales: {
                    x: {},
                    y: {}
                }
            }
        };
        return config as ChartConfiguration;
    }


    function chartData(): ChartData {
        return {
            labels: ['A', 'B', 'C'],
            datasets: [{
                label: '',
                data: [2, 8, 5],
                backgroundColor: ['red', 'green', 'blue'],
                borderColor: ['red', 'green', 'blue']
            }]
        };
    }

});
