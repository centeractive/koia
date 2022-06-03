import { ComponentFixture, TestBed, fakeAsync, flush, tick, waitForAsync } from '@angular/core/testing';

import { GridComponent } from './grid.component';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Observable, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationService, ViewPersistenceService, DialogService, ExportService } from 'app/shared/services';
import { Column, StatusType, Query, Route, SummaryContext, DataType, Scene, ExportFormat, TimeUnit, ElementContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { StatusComponent } from 'app/shared/component/status/status.component';
import { ModelToConfigConverter } from 'app/shared/services/view-persistence';
import { DBService } from 'app/shared/services/backend';
import { RouterTestingModule } from '@angular/router/testing';
import { MatIconModuleMock, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { Router } from '@angular/router';
import { InputDialogComponent, InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { ChartMarginService } from 'app/shared/services/chart';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatMenuModule } from '@angular/material/menu';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import * as _ from 'lodash';

@Component({ selector: 'koia-main-toolbar', template: '' })
class MainToolbarComponent { }

@Component({ selector: 'koia-chart-side-bar', template: '' })
class ChartSideBarComponent { }

@Component({ selector: 'koia-graph-side-bar', template: '' })
class GraphSideBarComponent { }

@Component({ selector: 'koia-chart', template: '' })
class ChartComponent { }

@Component({ selector: 'koia-graph', template: '' })
class GraphComponent { }

describe('GridComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: Object[];
  let fixture: ComponentFixture<GridComponent>;
  let component: GridComponent;
  const dbService = new DBService(null);
  const dialogService = new DialogService(null);
  const viewPersistenceService = new ViewPersistenceService(dbService);
  const notificationService = new NotificationServiceMock();
  const exportService = new ExportService();
  let getActiveSceneSpy: jasmine.Spy;
  let findEntriesSpy: jasmine.Spy;

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
        GridComponent, MainToolbarComponent, ChartSideBarComponent, GraphSideBarComponent, ChartComponent, GraphComponent, StatusComponent
      ],
      imports: [
        MatSidenavModule, MatMenuModule, MatGridListModule, MatButtonModule, MatIconModule, BrowserAnimationsModule, MatBottomSheetModule,
        RouterTestingModule
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
    fixture = TestBed.createComponent(GridComponent);
    component = fixture.componentInstance;
    spyOn(dialogService, 'showViewLauncherDialog').and.stub();
    spyOn(notificationService, 'showStatus').and.stub();
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    findEntriesSpy = spyOn(dbService, 'findEntries').and.returnValue(of(entries.slice(0)));
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
    component.entries$.subscribe(e => {
      expect(e).toEqual(entries);
    })
  });

  it('#ngAfterViewChecked should fire size changed on each chart when window was resized while component was hidden', () => {

    // given
    const pieChartContext = component.addChart();
    spyOn(pieChartContext, 'fireSizeChanged');
    const barChartContext = component.addChart();
    spyOn(barChartContext, 'fireSizeChanged');
    component.cmpElementRef.nativeElement.remove();
    window.dispatchEvent(new Event('resize'));

    // when
    component.ngAfterViewChecked();

    // then
    expect(pieChartContext.fireSizeChanged).toHaveBeenCalled();
    expect(barChartContext.fireSizeChanged).toHaveBeenCalled();
  });

  it('#ngAfterViewChecked should not fire size changed when window was resized while visible', () => {

    // given
    const pieChartContext = component.addChart();
    spyOn(pieChartContext, 'fireSizeChanged');
    const barChartContext = component.addChart();
    spyOn(barChartContext, 'fireSizeChanged');
    window.dispatchEvent(new Event('resize'));

    // when
    component.ngAfterViewChecked();

    // then
    expect(pieChartContext.fireSizeChanged).not.toHaveBeenCalled();
    expect(barChartContext.fireSizeChanged).not.toHaveBeenCalled();
  });

  it('#addSummaryTable should add summary context', () => {

    // when
    component.addSummaryTable();

    // then
    expect(component.elementContexts.length).toBe(1);
    const context = component.elementContexts[0];
    expect(component.isSummaryContext(context)).toBeTrue();
    expect(context instanceof SummaryContext).toBeTrue();
  });

  it('#addChart should add chart context', () => {

    // when
    component.addChart();

    // then
    expect(component.elementContexts.length).toBe(1);
    const context = component.elementContexts[0];
    expect(component.isChartContext(context)).toBeTrue();
    expect(context instanceof ChartContext).toBeTrue();
  });

  it('#addGraph should add graph context', () => {

    // when
    component.addGraph();

    // then
    expect(component.elementContexts.length).toBe(1);
    const context = component.elementContexts[0];
    expect(component.isGraphContext(context)).toBeTrue();
    expect(context instanceof GraphContext).toBeTrue();
  });

  it('#onFilterChanged should assign new query to each element context', () => {

    // given
    const graphContext = component.addGraph();
    graphContext.groupByColumns = [findColumn('Level', graphContext)];
    const chartContext = component.addChart();
    chartContext.dataColumns = [findColumn('Level', chartContext)];
    const query = new Query();
    query.setFullTextFilter('abc');

    // when
    component.onFilterChanged(query);

    // then
    component.elementContexts.forEach(c => expect(c.query).toBe(query));
  });

  it('#onFilterChanged should re-fetch entries with new query', () => {

    // given
    const query = new Query();
    query.setFullTextFilter('123');

    // when
    component.onFilterChanged(query);

    // then
    expect(dbService.findEntries).toHaveBeenCalledWith(query, true);
  });

  it('#onFilterChanged should notify error when error occurs', fakeAsync(() => {

    // given
    findEntriesSpy.and.returnValue(throwError('server error'));
    spyOn(component, 'notifyError');

    // when
    component.onFilterChanged(new Query());
    flush();

    // then
    expect(component.notifyError).toHaveBeenCalled();
  }));

  it('config button click should open side bar', () => {

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
    component.addSummaryTable();
    component.addGraph();

    // when
    component.removeElement(component.elementContexts[0]);

    // then
    expect(component.elementContexts.length).toBe(1);
  });

  it('#setGridColumns should fire resize event for each element', () => {

    // given
    const chartContext = component.addChart();
    chartContext.dataColumns = [findColumn('Level', chartContext)];
    const graphContext = component.addGraph();
    graphContext.groupByColumns = [findColumn('Level', graphContext)];
    component.addSummaryTable();
    component.elementContexts.forEach(c => spyOn(c, 'fireSizeChanged'));

    // when
    component.setGridColumns(2);

    // then
    component.elementContexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalledTimes(1));
  });

  it('#setGridColumns should reduce column span of larger elements when user confirms', () => {

    // given
    component.gridColumns = 3;
    const graphContext = component.addGraph();
    graphContext.gridColumnSpan = 3;
    component.elementContexts.forEach(c => spyOn(c, 'fireSizeChanged'));
    spyOn(window, 'confirm').and.returnValue(true);

    // when
    component.setGridColumns(2);

    // then
    expect(component.gridColumns).toBe(2);
    expect(graphContext.gridColumnSpan).toBe(2);
    component.elementContexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalledTimes(1));
  });

  it('#setGridColumns should be ignored when user declines resizing larger elements', () => {

    // given
    component.gridColumns = 3;
    const graphContext = component.addGraph();
    graphContext.gridColumnSpan = 3;
    component.elementContexts.forEach(c => spyOn(c, 'fireSizeChanged'));
    spyOn(window, 'confirm').and.returnValue(false);

    // when
    component.setGridColumns(2);

    // then
    expect(component.gridColumns).toBe(3);
    component.elementContexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalledTimes(0));
  });

  it('#setGridCellRatio should resize all elements', () => {

    // given
    component.addGraph();
    component.elementContexts.forEach(c => spyOn(c, 'fireSizeChanged'));

    // when
    component.setGridCellRatio('4:5');

    // then
    expect(component.gridCellRatio).toBe('4:5');
    component.elementContexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalled());
  });

  it('#loadView should load view', () => {

    // given
    const chartContext = component.addChart();
    chartContext.title = 'Test Chart';
    chartContext.dataColumns = [findColumn('Amount', chartContext)];
    chartContext.splitColumns = [findColumn('Path', chartContext)];
    const graphContext = component.addGraph();
    graphContext.title = 'Test Graph';
    const timeColumne = findColumn('Time', graphContext);
    timeColumne.groupingTimeUnit = TimeUnit.HOUR;
    graphContext.groupByColumns = [timeColumne, findColumn('Level', graphContext)];
    const view = new ModelToConfigConverter().convert(Route.GRID, 'test', component.elementContexts);
    view.gridColumns = 4;
    view.gridCellRatio = '4:3';
    const elementContexts = component.elementContexts;
    component.gridColumns = 5;
    component.elementContexts = [];

    // when
    component.loadView(view);

    // then
    expect(component.gridColumns).toBe(4);
    expect(component.gridCellRatio).toBe('4:3');
    expect(_.isEqualWith(component.elementContexts, elementContexts, ignoreFunctions)).toBeTrue();
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
    const status = { type: StatusType.SUCCESS, msg: 'View has been saved' };
    const status$ = of(status).toPromise();
    spyOn(viewPersistenceService, 'saveView').and.returnValue(status$);

    // when
    component.saveView();
    tick();

    // then
    const bootomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet, status);
  }));

  it('#saveAs should export image', () => {

    // given
    const chartContext = component.addChart();
    chartContext.title = 'Test';
    chartContext.chart = <any>{ toBase64Image: () => 'base64Image...' };
    spyOn(exportService, 'exportImage');

    // when
    component.saveAs(chartContext, ExportFormat.PNG);
    fixture.detectChanges();

    // then
    expect(exportService.exportImage).toHaveBeenCalledWith('base64Image...', ExportFormat.PNG, 'Test');
  });

  /**
   * TODO: fix me
   *
  it('#saveAs should export data when graph context is provided', fakeAsync(() => {
  
    // given
    spyOn(component.sidenav, 'open').and.returnValue(Promise.resolve());
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

  function ignoreFunctions(objValue: any, otherValue: any): boolean {
    if (_.isFunction(objValue) && _.isFunction(otherValue)) {
      return true;
    }
  }

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
