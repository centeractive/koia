import { SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { provideRouter, Router } from '@angular/router';
import { Column, DataType, Route, Scene } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService, defaultMargin } from 'app/shared/services/chart';
import { SceneFactory } from 'app/shared/test';
import { ChartComponent } from './chart.component';

describe('ChartComponent', () => {

  let scene: Scene;
  let context: ChartContext;
  let entries: object[];
  const dbService = new DBService(null);
  let component: ChartComponent;
  let fixture: ComponentFixture<ChartComponent>;
  let getActiveSceneSpy: jasmine.Spy;

  beforeAll(() => {
    scene = SceneFactory.createScene('1', []);
    entries = [
      { t1: 'a', n1: 1, t2: null },
      { t1: 'b', n1: 2, t2: 'x' },
      { t1: 'b', n1: 3, t2: 'y' },
      { t1: 'b', n1: 2, t2: 'x' }
    ];
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [ChartComponent],
      imports: [MatProgressBarModule, MatDialogModule],
      providers: [
        provideRouter([]),
        { provide: DBService, useValue: dbService },
        { provide: ChartDataService, useClass: ChartDataService },
        { provide: ChartMarginService, useClass: ChartMarginService },
        { provide: RawDataRevealService, useClass: RawDataRevealService }
      ]
    })
    fixture = TestBed.createComponent(ChartComponent);
    component = fixture.componentInstance;
    context = new ChartContext([], ChartType.PIE.type, defaultMargin());
    context.entries = entries;
    component.context = context;
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnInit should navigate to scenes view when no scene is active', fakeAsync(() => {

    // given
    getActiveSceneSpy.and.returnValue(null);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('should compute chart data when context changes', fakeAsync(() => {

    // given
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    fixture.detectChanges();
    component.ngOnChanges({ 'entries': new SimpleChange(null, null, true) });
    flush();

    // when
    context.groupByColumns = [createColumn('t1', DataType.TEXT)];
    fixture.detectChanges();
    flush();

    // then
    expect(context.data.labels).toEqual(['1', '2', '3']);
    expect(context.data.datasets.length).toBe(1);
    expect(context.data.datasets[0].data).toEqual([1, 2, 1]);
    expect(context.chart).toBeTruthy();
  }));

  it('should emit warning when context changes but new chart data cannot be obtained', fakeAsync(() => {

    // given
    spyOn(TestBed.inject(ChartDataService), 'createData').and.returnValue({ error: 'server not available' });
    spyOn(component.onWarning, 'emit');
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    fixture.detectChanges();
    component.ngOnChanges({ 'entries': new SimpleChange(null, null, true) });
    flush();

    // when
    context.groupByColumns = [createColumn('t1', DataType.TEXT)];
    fixture.detectChanges();
    flush();

    // then
    expect(component.onWarning.emit).toHaveBeenCalledWith('server not available');
  }));

  it('#validateElementResize should return true when margin is valid', () => {

    // given
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 100, width: 100 },
      edges: { top: 1 }
    }
    component.ngOnChanges({ 'context': new SimpleChange(null, null, true) });

    // when
    const validation = component.validateMarginResize(resizeEvent);

    // then
    expect(validation).toBeTrue();
  });

  it('#validateElementResize should return false when margin is invalid', () => {

    // given
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 100, width: 100 },
      edges: { top: -1 }
    }
    component.ngOnChanges({ 'context': new SimpleChange(null, null, true) });

    // when
    const validation = component.validateMarginResize(resizeEvent);

    // then
    expect(validation).toBeFalse();
  });

  it('#onResizeEnd should define margin when resized at top left corner', fakeAsync(() => {

    // given
    context.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    flush();
    const resizeEvent = {
      rectangle: { top: 0, right: 0, bottom: 0, left: 0 },
      edges: { top: 1, left: 2 }
    }

    // when
    component.onMarginResizeEnd(resizeEvent);

    // then
    flush();
    expect(context.margin).toEqual({ top: 1, bottom: 0, left: 2, right: 0 });
    const cmpElement = component.cmpElementRef.nativeElement;
    const top = 1 + cmpElement.getBoundingClientRect().top - cmpElement.parentElement.parentElement.getBoundingClientRect().top;
    expect(component.marginDivStyle).toEqual({ top: top + 'px', right: '0px', bottom: '0px', left: '2px' });
  }));

  it('#onResizeEnd should define margin when resized at bottom right corner', fakeAsync(() => {

    // given
    context.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    flush();
    const resizeEvent = {
      rectangle: { top: 0, right: 0, bottom: 0, left: 0 },
      edges: { right: -1, bottom: -2 }
    };

    // when
    component.onMarginResizeEnd(resizeEvent);

    // then
    flush();
    expect(context.margin).toEqual({ top: 0, right: 1, bottom: 2, left: 0 });
    const cmpElement = component.cmpElementRef.nativeElement;
    const top = cmpElement.getBoundingClientRect().top - cmpElement.parentElement.parentElement.getBoundingClientRect().top;
    expect(component.marginDivStyle).toEqual({ top: top + 'px', right: '1px', bottom: '2px', left: '0px' });
  }));

  it('#createExportData should throw error', () => {
    expect(() => component.createExportData()).toThrowError('Method not implemented.');
  });

  function createColumn(name: string, dataType: DataType): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10
    };
  }
});
