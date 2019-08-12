import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatProgressBarModule, MatDialogModule } from '@angular/material';
import { of, Observable } from 'rxjs';
import { ChartComponent } from './chart.component';
import { ChartContext, ChartType, DataType, Column, Scene } from 'app/shared/model';
import { NvD3Module, NvD3Component } from 'ng2-nvd3';
import { SimpleChange } from '@angular/core';
import { ChartDataService, ChartMarginService, RawDataRevealService } from 'app/shared/services';
import { ResizableDirective } from 'angular-resizable-element';
import { Margin } from 'nvd3';
import { RouterTestingModule } from '@angular/router/testing';
import 'nvd3';
import { DBService } from 'app/shared/services/backend';
import { SceneFactory } from 'app/shared/test';

describe('ChartComponent', () => {

  let scene: Scene;
  let context: ChartContext;
  let entries$: Observable<Object[]>;
  const dbService = new DBService(null);
  let component: ChartComponent;
  let fixture: ComponentFixture<ChartComponent>;

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
      imports: [MatProgressBarModule, NvD3Module, RouterTestingModule, MatDialogModule],
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
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

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
    const expected = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 1 }
    ];
    expect(component.chartData).toEqual(expected);
    expect(context.chart).toBeTruthy();
    expect(context.getContainer()).toBeTruthy();
  }));

  it('should clear NVD3 element when scatter chart context changes', fakeAsync(() => {

    // given
    context.chartType = ChartType.SCATTER.type;
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    context.groupByColumns = [createColumn('t1', DataType.TEXT)];
    fixture.detectChanges();
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
    flush();
    component.nvD3Component = <NvD3Component>{ clearElement: () => null };
    spyOn(component.nvD3Component, 'clearElement');

    // when
    context.dataColumns = [createColumn('t2', DataType.TEXT)];
    flush();

    // then
    expect(component.nvD3Component.clearElement).toHaveBeenCalled();
  }));

  it('should update chart options when chart size changes', fakeAsync(() => {

    // given
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    fixture.detectChanges();
    component.parentConstraintSize = false;
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
    flush();

    // when
    context.setSize(200, 300);
    fixture.detectChanges();
    flush();

    // then
    expect(component.chartOptions['chart'].width).toBe(200);
    expect(component.chartOptions['chart'].height).toBe(300);
    expect(context.chart).toBeTruthy();
    expect(context.getContainer()).toBeTruthy();
  }));

  it('should update chart when parent constraint chart size changes', fakeAsync(() => {

    // given
    context.chart = { update: () => null };
    spyOn(context.chart, 'update');
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    fixture.detectChanges();
    component.parentConstraintSize = true;
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
    flush();

    // when
    context.setSize(200, 300);
    flush();

    // then
    expect(context.chart.update).toHaveBeenCalled();
    expect(component.chartOptions['chart'].width).toBeNull();
    expect(component.chartOptions['chart'].height).toBeNull();
  }));

  it('#validateElementResize should return true when margin is valid', () => {

    // given
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 100, width: 100 },
      edges: { top: 1 }
    }
    component.ngOnChanges({'context': new SimpleChange(null, null, true) });

    // when
    const validation = component.validateMarginResize(resizeEvent);

    // then
    expect(validation).toBeTruthy();
  });

  it('#validateElementResize should return false when margin is invalid', () => {

    // given
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 100, width: 100 },
      edges: { top: -1 }
    }
    component.ngOnChanges({'context': new SimpleChange(null, null, true) });

    // when
    const validation = component.validateMarginResize(resizeEvent);

    // then
    expect(validation).toBeFalsy();
  });

  it('#onResizeEnd should define margin when resized at top left corner', () => {

    // given
    context.margin = <Margin>{ top: 0, right: 0, bottom: 0, left: 0 };
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
    context.margin = <Margin>{ top: 0, right: 0, bottom: 0, left: 0 };
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

  function createColumn(name: string, dataType: DataType): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10
    };
  }
});
