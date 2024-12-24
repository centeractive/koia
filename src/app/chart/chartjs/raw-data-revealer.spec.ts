import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Aggregation, Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { ActiveElement, ArcElement, BarElement, ChartData, PointElement } from 'chart.js';
import { RawDataRevealer } from './raw-data-revealer';

let revealer: RawDataRevealer;
let ofIDSpy: jasmine.Spy;
let ofQuerySpy: jasmine.Spy;

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

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Name'], ['B'], context);
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
        const colTimestamp = textColumn('Timestamp');
        const colAmount = numberColumn('Amount');
        const context = new ChartContext([colTimestamp, colAmount], ChartType.PIE.type, null);
        context.dataColumns = [colAmount];
        context.groupByColumns = [colTimestamp];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Timestamp'], [1735167600000], context);
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

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Name'], ['B'], context);
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
        } as any as ChartData;
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
        } as any as ChartData;
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
        } as any as ChartData;
        const colAmount = numberColumn('City');
        const colDiscount = numberColumn('Discount');
        const colName = textColumn('Name');
        const context = new ChartContext([colAmount, colDiscount, colName], ChartType.LINE.type, null);
        context.aggregations = [Aggregation.COUNT];
        context.dataColumns = [colAmount, colDiscount];
        context.groupByColumns = [colName];

        // when
        revealer.reveal(activeElements, data, context);

        // then
        expect(ofQuerySpy).toHaveBeenCalledWith(undefined, ['Name'], ['C'], context);
    });

});

function setup(): void {
    TestBed.configureTestingModule({
        imports: [MatDialogModule, BrowserAnimationsModule],
        providers: [RawDataRevealService]
    });
    const rawDataRevealService = TestBed.inject(RawDataRevealService);
    revealer = new RawDataRevealer(rawDataRevealService);
    ofIDSpy = spyOn(rawDataRevealService, 'ofID');
    ofQuerySpy = spyOn(rawDataRevealService, 'ofQuery');
}


function textColumn(name: string): Column {
    return column(name, DataType.TEXT);
}

function numberColumn(name: string): Column {
    return column(name, DataType.NUMBER);
}

function timeColumn(name: string): Column {
    return {
        ...column(name, DataType.NUMBER),
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