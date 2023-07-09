import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { ChartDataService } from 'app/shared/services/chart';
import { ChartJs } from '../chartjs';
import { columns, entries } from './test-data';

export interface TestHarness {
    context: ChartContext;
    dataService: ChartDataService;
    chart: ChartJs;
}

export function chartJs(chartType: ChartType): TestHarness {
    TestBed.configureTestingModule({
        imports: [MatDialogModule, BrowserAnimationsModule],
        providers: [ChartDataService, RawDataRevealService]
    });
    const rawDataRevealService = TestBed.inject(RawDataRevealService);
    return {
        context: context(chartType),
        dataService: TestBed.inject(ChartDataService),
        chart: new ChartJs(rawDataRevealService)
    };
}

export function context(chartType: ChartType): ChartContext {
    const context = new ChartContext(
        columns,
        chartType.type,
        { top: 0, right: 0, bottom: 0, left: 0 }
    );
    context.entries = entries;
    return context;
}

export function canvas(): HTMLCanvasElement {
    return document.createElement('CANVAS') as HTMLCanvasElement;
}

export function log(o: object): void {
    console.log(JSON.stringify(o, null, '  '));
}