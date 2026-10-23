import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Aggregation, Column, ComputeOperator, DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { SeriesNameConverter } from 'app/shared/services/chart';
import { ActiveElement, ArcElement, BarElement, ChartData, PointElement } from 'chart.js';
import { RawDataRevealer } from './raw-data-revealer';
import type { Mock } from 'vitest';

let revealer: RawDataRevealer;
let ofIDSpy: Mock;
let ofQuerySpy: Mock;
let ofTimeUnitSpy: Mock;

describe('RawDataRevealer - PIE', () => {

    beforeEach(() => {
        setup();
    });

    it('#reveal - count distinct values', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: arcElement(), datasetIndex: 0, index: 2 }];
        const data: ChartData = {
            labels: ['A', 'B', 'C'],
            datasets: [{
                label: 'Name',
                data: [1, 3, 2]
            }]
        };
        const dataColumn = textColumn('Name');
        const context = new ChartContext([dataColumn], ChartType.PIE.type, null);
        context.aggregations = [Aggregation.COUNT];
        context.dataColumns = [dataColumn];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Name'], ['C'], context);
    });

    it('#reveal - individual values', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: arcElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            labels: ['A', 'B', 'C'],
            datasets: [{
                label: 'Amount',
                data: [900, 550, 470]
            }]
        };
        const colName = textColumn('Name');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colName, colAmount], ChartType.PIE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colName];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(notEmptyQuery('Amount'), ['Name'], ['B'], context);
    });

    it('#reveal - individual values by time', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: arcElement(), datasetIndex: 0, index: 2 }];
        const data: ChartData = {
            labels: [1734994800000, 1735081200000, 1735167600000],
            datasets: [{
                label: 'Amount',
                data: [900, 550, 470]
            }]
        };
        const colTimestamp = timeColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colAmount], ChartType.PIE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(notEmptyQuery('Amount'), ['Timestamp'], [1735167600000], context);
    });

    it('#reveal - count distinct values of boolean column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: arcElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            labels: ['false', 'true'],
            datasets: [{
                label: 'Flag',
                data: [4, 6]
            }]
        };
        const dataColumn = booleanColumn('Flag');
        const context = new ChartContext([dataColumn], ChartType.PIE.type, null);
        context.aggregations = [Aggregation.COUNT];
        context.dataColumns = [dataColumn];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Flag'], [true], context);
    });

    it('#reveal - individual values of computed data column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: arcElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            labels: ['A', 'B', 'C'],
            datasets: [{
                label: 'Share',
                data: [40, 35, 25]
            }]
        };
        const colName = textColumn('Name');
        const colShare = computedColumn('Share');
        const context = new ChartContext([colName, colShare], ChartType.PIE.type, null);
        context.dataColumns = [colShare];
        context.groupByColumns = [colName];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(context.query, ['Name'], ['B'], context);
        expect(ofQuerySpy.mock.calls[0][0]).toBe(context.query);
    });

});

