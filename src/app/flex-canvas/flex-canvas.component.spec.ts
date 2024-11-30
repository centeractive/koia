import { Component, ElementRef, NO_ERRORS_SCHEMA, QueryList } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ResizableDirective, ResizeEvent, ResizeHandleDirective } from 'angular-resizable-element';
import { InputDialogComponent, InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { Column, DataType, ElementContext, ExportFormat, Query, Route, Scene, Status, StatusType, SummaryContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartMarginService } from 'app/shared/services/chart';
import { ModelToViewConverter } from 'app/shared/services/view-persistence';
import { MatIconModuleMock, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { Chart } from 'chart.js';
import { Observable, of } from 'rxjs';
import { FlexCanvasComponent } from './flex-canvas.component';

@Component({
    selector: 'koia-main-toolbar', template: '',
    standalone: false
})
class MainToolbarComponent { }

@Component({
    selector: 'koia-chart-side-bar', template: '',
    standalone: false
})
class ChartSideBarComponent { }

@Component({
    selector: 'koia-graph-side-bar', template: '',
    standalone: false
})
class GraphSideBarComponent { }

@Component({
    selector: 'koia-summary-table-side-bar', template: '',
    standalone: false
})
class SummaryTableSideBarComponent { }

@Component({
    selector: 'koia-summary-table', template: '',
    standalone: false
})
class SummaryTableComponent { }

@Component({
    selector: 'koia-chart', template: '',
    standalone: false
})
class ChartComponent { }

@Component({
    selector: 'koia-graph', template: '',
    standalone: false
})

class GraphComponent { }

describe('FlexCanvasComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: object[];
  let fixture: ComponentFixture<FlexCanvasComponent>;
  let component: FlexCanvasComponent;
  const dbService = new DBService(null);
  const dialogService = new DialogService(null);
  const viewPersistenceService = new ViewPersistenceService(dbService);
  const notificationService = new NotificationServiceMock();
  const exportService = new ExportService();
  let getActiveSceneSpy: jasmine.Spy;

  beforeAll(() => {
    now = new Date().getTime();
    const columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, format: 'yyyy-MM-dd HH:mm:ss SSS', indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Data', dataType: DataType.TEXT, width: 500, indexed: false },
      { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
      { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
    ];
    scene = SceneFactory.createScene('1', columns);
    entries = [
      { ID: 1, Time: now - 1000, Level: 'INFO', Data: 'INFO line one', Host: 'server1', Path: '/opt/log/info.log', Amount: 10 },
      { ID: 2, Time: now - 2000, Level: 'INFO', Data: 'INFO line two', Host: 'server1', Path: '/opt/log/info.log', Amount: 20 },
      { ID: 3, Time: now - 3000, Level: 'INFO', Data: 'INFO line three', Host: 'server1', Path: '/opt/log/info.log', Amount: 30 },
      { ID: 4, Time: now - 4000, Level: 'WARN', Data: 'WARN line one', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 40 },
      { ID: 5, Time: now - 5000, Level: 'WARN', Data: 'WARN line two', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 50 },
      { ID: 6, Time: now - 6000, Level: 'WARN', Data: 'WARN line three', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 60 },
      { ID: 7, Time: now - 7000, Level: 'ERROR', Data: 'ERROR line one', Host: 'server2', Path: '/var/log/error.log', Amount: 70 },
      { ID: 8, Time: now - 8000, Level: 'ERROR', Data: 'ERROR line two', Host: 'server2', Path: '/var/log/error.log', Amount: 80 },
      { ID: 9, Time: now - 9000, Level: 'ERROR', Data: 'ERROR line three', Host: 'server2', Path: '/var/log/error.log', Amount: 90 },
    ];
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [
        FlexCanvasComponent, MainToolbarComponent, ChartSideBarComponent, GraphSideBarComponent, SummaryTableSideBarComponent,
        SummaryTableComponent, ChartComponent, GraphComponent, ResizableDirective, ResizeHandleDirective
      ],
      imports: [
        MatSidenavModule, MatButtonModule, MatIconModule, BrowserAnimationsModule, MatBottomSheetModule, RouterTestingModule,
        MatMenuModule
      ],
      providers: [
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: ViewPersistenceService, useValue: viewPersistenceService },
        { provide: ChartMarginService, useClass: ChartMarginService },
        { provide: NotificationService, useValue: notificationService },
        { provide: ExportService, useValue: exportService }
      ]
    })
      .overrideModule(MatIconModule, MatIconModuleMock.override())
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(FlexCanvasComponent);
    component = fixture.componentInstance;
    spyOn(dialogService, 'showViewLauncherDialog').and.stub();
    spyOn(notificationService, 'showStatus').and.stub();
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    spyOn(dbService, 'findEntries').and.returnValue(of(entries.slice(0)));
    fixture.detectChanges();
    flush();
  }));

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

  it('should load initial entries', () => {
    expect(dbService.findEntries).toHaveBeenCalled();
    expect(component.entries).toEqual(entries);
  });

  it('#resizableEdgesOf should return bottom/right-resizable when summary context', () => {

    // when
    const edges = component.resizableEdgesOf(new SummaryContext(scene.columns));

    // then
    expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
  });

  it('#resizableEdgesOf should return bottom/right-resizable when graph context', () => {

    // when
    const edges = component.resizableEdgesOf(new GraphContext(scene.columns));

    // then
    expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
  });

  it('#resizableEdgesOf should return bottom/right-resizable when chart context', () => {

    // when
    const chartContext = new ChartContext(scene.columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    const edges = component.resizableEdgesOf(chartContext);

    // then
    expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
  });

  it('#resizableEdgesOf should return non-resizable when chart context and showing margins', () => {

    // given
    const chartContext = new ChartContext(scene.columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    chartContext.toggleShowResizableMargin();

    // when
    const edges = component.resizableEdgesOf(chartContext);

    // then
    expect(edges).toEqual({ bottom: false, right: false, top: false, left: false });
  });

  it('#addSummaryTable should add summary context', () => {

    // when
    component.addGraph();
    component.addSummaryTable();

    // then
    expect(component.elementContexts.length).toBe(2);
    const context = component.elementContexts[1];
    expect(component.isSummaryContext(context)).toBeTrue();
    expect(context instanceof SummaryContext).toBeTrue();
  });

  it('#addChart should add chart context', () => {

    // when
    component.addChart();
    component.addChart();

    // then
    expect(component.elementContexts.length).toBe(2);
    const context = component.elementContexts[1];
    expect(component.isChartContext(context)).toBeTrue();
    expect(context instanceof ChartContext).toBeTrue();
  });

  it('#addGraph should add graph context', () => {

    // when
    component.addSummaryTable();
    component.addGraph();

    // then
    expect(component.elementContexts.length).toBe(2);
    const context = component.elementContexts[1];
    expect(component.isGraphContext(context)).toBeTrue();
    expect(context instanceof GraphContext).toBeTrue();
  });

  it('#validateElementResize should return false when width is to small', () => {

    // when
    const event = resizeEvent({ width: FlexCanvasComponent.MIN_DIM_PX - 1, height: 1_000 });
    const validation = component.validateElementResize(event);

    // then
    expect(validation).toBeFalse();
  });

  it('#validateElementResize should return false when height is to small', () => {

    // when
    const event = resizeEvent({ width: 1_000, height: FlexCanvasComponent.MIN_DIM_PX - 1 });
    const validation = component.validateElementResize(event);

    // then
    expect(validation).toBeFalse();
  });

  it('#validateElementResize should return true when width and height are fine', () => {

    // when
    const event = resizeEvent({ width: 1_000, height: 1_000 });
    const validation = component.validateElementResize(event);

    // then
    expect(validation).toBeTrue();
  });

  it('#onResizeEnd should set graph context size', () => {

    // given
    component.addGraph();
    fixture.detectChanges();
    const headerHeight = 26;
    component.elementContainerDivsRefs = new QueryList<ElementRef<HTMLDivElement>>();
    spyOn(component.elementContainerDivsRefs, 'toArray')
      .and.returnValue([new ElementRef({ offsetHeight: headerHeight } as HTMLDivElement)]);
    const context = component.elementContexts[0];
    spyOn(context, 'setSize');
    let event = resizeEvent({ width: 300, height: 200 });
    component.onResizeStart(event);

    // when
    event = resizeEvent({ width: 333, height: 221 });
    component.onResizeEnd(context, event);

    // then
    expect(context.setSize).toHaveBeenCalledWith(333, 221);
  });

  it('#onResizeEnd should keep summary table context unlimited width when not dragged horizontally', () => {

    // given
    component.addSummaryTable();
    fixture.detectChanges();
    const headerHeight = 26;
    component.elementContainerDivsRefs = new QueryList<ElementRef<HTMLDivElement>>();
    spyOn(component.elementContainerDivsRefs, 'toArray')
      .and.returnValue([new ElementRef({ offsetHeight: headerHeight } as HTMLDivElement)]);
    const context = component.elementContexts[0] as SummaryContext;
    spyOn(context, 'setSize');
    let event = resizeEvent({ width: 300, height: 200 });
    component.onResizeStart(event);

    // when
    event = resizeEvent({ width: 300, height: 199 });
    component.onResizeEnd(context, event);

    // then
    expect(context.setSize).toHaveBeenCalledWith(SummaryContext.UNLIMITED_WITH, 199);
    expect(context.hasUnlimitedWidth()).toBeTrue();
  });

  it('#click on config button should open side bar', () => {

    // given
    component.addSummaryTable();
    spyOn(component.sidenav, 'open');
    const grid = fixture.debugElement.nativeElement;
    fixture.detectChanges();
    const configButton: HTMLButtonElement = grid.querySelector('#configButton');

    // when
    configButton.click();
    fixture.detectChanges();

    // then
    expect(component.sidenav.open).toHaveBeenCalled();
  });

  it('#changeElementPosition should move selected element to new position', () => {

    // given
    component.addChart();
    component.addGraph();
    component.configure(new MouseEvent(''), component.elementContexts[0]);

    // when
    component.changeElementPosition(2);

    // then
    expect(component.elementContexts.length).toBe(2);
    expect(component.selectedContextPosition).toBe(2);
    expect(component.elementContexts.indexOf(component.selectedContext)).toBe(1);
  });

  it('#removeElement should remove element', () => {

    // given
    component.addGraph();

    // when
    component.removeElement(component.elementContexts[0]);

    // then
    expect(component.elementContexts.length).toBe(0);
  });

  it('#loadView should load view', () => {

    // given
    const chartContext = component.addChart();
    chartContext.title = 'Test Chart';
    chartContext.dataColumns = [findColumn('Amount', chartContext)];
    chartContext.splitColumns = [findColumn('Path', chartContext)];
    const graphContext = component.addGraph();
    graphContext.title = 'Test Graph';
    graphContext.groupByColumns = [findColumn('Level', graphContext)];
    const summaryContext = component.addSummaryTable();
    summaryContext.title = 'Test Summary';
    summaryContext.dataColumns = [findColumn('Level', summaryContext)];
    const view = new ModelToViewConverter().convert(Route.FLEX, 'test', new Query(), component.elementContexts);
    const elementContexts = component.elementContexts;
    component.elementContexts = [];

    // when
    component.loadView(view);

    // then
    expect(sanitize(component.elementContexts)).toEqual(sanitize(elementContexts));
  });

  it('#loadView should restore summary context column hierarchy', () => {

    // given
    const summaryContext = component.addSummaryTable();
    summaryContext.dataColumns = [findColumn('Level', summaryContext)];
    summaryContext.groupByColumns = [
      findColumn('Path', summaryContext),
      findColumn('Time', summaryContext),
      findColumn('Amount', summaryContext)
    ];
    const view = new ModelToViewConverter().convert(Route.FLEX, 'test', new Query(), component.elementContexts);
    component.elementContexts = [];

    // when
    component.loadView(view);

    // then
    expect(component.elementContexts.length).toBe(1);
    const expHierarchyColumns = component.elementContexts[0].groupByColumns.map(c => c.name);
    expect(expHierarchyColumns).toEqual(['Path', 'Time', 'Amount']);
  });

  it('#saveView should not save view when input dialog is canceld', () => {

    // given
    component.addSummaryTable();
    const dialogRef = createInputDialogRef();
    spyOn(dialogService, 'showInputDialog').and.callFake((data: InputDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    spyOn(viewPersistenceService, 'saveView').and.returnValue(undefined);

    // when
    component.saveView();

    // then
    expect(notificationService.showStatus).not.toHaveBeenCalled();
  });

  it('#saveView should warn user when view contains no elements', () => {

    // given
    component.elementContexts = [];

    // when
    component.saveView();

    // then
    const bootomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet,
      { type: StatusType.WARNING, msg: 'View contains no elements' });
  });

  it('#saveView should notify user about success', fakeAsync(() => {

    // given
    component.addSummaryTable();
    const dialogRef = createInputDialogRef();
    spyOn(dialogService, 'showInputDialog').and.callFake((data: InputDialogData) => {
      data.input = 'test';
      data.closedWithOK = true;
      return dialogRef;
    });
    const status: Status = { type: StatusType.SUCCESS, msg: 'View has been saved' };
    const status$ = new Promise<Status>(resolve => resolve(status));
    spyOn(viewPersistenceService, 'saveView').and.returnValue(status$);

    // when
    component.saveView();
    tick();

    // then
    const bootomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet, status);
  }));

  it('#click on print button should print window', fakeAsync(() => {

    // given;
    component.addGraph();
    fixture.detectChanges();
    const okButton: HTMLSelectElement = fixture.debugElement.query(By.css('#but_print')).nativeElement;
    spyOn(window, 'print');

    // when
    okButton.click();

    // then
    expect(window.print).toHaveBeenCalled();
  }));

  it('#saveAs should export image', () => {

    // given
    const chartContext = component.addChart();
    chartContext.title = 'Test';
    chartContext.chart = { toBase64Image: () => 'base64Image...' } as Chart;
    spyOn(exportService, 'exportImage');

    // when
    component.saveAs(chartContext, ExportFormat.PNG);
    fixture.detectChanges();

    // then
    expect(exportService.exportImage).toHaveBeenCalledWith('base64Image...', ExportFormat.PNG, 'Test');
  });

  function sanitize(v: any): any {
    return JSON.parse(JSON.stringify(v));
  }

  function resizeEvent(bounds: { width: number, height: number }): ResizeEvent {
    return {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, width: bounds.width, height: bounds.height },
      edges: null
    }
  }

  /**
   * TODO: fix me
   *
  it('#saveAs should export data when summary context is provided', fakeAsync(() => {

    // given
    spyOn(component.sidenav, 'open').and.resolveTo();
    const summaryContext = component.addSummaryTable();
    spyOn(exportService, 'exportData');

    // when
    component.saveAs(summaryContext, ExportFormat.EXCEL);
    flush();
    fixture.detectChanges();

    // then
    expect(exportService.exportData).toHaveBeenCalled();
  }));
  */

  function findColumn(name: string, context: ElementContext): Column {
    return context.columns.find(c => c.name === name);
  }

  function createInputDialogRef(): MatDialogRef<InputDialogComponent> {
    return <MatDialogRef<InputDialogComponent>>{
      afterClosed(): Observable<boolean> {
        return of(true);
      }
    };
  }
});
