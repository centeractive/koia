import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, ElementRef, Injectable } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { InputDialogComponent, InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { Column, DataType, Query, Route, Scene, StatusType, TimeUnit } from 'app/shared/model';
import { ConfigRecord, ViewType } from 'app/shared/model/view-config';
import { queryToQueryDef } from 'app/shared/services/view-persistence/filter/query-to-filter-converter';
import { DialogService, ExportService, NotificationService, RawDataRevealService, TimeGroupingService, ViewPersistenceService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { ValueGrouping } from 'app/shared/value-range/model';
import { Observable, of, Subject } from 'rxjs';
import { PivotContext } from './model';
import { PivotTableComponent } from './pivot-table.component';
import type { Mock } from 'vitest';
import { ViewToolbarComponent } from 'app/shared/ui/view-toolbar/view-toolbar.component';

@Injectable()
export class MockElementRef {
  nativeElement: {}
}
describe('PivotTableComponent', () => {

  const NOW = new Date().getTime();
  const datePipe = new DatePipe('en-US');

  let now: number;
  let columns: Column[];
  let scene: Scene;
  let entries: object[];
  let component: PivotTableComponent;
  let fixture: ComponentFixture<PivotTableComponent>;
  const dbService = new DBService(null);
  const viewPersistenceService = new ViewPersistenceService(dbService);
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
  const exportService = new ExportService();
  const rawDataRevealService = new RawDataRevealService(null, null);
  let locatePivotTable: Function;
  let getActiveSceneSpy: Mock;
  let viewTabsService: ViewTabsService;

  beforeAll(() => {
    now = Date.now();
    columns = [
      { name: 'ID', dataType: DataType.NUMBER, width: 30, indexed: true },
      { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Data', dataType: DataType.TEXT, width: 400, indexed: false },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
    ];
    scene = SceneFactory.createScene('1', columns);
    entries = [
      { ID: 1, Time: now - 1000, Level: 'INFO', Data: 'one', Amount: 10 },
      { ID: 2, Time: now - 2000, Level: 'INFO', Data: 'two', Amount: 20 },
      { ID: 3, Time: now - 3000, Level: 'INFO', Data: 'three', Amount: 30 },
      { ID: 4, Time: now - 4000, Level: 'WARN', Data: 'four', Amount: 40 },
    ];
  });

  beforeEach(waitForAsync(() => {
    viewTabsService = { requestPersist: vi.fn(), register: vi.fn(), unregister: vi.fn() } as unknown as ViewTabsService;
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [PivotTableComponent, ViewToolbarComponent],
      imports: [
        MatSidenavModule, MatProgressBarModule, MatButtonModule, MatIconModule, MatTooltipModule,
        MatMenuModule, MatBottomSheetModule
      ],
      providers: [
        provideRouter([]),
        { provide: ElementRef, useClass: MockElementRef },
        { provide: MatBottomSheet, useClass: MatBottomSheet },
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: ViewPersistenceService, useValue: viewPersistenceService },
        { provide: TimeGroupingService, useClass: TimeGroupingService },
        { provide: ValueRangeGroupingService, useClass: ValueRangeGroupingService },
        { provide: NotificationService, useValue: notificationService },
        { provide: ExportService, useValue: exportService },
        { provide: RawDataRevealService, useValue: rawDataRevealService },
        { provide: ViewTabsService, useValue: viewTabsService }
      ]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(PivotTableComponent);
    component = fixture.componentInstance;
    locatePivotTable = () => component.divPivot.nativeElement.getElementsByClassName('pvtTable')[0];
    vi.spyOn(notificationService, 'showStatus').mockReturnValue(undefined);
    getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
    vi.spyOn(dbService, 'findEntries').mockReturnValue(of(entries));
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.context).toBeTruthy();
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

  it('should render table container with thin frame and light shadow', () => {

    // when
    const container: HTMLElement = fixture.nativeElement.querySelector('.div_table');

    // then
    expect(container.classList).toContain('mat-elevation-z1');
    expect(container.classList).not.toContain('mat-elevation-z8');
    const style = getComputedStyle(container);
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopColor).toBe('rgb(224, 224, 224)');
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('should retain indexed columns from active scene', () => {
    expect(dbService.getActiveScene).toHaveBeenCalled();
    expect(component.columns.map(c => c.name)).toEqual(['ID', 'Time', 'Level', 'Amount']);
    expect(component.context.timeColumns).toEqual(
      [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MILLISECOND, indexed: true }]);
  });

  it('should fetch entries and build data frame', () => {
    const format = 'd MMM yyyy HH:mm:ss SSS';
    const expectedData = [
      { ID: 1, Level: 'INFO', Data: 'one', Amount: 10, Time: datePipe.transform(now - 1000, format) },
      { ID: 2, Level: 'INFO', Data: 'two', Amount: 20, Time: datePipe.transform(now - 2000, format) },
      { ID: 3, Level: 'INFO', Data: 'three', Amount: 30, Time: datePipe.transform(now - 3000, format) },
      { ID: 4, Level: 'WARN', Data: 'four', Amount: 40, Time: datePipe.transform(now - 4000, format) },
    ];
    expect(dbService.findEntries).toHaveBeenCalled();
    expect(component.dataFrame.toArray()).toEqual(expectedData);
  });

  it('#fetchData should not re-generate value groupings when not invoked first time', fakeAsync(() => {

    // given
    const valueGroupings: ValueGrouping[] = [
      {
        columnName: 'Amount',
        ranges: [
          { min: 30, max: 50, active: true },
          { min: 0, max: 30, active: true }
        ]
      }];
    component.context.valueGroupings = valueGroupings;

    // when
    component.fetchData(new Query());
    flush();

    // then
    expect(component.context.valueGroupings).toBe(valueGroupings);
  }));

  it('sidenav#close should leave data frame unchnged when value groupings do not changed', async () => {

    // given
    const dataFrame = component.dataFrame;
    await component.sidenav.open();
    await fixture.whenStable();
    fixture.detectChanges();

    // when
    await component.sidenav.close();

    // then
    await sleep(500);
    await fixture.whenStable();
    expect(component.dataFrame).toBe(dataFrame);
  });

  it('sidenav#close should recreate data frame when value groupings changed', async () => {

    // given
    const dataFrame = component.dataFrame;
    await component.sidenav.open();
    await fixture.whenStable();
    fixture.detectChanges();
    component.context.valueGroupings = [
      {
        columnName: 'Amount',
        ranges: [
          { min: 30, max: 50, active: true },
          { min: 0, max: 30, active: true }
        ]
      }];

    // when
    await component.sidenav.close();

    // then
    await sleep(500);
    await fixture.whenStable();
    expect(component.dataFrame).not.toBe(dataFrame);
  });

  it('#onTimeUnitChanged should change selected time unit and refresh data', fakeAsync(() => {

    // given
    const timeColumn = component.context.timeColumns[0];

    // when
    component.onTimeUnitChanged(timeColumn, TimeUnit.YEAR);
    flush();

    // then
    const year = datePipe.transform(now, 'yyyy');
    const expectedData = [
      { ID: 1, Level: 'INFO', Data: 'one', Amount: 10, 'Time (per year)': year },
      { ID: 2, Level: 'INFO', Data: 'two', Amount: 20, 'Time (per year)': year },
      { ID: 3, Level: 'INFO', Data: 'three', Amount: 30, 'Time (per year)': year },
      { ID: 4, Level: 'WARN', Data: 'four', Amount: 40, 'Time (per year)': year }
    ]
    expect(timeColumn.groupingTimeUnit).toBe(TimeUnit.YEAR);
    expect(component.dataFrame.toArray()).toEqual(expectedData);
  }));

  it('#loadConfig should restore selected values from config', () => {

    // given
    const context: PivotContext = {
      timeColumns: [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MONTH }],
      negativeColor: 'yellow',
      positiveColor: 'red',
      showRowTotals: true,
      showColumnTotals: true,
      valueGroupings: [],
      pivotOptions: { a: 1, b: 2 }
    };
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: null, data: context };

    // when
    component.loadConfig(configRecord);

    // then
    expect(component.context.negativeColor).toBe('yellow');
    expect(component.context.positiveColor).toBe('red');
    expect(component.context.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MONTH);
  });

  it('#loadConfig should spice pivot options', () => {

    // given
    const context: PivotContext = {
      timeColumns: [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.YEAR }],
      negativeColor: 'yellow',
      positiveColor: 'red',
      showRowTotals: true,
      showColumnTotals: true,
      valueGroupings: [],
      pivotOptions: { a: 1, b: 2 }
    };
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: null, data: context };

    // when
    component.loadConfig(configRecord);

    // then
    expect(component.context.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.YEAR);
    expect(component.context.pivotOptions['hiddenAttributes']).toEqual([CouchDBConstants._ID]);
    expect(component.context.pivotOptions['rendererOptions']).not.toBeUndefined();
    expect(component.context.pivotOptions['onRefresh']).not.toBeUndefined();
  });

  it('#loadConfig should not modify data of loaded record when pivot table is changed', fakeAsync(() => {

    // given
    const context = pivotContext();
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: null, data: context };
    const recordJson = JSON.stringify(configRecord);
    component.loadConfig(configRecord);
    flush();

    // when
    component.onNegativeColorChanged('green');
    component.onShowRowTotalsChanged();
    flush();

    // then
    expect(JSON.stringify(configRecord)).toBe(recordJson);
  }));

  describe('with tab', () => {

    let tabFixture: ComponentFixture<PivotTableComponent>;
    let tabComponent: PivotTableComponent;

    function createTabComponent(record?: ConfigRecord): void {
      tabFixture = TestBed.createComponent(PivotTableComponent);
      tabComponent = tabFixture.componentInstance;
      tabComponent.tab = { id: 'tab1', type: ViewType.PIVOT, title: 'Pivot Table 1', record };
    }

    afterEach(() => {
      scene.config.records = [];
    });

    it('should register as content provider of tab', fakeAsync(() => {

      // given
      createTabComponent();

      // when
      tabFixture.detectChanges();
      flush();

      // then
      expect(viewTabsService.register).toHaveBeenCalledWith('tab1', tabComponent);
      expect(tabComponent.layout()).toBe(Route.PIVOT);
    }));

    it('should restore record of tab once data was fetched with its query', fakeAsync(() => {

      // given
      const query = new Query();
      query.setFullTextFilter('INFO');
      createTabComponent({ route: Route.PIVOT, name: 'Pivot Table 1', modifiedTime: 0, query: queryToQueryDef(query), data: pivotContext() });

      // when
      tabFixture.detectChanges();
      flush();

      // then
      const fetchQuery: Query = vi.mocked(dbService.findEntries).mock.lastCall[0];
      expect(fetchQuery.getFullTextFilter()).toBe('INFO');
      expect(tabComponent.restoredQuery.getFullTextFilter()).toBe('INFO');
      expect(tabComponent.context.negativeColor).toBe('yellow');
      expect(tabComponent.context.valueGroupings).toEqual([]);
      expect(tabFixture.nativeElement.querySelector('.pvtTable')).toBeTruthy();
    }));

    it('should restore record of tab without query', fakeAsync(() => {

      // given
      createTabComponent({ route: Route.PIVOT, name: 'Pivot Table 1', modifiedTime: 0, query: null, data: pivotContext() });

      // when
      tabFixture.detectChanges();
      flush();

      // then
      expect(tabComponent.restoredQuery).toBeUndefined();
      expect(tabComponent.context.negativeColor).toBe('yellow');
    }));

    it('should neither show config launcher nor propose tab title as view name when record of tab was restored', fakeAsync(() => {

      // given
      scene.config.records = [{ route: Route.PIVOT, name: 'saved', modifiedTime: 0, query: null, data: pivotContext() }];
      vi.spyOn(dialogService, 'showConfigLauncherDialog').mockReturnValue(undefined);
      const showInputDialogSpy = vi.spyOn(dialogService, 'showInputDialog').mockReturnValue(createInputDialogRef());
      createTabComponent({ route: Route.PIVOT, name: 'Pivot Table 1', modifiedTime: 0, query: null, data: pivotContext() });
      tabFixture.detectChanges();
      flush();

      // when
      tabComponent.saveConfig();

      // then
      expect(dialogService.showConfigLauncherDialog).not.toHaveBeenCalled();
      const dialogData: InputDialogData = showInputDialogSpy.mock.lastCall[0];
      expect(dialogData.input).toBe('');
    }));

    it('should show config launcher when new tab is opened and pivot records exist', fakeAsync(() => {

      // given
      scene.config.records = [{ route: Route.PIVOT, name: 'saved', modifiedTime: 0, query: null, data: pivotContext() }];
      vi.spyOn(dialogService, 'showConfigLauncherDialog').mockReturnValue(undefined);
      createTabComponent();

      // when
      tabFixture.detectChanges();
      flush();

      // then
      expect(dialogService.showConfigLauncherDialog).toHaveBeenCalledWith(tabComponent);
    }));

    it('#tabContent should provide record of tab while restoring is pending', fakeAsync(() => {

      // given
      vi.mocked(dbService.findEntries).mockReturnValue(new Subject());
      const record: ConfigRecord = { route: Route.PIVOT, name: 'Pivot Table 1', modifiedTime: 0, query: null, data: pivotContext() };
      createTabComponent(record);
      tabFixture.detectChanges();
      flush();

      // when
      const content = tabComponent.tabContent();

      // then
      expect(content).toEqual({ record });
    }));

    it('#tabContent should provide record of tab when pivot table is not rendered', fakeAsync(() => {

      // given
      createTabComponent();
      tabFixture.detectChanges();
      flush();
      vi.spyOn(tabComponent, 'getPivotOptions').mockReturnValue(undefined);

      // when
      const content = tabComponent.tabContent();

      // then
      expect(content).toEqual({ record: undefined });
    }));

    it('#tabContent should provide current pivot table configuration', fakeAsync(() => {

      // given
      createTabComponent();
      tabFixture.detectChanges();
      flush();
      tabComponent.context.valueGroupings = [{ columnName: 'Amount', ranges: [{ min: 0, max: 30, active: true }], minMaxValues: { min: 10, max: 40 } }];

      // when
      const content = tabComponent.tabContent();

      // then
      expect(content.record.route).toBe(Route.PIVOT);
      expect(content.record.name).toBe('Pivot Table 1');
      expect(content.record.modifiedTime).toBe(0);
      expect(content.record.query).toEqual(queryToQueryDef(new Query()));
      expect(content.record.data.pivotOptions['rendererName']).toBeDefined();
      expect(content.record.data.valueGroupings[0].minMaxValues).toBeNull();
    }));

    it('should request persisting when pivot table was rendered', fakeAsync(() => {

      // given
      createTabComponent();
      tabFixture.detectChanges();
      flush();
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      tabComponent.onShowColumnTotalsChanged();
      flush();

      // then
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
    }));

    it.each([
      { change: 'fetchData', apply: (c: PivotTableComponent) => c.fetchData(new Query()) },
      { change: 'onNegativeColorChanged', apply: (c: PivotTableComponent) => c.onNegativeColorChanged('green') },
      { change: 'onPositiveColorChanged', apply: (c: PivotTableComponent) => c.onPositiveColorChanged('green') },
      { change: 'onSidenavClosing', apply: (c: PivotTableComponent) => c.onSidenavClosing() }
    ])('#$change should request persisting', ({ apply }) => fakeAsync(() => {

      // given
      createTabComponent();
      tabFixture.detectChanges();
      flush();
      tabComponent.getPivotOptions()['rendererName'] = 'Table';
      tabComponent.onSidenavOpening();
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      apply(tabComponent);

      // then
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
      flush();
    })());

    it('#ngOnDestroy should unregister and stop requesting persisting', fakeAsync(() => {

      // given
      createTabComponent();
      tabFixture.detectChanges();
      flush();
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      tabFixture.destroy();
      tabComponent.onSidenavClosing();

      // then
      expect(viewTabsService.unregister).toHaveBeenCalledWith('tab1', tabComponent);
      expect(viewTabsService.requestPersist).not.toHaveBeenCalled();
    }));
  });

  it('should not request persisting when not shown in a tab', fakeAsync(() => {

    // when
    component.onSidenavClosing();
    component.ngOnDestroy();

    // then
    expect(viewTabsService.requestPersist).not.toHaveBeenCalled();
    expect(viewTabsService.unregister).not.toHaveBeenCalled();
  }));

  it('#saveConfig should not save view when input dialog is cancled', () => {

    // given
    const dialogRef = createInputDialogRef();
    vi.spyOn(dialogService, 'showInputDialog').mockImplementation((data: InputDialogData) => {
      data.closedWithOK = false;
      return dialogRef;
    });
    vi.spyOn(viewPersistenceService, 'saveRecord').mockReturnValue(undefined);

    // when
    component.saveConfig();

    // then
    expect(notificationService.showStatus).not.toHaveBeenCalled();
  });

  it('#saveConfig should should save context without value grouping minMaxValues', fakeAsync(() => {

    // given
    component.context.valueGroupings = [
      {
        columnName: 'Amount',
        ranges: [
          { min: 30, max: 50, active: true },
          { min: 0, max: 30, active: true }
        ],
        minMaxValues: { min: 10, max: 40 }
      }];
    const dialogRef = createInputDialogRef();
    vi.spyOn(dialogService, 'showInputDialog').mockImplementation((data: InputDialogData) => {
      data.input = 'test';
      data.closedWithOK = true;
      return dialogRef;
    });
    const saveRecordSpy = vi.spyOn(viewPersistenceService, 'saveRecord').mockReturnValue(undefined);
    const status = { type: StatusType.SUCCESS, msg: 'Data has been saved' };
    saveRecordSpy.mockResolvedValue(status);

    // when
    component.saveConfig();
    tick();

    // then
    expect(viewPersistenceService.saveRecord).toHaveBeenCalled();
    const context = vi.mocked(saveRecordSpy).mock.lastCall[4];
    const expectedValueGroupings = [
      {
        columnName: 'Amount',
        ranges: [
          { min: 30, max: 50, active: true },
          { min: 0, max: 30, active: true }
        ],
        minMaxValues: null
      }];
    expect(context.valueGroupings).toEqual(expectedValueGroupings);
  }));

  it('#saveConfig should notify user about success', fakeAsync(() => {

    // given
    const dialogRef = createInputDialogRef();
    vi.spyOn(dialogService, 'showInputDialog').mockImplementation((data: InputDialogData) => {
      data.input = 'test';
      data.closedWithOK = true;
      return dialogRef;
    });
    const status = { type: StatusType.SUCCESS, msg: 'Data has been saved' };
    vi.spyOn(viewPersistenceService, 'saveRecord').mockResolvedValue(status);

    // when
    component.saveConfig();
    flush();

    // then
    const bootomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet, status);
  }));

  it('#updateConfigRecords should update records and notify user', () => {

    // given
    const deleted: ConfigRecord = { route: Route.PIVOT, name: 'deleted', modifiedTime: NOW, query: null, data: {} };
    const renamed: ConfigRecord = { route: Route.PIVOT, name: 'renamed', modifiedTime: NOW, query: null, data: {} };
    const status = { type: StatusType.SUCCESS, msg: 'Deleted 1 view\nRenamed 1 view' };
    vi.spyOn(viewPersistenceService, 'updateRecords').mockReturnValue(status);
    vi.spyOn(viewPersistenceService, 'findRecords').mockReturnValue([renamed]);

    // when
    component.updateConfigRecords([deleted], [renamed]);

    // then
    expect(viewPersistenceService.updateRecords).toHaveBeenCalledWith(scene, [deleted], [renamed]);
    expect(component.configRecords).toEqual([renamed]);
    expect(notificationService.showStatus).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), status);
  });

  it('#onNegativeColorChanged should not refresh pivot table when no heatmap', fakeAsync(() => {

    // given
    component.getPivotOptions()['rendererName'] = 'Table';
    const pivotTable = locatePivotTable();

    // when
    component.onNegativeColorChanged('yellow');
    flush();

    // then
    expect(component.context.negativeColor).toBe('yellow');
    expect(locatePivotTable()).toBe(pivotTable);
  }));

  it('#onNegativeColorChanged should refresh pivot table when heatmap', fakeAsync(() => {

    // given
    component.getPivotOptions()['rendererName'] = 'Row Heatmap';
    const pivotTable = locatePivotTable();

    // when
    component.onNegativeColorChanged('yellow');
    flush();

    // then
    expect(component.context.negativeColor).toBe('yellow');
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#onPositiveColorChanged should not refresh pivot table when no heatmap', fakeAsync(() => {

    // given
    component.getPivotOptions()['rendererName'] = 'Table';
    const pivotTable = locatePivotTable();

    // when
    component.onPositiveColorChanged('yellow');
    flush();

    // then
    expect(component.context.positiveColor).toBe('yellow');
    expect(locatePivotTable()).toBe(pivotTable);
  }));

  it('#onPositiveColorChanged should refresh pivot table when heatmap', fakeAsync(() => {

    // given
    component.getPivotOptions()['rendererName'] = 'Col Heatmap';
    const pivotTable = locatePivotTable();

    // when
    component.onPositiveColorChanged('yellow');
    flush();

    // then
    expect(component.context.positiveColor).toBe('yellow');
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#onShowRowTotalsChanged should refresh pivot table', fakeAsync(() => {

    // given
    const pivotTable = locatePivotTable();

    // when
    component.onShowRowTotalsChanged();
    flush();

    // then
    expect(component.context.showRowTotals).toBe(false);
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#onShowColumnTotalsChanged should refresh pivot table', fakeAsync(() => {

    // given
    const pivotTable = locatePivotTable();

    // when
    component.onShowColumnTotalsChanged();
    flush();

    // then
    expect(component.context.showColumnTotals).toBe(false);
    expect(locatePivotTable()).not.toBe(pivotTable);
  }));

  it('#exportToExcel should export pivot table to Excel', () => {

    // given
    vi.spyOn(exportService, 'exportTableAsExcel').mockReturnValue(undefined);

    // when
    component.exportToExcel();

    // then
    expect(exportService.exportTableAsExcel).toHaveBeenCalledWith(expect.any(Object), 'PivotTable');
  });

  it('#click on print button should print window', fakeAsync(() => {

    // given
    const okButton: HTMLSelectElement = fixture.debugElement.query(By.css('#but_print')).nativeElement;
    vi.spyOn(window, 'print').mockReturnValue(undefined);

    // when
    okButton.click();

    // then
    expect(window.print).toHaveBeenCalled();
  }));

  it('pivot buttons should follow toolbar separator', () => {

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelectorAll('#view_toolbar .koia-toolbar-separator ~ .but_config').length).toBe(3);
  });

  function pivotContext(): PivotContext {
    return {
      timeColumns: [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MONTH }],
      negativeColor: 'yellow',
      positiveColor: 'red',
      showRowTotals: true,
      showColumnTotals: true,
      valueGroupings: [],
      pivotOptions: { rendererName: 'Table', cols: ['Level'], rows: [] }
    };
  }

  function createInputDialogRef(): MatDialogRef<InputDialogComponent> {
    return <MatDialogRef<InputDialogComponent>>{
      afterClosed(): Observable<boolean> {
        return of(true);
      }
    };
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});