describe('RawDataRevealer - HORIZONTAL_BAR', () => {

    beforeEach(() => {
        setup();
    });

    it('#reveal - count distinct values', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: barElement(), datasetIndex: 1, index: 0 }];
        const data: ChartData = {
            labels: [],
            datasets: [
                {
                    label: 'A',
                    data: [{ x: 1, y: 1 }]
                },
                {
                    label: 'B',
                    data: [{ x: 2, y: 3 }]
                },
                {
                    label: 'C',
                    data: [{ x: 3, y: 2 }]
                }
            ]
        };
        const dataColumn = textColumn('Name');
        const context = new ChartContext([dataColumn], ChartType.HORIZONTAL_BAR.type, null);
        context.aggregations = [Aggregation.COUNT];
        context.dataColumns = [dataColumn];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Name'], ['B'], context);
    });

    it('#reveal - individual values', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: barElement(), datasetIndex: 1, index: 0 }];
        const data: ChartData = {
            labels: [],
            datasets: [
                {
                    label: 'A',
                    data: [{ x: 1, y: 900 }]
                },
                {
                    label: 'B',
                    data: [{ x: 2, y: 550 }]
                },
                {
                    label: 'C',
                    data: [{ x: 3, y: 720 }]
                }
            ]
        };
        const colName = textColumn('Name');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colName, colAmount], ChartType.HORIZONTAL_BAR.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colName];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(notEmptyQuery('Amount'), ['Name'], ['B'], context);
    });

    it('#reveal - count distinct values of boolean column with bar legend', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: barElement(), datasetIndex: 0, index: 0 }];
        const data = {
            labels: [],
            datasets: [
                { label: 'false', originalLabel: 'false', data: [{ x: 1, y: 4 }] },
                { label: 'true', originalLabel: 'true', data: [{ x: 2, y: 6 }] }
            ]
        } as unknown as ChartData;
        const dataColumn = booleanColumn('Flag');
        const context = new ChartContext([dataColumn], ChartType.HORIZONTAL_BAR.type, null);
        context.aggregations = [Aggregation.COUNT];
        context.dataColumns = [dataColumn];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Flag'], [false], context);
    });

    it('#reveal - individual values of time named bar at epoch', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: barElement(), datasetIndex: 0, index: 0 }];
        const data = {
            labels: [],
            datasets: [{ label: '1 Jan 1970', originalLabel: 0, data: [{ x: 1, y: 900 }] }]
        } as unknown as ChartData;
        const colTimestamp = timeColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colAmount], ChartType.HORIZONTAL_BAR.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(notEmptyQuery('Amount'), ['Timestamp'], [0], context);
    });

});

describe('RawDataRevealer - LINEAR_HORIZONTAL_BAR', () => {

    beforeEach(() => {
        setup();
    });

    it('#reveal - count distinct values', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: barElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            labels: ['Glasgow', 'London'],
            datasets: [
                {
                    label: 'Pizza',
                    data: [{ x: 'Glasgow', y: 1 }, { x: 'London', y: 14 }]
                }
            ]
        } as unknown as ChartData;
        const colCity = textColumn('City');
        const colFoodType = textColumn('Food Type');
        const context = new ChartContext([colCity, colFoodType], ChartType.LINEAR_HORIZONTAL_BAR.type, null);
        context.aggregations = [Aggregation.COUNT];
        context.dataColumns = [colFoodType];
        context.groupByColumns = [colCity];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Food Type', 'City'], ['Pizza', 'London'], context);
    });

    it('#reveal - individual values by time', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: barElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            labels: [],
            datasets: [
                {
                    label: 'Amount',
                    data: [
                        {
                            id: '1000001',
                            x: 1734994800000,
                            y: 900
                        },
                        {
                            id: '1000002',
                            x: 1735081200000,
                            y: 550
                        },
                        {
                            id: '1000003',
                            x: 1735167600000,
                            y: 470
                        }
                    ]
                }
            ]
        } as unknown as ChartData;
        const colTimestamp = timeColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colAmount], ChartType.LINEAR_HORIZONTAL_BAR.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofIDSpy).toHaveBeenCalledWith('1000002');
    });

    it('#reveal - individual multiple values of unique named column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: barElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            labels: ['A', 'B', 'C'],
            datasets: [
                {
                    label: 'Amount',
                    data: [900, 550, 470]
                },
                {
                    label: 'Discount',
                    data: [90, 50, 0]
                }
            ]
        } as unknown as ChartData;
        const colName = textColumn('Name');
        const colAmount = numberColumn('Amount');
        const colDiscount = numberColumn('Discount');
        const context = new ChartContext([colName, colAmount, colDiscount], ChartType.LINEAR_HORIZONTAL_BAR.type, null);
        context.dataColumns = [colAmount, colDiscount];
        context.groupByColumns = [colName];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(notEmptyQuery('Amount'), ['Name'], ['B'], expect.anything());
    });

});

