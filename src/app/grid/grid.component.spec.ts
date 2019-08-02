import { async, ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';

import { GridComponent } from './grid.component';
import { Component, NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import {
  MatBottomSheet, MatSidenavModule, MatIconModule, MatButtonModule, MatGridListModule, MatMenuModule,
  MatBottomSheetModule
} from '@angular/material';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationService, ChartMarginService, ConfigService } from 'app/shared/services';
import {
  Column, ChartContext, GraphContext, StatusType, Query, Route, SummaryContext, DataType, Scene } from 'app/shared/model';
import { StatusComponent } from 'app/status/status.component';
import { ModelToConfigConverter } from 'app/shared/config';
import { ViewController } from 'app/shared/controller';
import { DBService } from 'app/shared/services/backend';
import { RouterTestingModule } from '@angular/router/testing';
import { MatIconModuleMock } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';

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
  const configService = new ConfigService(dbService);
  const notificationService = new NotificationServiceMock();

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
    scene = createScene('1', columns);
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

  beforeEach(async(() => {
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
        { provide: MatBottomSheet, useClass: MatBottomSheet },
        { provide: ConfigService, useValue: configService },
        { provide: DBService, useValue: dbService },
        { provide: ConfigService, useValue: configService },
        { provide: ChartMarginService, useClass: ChartMarginService },
        { provide: NotificationService, useValue: notificationService }
      ]
    })
      .overrideModule(MatIconModule, MatIconModuleMock.override())
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(GridComponent);
    component = fixture.componentInstance;
    spyOn(notificationService, 'showStatus').and.stub();
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    spyOn(dbService, 'findEntries').and.returnValue(of(entries.slice(0)));
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

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
    expect(component.isSummaryContext(context)).toBeTruthy();
    expect(context instanceof SummaryContext).toBeTruthy();
  });

  it('#addChart should add chart context', () => {

    // when
    component.addChart();

    // then
    expect(component.elementContexts.length).toBe(1);
    const context = component.elementContexts[0];
    expect(component.isChartContext(context)).toBeTruthy();
    expect(context instanceof ChartContext).toBeTruthy();
  });

  it('#addGraph should add graph context', () => {

    // when
    component.addGraph();

    // then
    expect(component.elementContexts.length).toBe(1);
    const context = component.elementContexts[0];
    expect(component.isGraphContext(context)).toBeTruthy();
    expect(context instanceof GraphContext).toBeTruthy();
  });

  it('#onFilterChanged should assign new query to each element context', () => {

    // given
    const graphContext = component.addGraph();
    graphContext.groupByColumns = [findColumn('Level')];
    const chartContext = component.addChart();
    chartContext.dataColumns = [findColumn('Level')];
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
    chartContext.dataColumns = [findColumn('Level')];
    const graphContext = component.addGraph();
    graphContext.groupByColumns = [findColumn('Level')];
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

  it('#loadView should notify user when no stored view exists', fakeAsync(() => {

    // given
    spyOn(configService, 'getView').and.returnValue(null);

    // when
    component.loadView();
    tick();

    // then
    expect(notificationService.showStatus).toHaveBeenCalled();
  }));

  it('#loadView should load view', () => {

    // given
    const chartContext = component.addChart();
    chartContext.title = 'Test Chart';
    chartContext.dataColumns = [findColumn('Level')];
    const graphContext = component.addGraph();
    graphContext.title = 'Test Graph';
    graphContext.groupByColumns = [findColumn('Level')];
    const view = new ModelToConfigConverter().convert(Route.GRID, component.elementContexts);
    view.gridColumns = 4;
    view.gridCellRatio = '4:3';
    const elementContexts = component.elementContexts;
    component.gridColumns = 5;
    component.elementContexts = [];
    spyOn(configService, 'getView').and.returnValue(view);

    // when
    component.loadView();

    // then
    expect(component.gridColumns).toBe(4);
    expect(component.gridCellRatio).toBe('4:3');
    expect(component.elementContexts).toEqual(elementContexts);
  });

  it('#saveView should warn user when view contains no elements', () => {

    // given
    component.elementContexts = [];

    // when
    component.saveView();

    // then
    const bootomSheet = TestBed.get(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet,
      { type: StatusType.WARNING, msg: 'View contains no elements' });
  });

  it('#saveView should notify user about success', fakeAsync(() => {

    // given
    component.addGraph();
    const status = { type: StatusType.SUCCESS, msg: 'View has been saved' };
    const status$ = of(status).toPromise();
    spyOn(configService, 'saveView').and.returnValue(status$);

    // when
    component.saveView();
    tick();

    // then
    const bootomSheet = TestBed.get(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet, status);
  }));

  it('#adjustLayout should adjust content margin top', () => {

    // given
    const divHeader = { offsetHeight: 55 };
    component.divHeaderRef = new ElementRef(<HTMLDivElement>divHeader);
    const divContent = { style: { marginTop: '' } };
    component.divContentRef = new ElementRef(<HTMLDivElement>divContent);

    // when
    component.adjustLayout();

    // then
    expect(divContent.style.marginTop).toEqual((55 + ViewController.MARGIN_TOP) + 'px');
  });

  function findColumn(name: string): Column {
    return JSON.parse(JSON.stringify(scene.columns.find(c => c.name === name)));
  }

  function createScene(id: string, columns: Column[]): Scene {
    return {
      _id: id,
      creationTime: now,
      name: 'Scene ' + id,
      shortDescription: 'Scene ' + id + ' Short Description',
      columns: columns,
      database: 'test_data_' + id,
      config: {
        records: [],
        views: []
      }
    };
  }
});
