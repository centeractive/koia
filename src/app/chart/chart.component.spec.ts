import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { of, Observable } from 'rxjs';
import { ChartComponent } from './chart.component';
import { DataType, Column, Scene, Route } from 'app/shared/model';
import { ChartContext, ChartType, Margin } from 'app/shared/model/chart';
import { SimpleChange } from '@angular/core';
import { RawDataRevealService } from 'app/shared/services';
import { ResizableDirective } from 'angular-resizable-element';
import { RouterTestingModule } from '@angular/router/testing';
import { DBService } from 'app/shared/services/backend';
import { SceneFactory } from 'app/shared/test';
import { Router } from '@angular/router';
import { ChartDataService, ChartMarginService } from 'app/shared/services/chart';
import { MatProgressBarModule } from '@angular/material/progress-bar';

describe('ChartComponent', () => {

  let scene: Scene;
  let context: ChartContext;
  let entries$: Observable<object[]>;
  const dbService = new DBService(null);
  let component: ChartComponent;
  let fixture: ComponentFixture<ChartComponent>;
  let getActiveSceneSpy: jasmine.Spy;

  beforeAll(() => {
    scene = SceneFactory.createScene('1', []);
    entries$ = of([
      { t1: 'a', n1: 1, t2: null },
      { t1: 'b', n1: 2, t2: 'x' },
      { t1: 'b', n1: 3, t2: 'y' },
      { t1: 'b', n1: 2, t2: 'x' }
    ]);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChartComponent, ResizableDirective],
      imports: [MatProgressBarModule, RouterTestingModule, MatDialogModule],
      providers: [
        { provide: DBService, useValue: dbService },
        { provide: ChartDataService, useClass: ChartDataService },
        { provide: ChartMarginService, useClass: ChartMarginService },
        { provide: RawDataRevealService, useClass: RawDataRevealService }
      ]
    })
    fixture = TestBed.createComponent(ChartComponent);
    component = fixture.componentInstance;
    context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    component.context = context;
    component.entries$ = entries$;
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scene);
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
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
    flush();

    // when
    context.groupByColumns = [createColumn('t1', DataType.TEXT)];
    fixture.detectChanges();
    flush();

    // then
    expect(context.data.labels).toEqual([1, 2, 3]);
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
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
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

  it('#onResizeEnd should define margin when resized at top left corner', () => {

    // given
    context.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const resizeEvent = {
      rectangle: { top: 0, right: 0, bottom: 0, left: 0 },
      edges: { top: 1, left: 2 }
    }

    // when
    component.onMarginResizeEnd(resizeEvent);

    // then
    expect(context.margin).toEqual({ top: 1, bottom: 0, left: 2, right: 0 });
    const cmpElement = component.cmpElementRef.nativeElement;
    const top = 1 + cmpElement.getBoundingClientRect().top - cmpElement.parentElement.parentElement.getBoundingClientRect().top;
    expect(component.marginDivStyle).toEqual({ top: top + 'px', right: '0px', bottom: '0px', left: '2px' });
  });

  it('#onResizeEnd should define margin when resized at bottom right corner', () => {

    // given
    context.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const resizeEvent = {
      rectangle: { top: 0, right: 0, bottom: 0, left: 0 },
      edges: { right: -1, bottom: -2 }
    }

    // when
    component.onMarginResizeEnd(resizeEvent);

    // then
    expect(context.margin).toEqual({ top: 0, right: 1, bottom: 2, left: 0 });
    const cmpElement = component.cmpElementRef.nativeElement;
    const top = cmpElement.getBoundingClientRect().top - cmpElement.parentElement.parentElement.getBoundingClientRect().top;
    expect(component.marginDivStyle).toEqual({ top: top + 'px', right: '1px', bottom: '2px', left: '0px' });
  });

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
