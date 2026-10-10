import { SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { provideRouter, Router } from '@angular/router';
import { ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';
import { Column, DataType, Route, Scene } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService, defaultMargin } from 'app/shared/services/chart';
import { SceneFactory } from 'app/shared/test';
import { ChartComponent } from './chart.component';
import type { Mock } from 'vitest';

describe('ChartComponent', () => {

  let scene: Scene;
  let context: ChartContext;
  let entries: object[];
  const dbService = new DBService(null);
  let component: ChartComponent;
  let fixture: ComponentFixture<ChartComponent>;
  let getActiveSceneSpy: Mock;

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
      imports: [MatProgressBarModule, MatDialogModule, ResizableDirective, ResizeHandleDirective],
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
    getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnInit should navigate to scenes view when no scene is active', fakeAsync(() => {

    // given
    getActiveSceneSpy.mockReturnValue(null);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockReturnValue(undefined);

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
    vi.spyOn(TestBed.inject(ChartDataService), 'createData').mockReturnValue({ error: 'server not available' });
    vi.spyOn(component.onWarning, 'emit').mockReturnValue(undefined);
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

  it('#ngOnDestroy should destroy chart', fakeAsync(() => {

    // given
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    context.groupByColumns = [createColumn('t1', DataType.TEXT)];
    fixture.detectChanges();
    flush();
    const chart = context.chart;
    vi.spyOn(chart, 'destroy');

    // when
    fixture.destroy();

    // then
    expect(chart.destroy).toHaveBeenCalled();
  }));

  it('#ngOnDestroy should not fail when no chart exists', () => {

    // given
    context.chart = undefined;

    // when
    const destroy = () => fixture.destroy();

    // then
    expect(destroy).not.toThrow();
  });

  it('should not create chart when destroyed before pending context change is processed', fakeAsync(() => {

    // given
    context.chart = undefined;
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];

    // when
    fixture.destroy();
    flush();

    // then
    expect(context.chart).toBeUndefined();
    expect(component.loading).toBe(false);
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
    expect(validation).toBe(true);
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
    expect(validation).toBe(false);
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

  it('should show dashed border of ghost element when resizing margin', () => {

    // given
    showResizableMargin();
    const handle = fixture.nativeElement.querySelector('.resize-handle-top');

    // when
    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }));

    // then
    const ghost = fixture.nativeElement.querySelector('.resize-ghost-element');
    expect(getComputedStyle(ghost).borderTopStyle).toBe('dashed');
  });

  it('should not propagate mousedown from margin resize handle to host', () => {

    // given
    showResizableMargin();
    const hostListener = vi.fn();
    fixture.nativeElement.addEventListener('mousedown', hostListener);
    const handle = fixture.nativeElement.querySelector('.resize-handle-top');

    // when
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));

    // then
    expect(hostListener).not.toHaveBeenCalled();
  });

  it('should not propagate touchstart from resizable margin to host', () => {

    // given
    showResizableMargin();
    const hostListener = vi.fn();
    fixture.nativeElement.addEventListener('touchstart', hostListener);
    const marginDiv = fixture.nativeElement.querySelector('.div_margins');

    // when
    marginDiv.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));

    // then
    expect(hostListener).not.toHaveBeenCalled();
  });

  it('should position resize ghost of margin relative to its container', () => {

    // when
    showResizableMargin();

    // then
    const resizable = fixture.debugElement.query(By.directive(ResizableDirective)).injector.get(ResizableDirective);
    expect(resizable.ghostElementPositioning).toBe('absolute');
  });

  it('#createExportData should throw error', () => {
    expect(() => component.createExportData()).toThrow(expect.objectContaining({ message: 'Method not implemented.' }));
  });

  function showResizableMargin(): void {
    component.marginDivStyle = {};
    context.toggleShowResizableMargin();
    fixture.detectChanges();
  }

  function createColumn(name: string, dataType: DataType): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10
    };
  }
});