describe('RawDataRevealer - LINE', () => {

    beforeEach(() => {
        setup();
    });

    it('#reveal - 2 series of individual values by text column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 2 }];
        const data: ChartData = {
            labels: ['A', 'B', 'C'],
            datasets: [
                {
                    label: 'Amount',
                    data: [900, 550, 470]
                },
                {
                    label: 'Discount',
                    data: [8, 5, 0]
                }
            ]
        };
        const colAmount = numberColumn('City');
        const colDiscount = numberColumn('Discount');
        const colName = textColumn('Name');
        const context = new ChartContext([colAmount, colDiscount, colName], ChartType.LINE.type, null);
        context.aggregations = [Aggregation.COUNT];
        context.dataColumns = [colAmount, colDiscount];
        context.groupByColumns = [colName];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(notEmptyQuery('City'), ['Name'], ['C'], context);
    });

    it('#reveal - no element', () => {
        // given
        const colTimestamp = timeColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colAmount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];

        // when
        revealer.reveal([], { datasets: [] }, context);

        // then
        expectNoReveal();
    });

    it('#reveal - unexpected element', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: arcElement(), datasetIndex: 0, index: 0 }];
        const data: ChartData = {
            datasets: [{ label: 'Amount', data: [{ x: 1734994800000, y: 900 }] }]
        };
        const colTimestamp = timeColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colAmount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expectNoReveal();
    });

    it('#reveal - count values by time', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 1, index: 1 }];
        const data: ChartData = {
            datasets: [
                { label: '550', data: [{ x: 1734994800000, y: 1 }] },
                { label: '900', data: [{ x: 1734994800000, y: 2 }, { x: 1735081200000, y: 3 }] }
            ]
        };
        const colTimestamp = timeColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colAmount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.aggregations = [Aggregation.COUNT];
        context.groupByColumns = [colTimestamp];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofTimeUnitSpy).toHaveBeenCalledWith(undefined, [colTimestamp], [1735081200000], ['Amount'], [900], context);
    });

    it('#reveal - count values by text split by column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            datasets: [{
                label: 'London' + SeriesNameConverter.SEPARATOR + '900',
                data: [{ x: 'Burger', y: 1 }, { x: 'Pizza', y: 2 }]
            }]
        } as unknown as ChartData;
        const colCity = textColumn('City');
        const colAmount = numberColumn('Amount');
        const colFood = textColumn('Food');
        const context = new ChartContext([colCity, colAmount, colFood], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.aggregations = [Aggregation.COUNT];
        context.groupByColumns = [colFood];
        context.splitColumns = [colCity];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['City', 'Amount', 'Food'], ['London', 900, 'Pizza'], context);
    });

    it('#reveal - individual values with ID', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 0 }];
        const data: ChartData = {
            datasets: [{ label: 'Amount', data: [{ id: '1000001', x: 1734994800000, y: 900 }] }]
        } as unknown as ChartData;
        const colTimestamp = timeColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colAmount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofIDSpy).toHaveBeenCalledWith('1000001');
    });

    it('#reveal - individual values without ID split by column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 0 }];
        const data: ChartData = {
            datasets: [{ label: 'London' + SeriesNameConverter.SEPARATOR + 'Amount', data: [{ x: 1734994800000, y: 900 }] }]
        };
        const colTimestamp = timeColumn('Timestamp');
        const colCity = textColumn('City');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colCity, colAmount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];
        context.splitColumns = [colCity];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofTimeUnitSpy).toHaveBeenCalledWith(undefined, [colTimestamp], [1734994800000], ['City', 'Amount'], ['London', 900], context);
    });

    it('#reveal - individual values without ID of second data column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 1, index: 0 }];
        const data: ChartData = {
            datasets: [
                { label: 'Amount', data: [{ x: 'A', y: 900 }] },
                { label: 'Discount', data: [{ x: 'A', y: 90 }] }
            ]
        } as unknown as ChartData;
        const colName = numberColumn('Rank');
        const colAmount = numberColumn('Amount');
        const colDiscount = numberColumn('Discount');
        const context = new ChartContext([colName, colAmount, colDiscount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount, colDiscount];
        context.groupByColumns = [colName];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Discount', 'Rank'], [90, 'A'], context);
    });

    it('#reveal - individual values without ID of unknown dataset label fall back to first data column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 0 }];
        const data: ChartData = {
            datasets: [{ label: 'Unknown', data: [{ x: 'A', y: 900 }] }]
        } as unknown as ChartData;
        const colName = numberColumn('Rank');
        const colAmount = numberColumn('Amount');
        const colDiscount = numberColumn('Discount');
        const context = new ChartContext([colName, colAmount, colDiscount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount, colDiscount];
        context.groupByColumns = [colName];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Amount', 'Rank'], [900, 'A'], context);
    });

    it('#reveal - sum of values by time split by column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 0 }];
        const data: ChartData = {
            datasets: [{ label: 'London' + SeriesNameConverter.SEPARATOR + 'Amount', data: [{ x: 1734994800000, y: 1800 }] }]
        };
        const colTimestamp = timeColumn('Timestamp');
        const colCity = textColumn('City');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colCity, colAmount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];
        context.splitColumns = [colCity];
        context.aggregations = [Aggregation.SUM];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofTimeUnitSpy).toHaveBeenCalledWith(notEmptyQuery('Amount'), [colTimestamp], [1734994800000], ['City'], ['London'], context);
    });

    it('#reveal - row count by time', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            datasets: [{ label: 'Row Count', data: [{ x: 1734994800000, y: 2 }, { x: 1735081200000, y: 3 }] }]
        };
        const colTimestamp = timeColumn('Timestamp');
        const context = new ChartContext([colTimestamp], ChartType.LINE.type, null);
        context.groupByColumns = [colTimestamp];
        context.aggregations = [Aggregation.ROW_COUNT];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofTimeUnitSpy).toHaveBeenCalledWith(undefined, [colTimestamp], [1735081200000], [], [], context);
    });

    it('#reveal - row count by time split by column', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: barElement(), datasetIndex: 1, index: 0 }];
        const data: ChartData = {
            datasets: [
                { label: '1', data: [{ x: 1734994800000, y: 2 }] },
                { label: '2', data: [{ x: 1734994800000, y: 5 }] }
            ]
        };
        const colTimestamp = timeColumn('Timestamp');
        const colLevel = numberColumn('Level');
        const context = new ChartContext([colTimestamp, colLevel], ChartType.LINEAR_BAR.type, null);
        context.groupByColumns = [colTimestamp];
        context.splitColumns = [colLevel];
        context.aggregations = [Aggregation.ROW_COUNT];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofTimeUnitSpy).toHaveBeenCalledWith(undefined, [colTimestamp], [1734994800000], ['Level'], [2], context);
    });

    it('#reveal - sum of values by number', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 0 }];
        const data: ChartData = {
            datasets: [{ label: 'Amount', data: [{ x: 3, y: 1800 }] }]
        };
        const colRank = numberColumn('Rank');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colRank, colAmount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colRank];
        context.aggregations = [Aggregation.SUM];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(notEmptyQuery('Amount'), ['Rank'], [3], context);
    });

    it('#reveal - sum of values by text', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            datasets: [{ label: 'Amount', data: [{ x: 'Burger', y: 900 }, { x: 'Pizza', y: 1800 }] }]
        } as unknown as ChartData;
        const colFood = textColumn('Food');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colFood, colAmount], ChartType.LINE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colFood];
        context.aggregations = [Aggregation.SUM];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(notEmptyQuery('Amount'), ['Food'], ['Pizza'], context);
    });

    it('#reveal - average of second data column by time', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 1, index: 0 }];
        const data: ChartData = {
            datasets: [
                { label: 'Amount', data: [{ x: 1734994800000, y: 900 }] },
                { label: 'Price', data: [{ x: 1734994800000, y: 12 }] }
            ]
        };
        const colTimestamp = timeColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const colPrice = numberColumn('Price');
        const context = new ChartContext([colTimestamp, colAmount, colPrice], ChartType.LINE.type, null);
        context.dataColumns = [colAmount, colPrice];
        context.groupByColumns = [colTimestamp];
        context.aggregations = [Aggregation.AVG];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofTimeUnitSpy).toHaveBeenCalledWith(notEmptyQuery('Price'), [colTimestamp], [1734994800000], [], [], context);
    });

    it('#reveal - sum of computed column by time', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 0 }];
        const data: ChartData = {
            datasets: [{ label: 'Share', data: [{ x: 1734994800000, y: 75 }] }]
        };
        const colTimestamp = timeColumn('Timestamp');
        const colShare = computedColumn('Share');
        const context = new ChartContext([colTimestamp, colShare], ChartType.LINE.type, null);
        context.dataColumns = [colShare];
        context.groupByColumns = [colTimestamp];
        context.aggregations = [Aggregation.SUM];
        context.query = new Query();

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofTimeUnitSpy).toHaveBeenCalledWith(context.query, [colTimestamp], [1734994800000], [], [], context);
        expect(ofTimeUnitSpy.mock.calls[0][0]).toBe(context.query);
    });

});

describe('RawDataRevealer - SCATTER', () => {

    beforeEach(() => {
        setup();
    });

    it('#reveal - individual values with ID', () => {
        // given
        const activeElements: ActiveElement[] = [{ element: pointElement(), datasetIndex: 0, index: 1 }];
        const data: ChartData = {
            datasets: [{ label: 'Amount', data: [{ id: '1000001', x: 3, y: 900 }, { id: '1000002', x: 5, y: 550 }] }]
        } as unknown as ChartData;
        const colRank = numberColumn('Rank');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colRank, colAmount], ChartType.SCATTER.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colRank];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofIDSpy).toHaveBeenCalledWith('1000002');
    });

});

function expectNoReveal(): void {
    expect(ofIDSpy).not.toHaveBeenCalled();
    expect(ofQuerySpy).not.toHaveBeenCalled();
    expect(ofTimeUnitSpy).not.toHaveBeenCalled();
}

function setup(): void {
    TestBed.configureTestingModule({
        imports: [MatDialogModule],
        providers: [RawDataRevealService]
    });
    const rawDataRevealService = TestBed.inject(RawDataRevealService);
    revealer = new RawDataRevealer(rawDataRevealService);
    ofIDSpy = vi.spyOn(rawDataRevealService, 'ofID').mockReturnValue(undefined);
    ofQuerySpy = vi.spyOn(rawDataRevealService, 'ofQuery').mockReturnValue(undefined);
    ofTimeUnitSpy = vi.spyOn(rawDataRevealService, 'ofTimeUnit').mockReturnValue(undefined);
}


function notEmptyQuery(columnName: string): Query {
    return new Query(new PropertyFilter(columnName, Operator.NOT_EMPTY, ''));
}

function booleanColumn(name: string): Column {
    return column(name, DataType.BOOLEAN);
}

function computedColumn(name: string): Column {
    return {
        ...numberColumn(name),
        computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Amount' }
    };
}

function textColumn(name: string): Column {
    return column(name, DataType.TEXT);
}

function numberColumn(name: string): Column {
    return column(name, DataType.NUMBER);
}

function timeColumn(name: string): Column {
    return {
        ...column(name, DataType.TIME),
        format: 'd MMM yyyy'
    };
}

function column(name: string, dataType: DataType): Column {
    return {
        name,
        dataType,
        width: 10
    };
}

function arcElement(): ArcElement {
    return Object.create(ArcElement.prototype);
}

function barElement(): BarElement {
    return Object.create(BarElement.prototype);
}

function pointElement(): PointElement {
    return Object.create(PointElement.prototype);
}