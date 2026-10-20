import { CdkScrollableModule, ScrollDispatcher } from '@angular/cdk/scrolling';
import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, ElementRef, Injectable } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { By, DomSanitizer } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { InputDialogComponent, InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { Column, DataType, Document, Query, Route, Scene, StatusType, TimeUnit } from 'app/shared/model';
import { ConfigRecord, ViewType } from 'app/shared/model/view-config';
import { queryToQueryDef } from 'app/shared/services/view-persistence/filter/query-to-filter-converter';
import { DialogService, ExportService, NotificationService, RawDataRevealService, TimeGroupingService, ViewPersistenceService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { findStyleRule, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { LanguageService } from 'app/shared/services/language';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { ValueGrouping } from 'app/shared/value-range/model';
import { Observable, of, Subject, throwError } from 'rxjs';
import { PivotContext } from './model';
import { PivotTableComponent } from './pivot-table.component';
import type { Mock } from 'vitest';
import { PageHeadingComponent } from 'app/shared/ui/print-heading/page-heading.component';
import { PrintHeadingComponent } from 'app/shared/ui/print-heading/print-heading.component';
import { ViewToolbarComponent } from 'app/shared/ui/view-toolbar/view-toolbar.component';
import { TABLE_FONT_FAMILY } from 'app/shared/ui/table-fit/table-font';

@Injectable()
export class MockElementRef {
  nativeElement: object;
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
  let locatePivotTable: () => Element;
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
      declarations: [PivotTableComponent, ViewToolbarComponent, PageHeadingComponent, PrintHeadingComponent],
      imports: [
        MatSidenavModule, MatProgressBarModule, MatButtonModule, MatIconModule, MatTooltipModule,
        MatMenuModule, MatBottomSheetModule, CdkScrollableModule, MatBadgeModule
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
    const sanitizer = TestBed.inject(DomSanitizer);
    ['row_totals', 'column_totals'].forEach(icon =>
      TestBed.inject(MatIconRegistry).addSvgIconLiteral(icon, sanitizer.bypassSecurityTrustHtml('<svg></svg>')));
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

  it('should show print heading with tab title and scene name', () => {

    // given
    component.tab = { id: 'tab1', type: ViewType.PIVOT, title: 'Pivot Table 1' };

    // when
    fixture.detectChanges();

    // then
    const heading: HTMLElement = fixture.nativeElement.querySelector('.div_header > koia-print-heading');
    expect(heading.querySelector('.span_print_title').textContent).toBe('Pivot Table 1');
    expect(heading.querySelector('.span_print_details').textContent).toContain('Scene: Scene 1');
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

  it('should render pivot frameless on surface page', () => {

    // when
    const container: HTMLElement = fixture.nativeElement.querySelector('.div_table');

    // then
    expect(container.classList).not.toContain('mat-elevation-z1');
    const style = getComputedStyle(container);
    expect(style.borderTopStyle).toBe('none');
    expect(style.boxShadow).toBe('none');
    expect(getComputedStyle(fixture.nativeElement.querySelector('.div_content')).backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('should scroll tall table below header', () => {

    // when
    component.divPivot.nativeElement.style.height = '5000px';

    // then
    const content: HTMLElement = fixture.nativeElement.querySelector('.div_content');
    const header: HTMLElement = fixture.nativeElement.querySelector('.div_header');
    const sidenavContent: HTMLElement = fixture.nativeElement.querySelector('mat-sidenav-content');
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(content.getBoundingClientRect().top).toBe(header.getBoundingClientRect().bottom);
    expect(sidenavContent.scrollHeight).toBe(sidenavContent.clientHeight);
  });

  it('should scroll wide table inside content', () => {

    // when
    component.divPivot.nativeElement.style.width = '3000px';

    // then
    const content: HTMLElement = fixture.nativeElement.querySelector('.div_content');
    const sidenavContent: HTMLElement = fixture.nativeElement.querySelector('mat-sidenav-content');
    expect(content.scrollWidth).toBeGreaterThan(content.clientWidth);
    expect(sidenavContent.scrollWidth).toBe(sidenavContent.clientWidth);
  });

  it('should position opened filter popup relative to scrolled table', () => {

    // given
    fixture.nativeElement.querySelector('.pvtTriangle').click();
    const filterBox = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.pvtFilterBox'))
      .find(box => box.style.display !== 'none');

    // when
    filterBox.style.position = 'absolute';

    // then
    expect(filterBox.offsetParent).toBe(fixture.nativeElement.querySelector('.div_table'));
  });

  it('should register content as scrollable for overlays', () => {

    // when
    const scrollables = TestBed.inject(ScrollDispatcher).getAncestorScrollContainers(component.divPivot);

    // then
    const content = fixture.nativeElement.querySelector('.div_content');
    expect(scrollables.map(s => s.getElementRef().nativeElement)).toContain(content);
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
    expect(component.timeColumns[0]).toBe(component.context.timeColumns[0]);
  });

  it('#loadConfig should replace legacy heatmap colors', () => {

    // given
    const context: PivotContext = { ...pivotContext(), negativeColor: '#FF3333', positiveColor: '#00FF00' };
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: null, data: context };

    // when
    component.loadConfig(configRecord);

    // then
    expect(component.context.negativeColor).toBe('#E57373');
    expect(component.context.positiveColor).toBe('#81C784');
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

    const sumRecord = (): ConfigRecord => ({
      route: Route.PIVOT, name: 'Pivot Table 1', modifiedTime: 0, query: null,
      data: { ...pivotContext(), pivotOptions: { rendererName: 'Table', aggregatorName: 'Sum', vals: ['Amount'], cols: ['Level'], rows: [] } }
    });

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

    describe('with restored time unit', () => {

      const timeRecord = (): ConfigRecord => ({
        route: Route.PIVOT, name: 'Pivot Table 1', modifiedTime: 0, query: null,
        data: { ...pivotContext(), pivotOptions: { rendererName: 'Table', aggregatorName: 'Count', cols: ['Level'], rows: ['Time (per month)'] } }
      });

      function clickFirstCell(): Query {
        const showSpy = vi.spyOn(rawDataRevealService, 'show').mockReturnValue(undefined);
        const cell: HTMLTableCellElement = tabFixture.nativeElement.querySelector('td.pvtVal');
        (cell.onclick as (e: unknown) => void)({ target: cell });
        return showSpy.mock.lastCall[0];
      }

      function monthStart(): number {
        const date = new Date(now);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }

      it('should reveal raw data of clicked cell with restored time unit', fakeAsync(() => {

        // given
        createTabComponent(timeRecord());
        tabFixture.detectChanges();
        flush();

        // when
        const query = clickFirstCell();

        // then
        const valueRange = query.findValueRangeFilter('Time').valueRange;
        expect(valueRange.min).toBe(monthStart());
        const monthEnd = new Date(monthStart());
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        expect(valueRange.max).toBe(monthEnd.getTime());
      }));

      it('should keep restored time unit when data is fetched again', fakeAsync(() => {

        // given
        createTabComponent(timeRecord());
        tabFixture.detectChanges();
        flush();

        // when
        tabComponent.fetchData(new Query());
        flush();

        // then
        expect(tabComponent.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MONTH);
        expect(clickFirstCell().findValueRangeFilter('Time').valueRange.min).toBe(monthStart());
      }));

      it('should share restored time columns with time unit menu', fakeAsync(() => {

        // when
        createTabComponent(timeRecord());
        tabFixture.detectChanges();
        flush();

        // then
        expect(tabComponent.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MONTH);
        expect(tabComponent.context.timeColumns[0]).toBe(tabComponent.timeColumns[0]);
      }));

      it('should regroup restored pivot table when time unit is changed', fakeAsync(() => {

        // given
        createTabComponent(timeRecord());
        tabFixture.detectChanges();
        flush();

        // when
        tabComponent.onTimeUnitChanged(tabComponent.timeColumns[0], TimeUnit.YEAR);
        flush();

        // then
        expect(tabComponent.context.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.YEAR);
        expect(tabComponent.getPivotOptions()['rows']).toEqual(['Time (per year)']);
        expect(tabComponent.dataFrame.first()['Time (per year)']).toBe(datePipe.transform(now, 'yyyy'));
      }));
    });

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
      expect((content.record.data as PivotContext).pivotOptions['rendererName']).toBeDefined();
      expect((content.record.data as PivotContext).valueGroupings[0].minMaxValues).toBeNull();
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

    describe('styling', () => {

      beforeEach(fakeAsync(() => {
        const record = sumRecord();
        const context = record.data as PivotContext;
        context.pivotOptions = { ...context.pivotOptions, rows: ['Amount'] };
        createTabComponent(record);
        tabFixture.detectChanges();
        flush();
      }));

      function styleOf(selector: string): CSSStyleDeclaration {
        return getComputedStyle(tabFixture.nativeElement.querySelector(selector));
      }

      it('value cells should use dense table font without link decoration', () => {

        // when
        const style = styleOf('td.pvtVal');

        // then
        expect(style.fontFamily).toBe(TABLE_FONT_FAMILY);
        expect(style.fontSize).toBe('11px');
        expect(style.lineHeight).toBe('16px');
        expect(style.paddingTop).toBe('2px');
        expect(style.paddingLeft).toBe('5px');
        expect(style.textDecorationLine).toBe('none');
        expect(style.color).toBe('rgba(0, 0, 0, 0.87)');
        expect(style.fontVariantNumeric).toBe('tabular-nums');
        expect(style.cursor).toBe('pointer');
      });

      it('empty value cells should not look clickable', () => {

        // when
        const style = getComputedStyle(emptyValueCell());

        // then
        expect(style.cursor).toBe('auto');
      });

      it('non-empty cells should hint at showing data after refresh', () => {

        // when
        const valueCell: HTMLElement = tabFixture.nativeElement.querySelector('td.pvtVal');

        // then
        expect(valueCell.textContent).not.toBe('');
        expect(valueCell.title).toBe('Show Data...');
        expect(tabFixture.nativeElement.querySelector('td.pvtGrandTotal').title).toBe('Show Data...');
        expect(emptyValueCell().title).toBe('');
      });

      function emptyValueCell(): HTMLElement {
        return Array.from<HTMLElement>(tabFixture.nativeElement.querySelectorAll('td.pvtVal')).find(c => c.textContent === '');
      }

      it('label cells should be semibold on header surface with hairline', () => {

        // when
        const style = styleOf('th.pvtColLabel');

        // then
        expect(style.fontWeight).toBe('600');
        expect(style.backgroundColor).toBe('rgb(245, 246, 248)');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopColor).toBe('rgb(224, 224, 224)');
        expect(style.whiteSpace).toBe('nowrap');
        expect(style.paddingTop).toBe('2px');
      });

      it('configuration panel should use table font size', () => {

        // when
        const style = styleOf('.pvtUi');

        // then
        expect(style.fontSize).toBe('12px');
      });

      it('axis label cells should be secondary text', () => {

        // when
        const style = styleOf('th.pvtAxisLabel');

        // then
        expect(style.color).toBe('rgba(0, 0, 0, 0.6)');
      });

      it('grand total should be set apart by total lines', () => {

        // when
        const style = styleOf('td.pvtGrandTotal');

        // then
        expect(style.borderTopWidth).toBe('2px');
        expect(style.borderLeftWidth).toBe('2px');
        expect(style.borderTopColor).toBe('rgb(138, 148, 166)');
        expect(style.fontWeight).toBe('600');
      });

      it('non-empty value cell hover should underline and outline cell', () => {

        // when
        const rule = findStyleRule(document.styleSheets, '.pvtUi table.pvtTable tbody tr td:not(:empty):hover');

        // then
        expect(rule.style.textDecoration).toBe('underline');
        expect(rule.style.outlineWidth).toBe('2px');
        expect(rule.style.outlineStyle).toBe('solid');
        expect(rule.style.getPropertyValue('outline-color')).toBe('var(--koia-primary)');
        expect(rule.style.outlineOffset).toBe('-2px');
      });

      it('configuration selects should look like outlined fields', () => {

        // when
        const style = styleOf('select.pvtRenderer');

        // then
        expect(style.appearance).toBe('none');
        expect(style.borderTopLeftRadius).toBe('6px');
        expect(style.borderTopColor).toBe('rgb(138, 148, 166)');
      });

      it.each(['select.pvtRenderer', 'select.pvtAggregator', 'select.pvtAttrDropdown'])('configuration select %s should be as high as field chips', selector => {

        // when
        const selectHeight = tabFixture.nativeElement.querySelector(selector).getBoundingClientRect().height;
        const chipHeight = tabFixture.nativeElement.querySelector('span.pvtAttr').getBoundingClientRect().height;

        // then
        expect(selectHeight).toBe(22);
        expect(chipHeight).toBe(22);
      });

      it('available fields zone should be dashed neutral area', () => {

        // when
        const style = styleOf('td.pvtUnused');

        // then
        expect(style.borderTopStyle).toBe('dashed');
        expect(style.backgroundColor).toBe('rgb(245, 246, 248)');
        expect(style.borderTopLeftRadius).toBe('8px');
      });

      it.each(['td.pvtVals', 'td.pvtCols', 'td.pvtRows'])('selected fields zone %s should be solid tinted area', selector => {

        // when
        const style = styleOf(selector);

        // then
        expect(style.borderTopStyle).toBe('solid');
        expect(style.borderTopColor).toBe('rgb(197, 202, 233)');
        expect(style.backgroundColor).toBe('rgb(232, 234, 246)');
        expect(style.borderTopLeftRadius).toBe('8px');
      });

      it('field chips should be rounded', () => {

        // when
        const style = styleOf('span.pvtAttr');

        // then
        expect(style.borderTopLeftRadius).toBe('12px');
      });

      it('filter popup should be elevated card with primary apply button', () => {

        // given
        tabFixture.nativeElement.querySelector('.pvtTriangle').click();

        // when
        const filterBox = Array.from<HTMLElement>(tabFixture.nativeElement.querySelectorAll('.pvtFilterBox'))
          .find(box => box.style.display !== 'none');

        // then
        const style = getComputedStyle(filterBox);
        expect(style.borderTopLeftRadius).toBe('8px');
        expect(style.boxShadow).not.toBe('none');
        expect(style.textAlign).toBe('left');
        expect(getComputedStyle(filterBox.querySelector('p:last-child > button:first-child')).backgroundColor).toBe('rgb(48, 63, 159)');
      });
    });

    describe('language change', () => {

      function switchLanguage(language: 'en' | 'de' | 'ja'): void {
        TestBed.inject(LanguageService).use(language);
        flushMicrotasks();
        tabFixture.detectChanges();
        flush();
      }

      function optionText(selectClass: string, value: string): string {
        return tabFixture.nativeElement.querySelector('select.' + selectClass + ' option[value="' + value + '"]').textContent;
      }

      function totalLabels(): string[] {
        return Array.from<HTMLElement>(tabFixture.nativeElement.querySelectorAll('.pvtTotalLabel')).map(e => e.textContent);
      }

      beforeEach(() => vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined));

      afterEach(() => document.documentElement.lang = 'en');

      it('should show pivot table in current language', fakeAsync(() => {

        // given
        createTabComponent(sumRecord());

        // when
        tabFixture.detectChanges();
        flush();

        // then
        expect(totalLabels()).toContain('Totals');
        expect(optionText('pvtAggregator', 'Sum')).toBe('Sum');
        expect(optionText('pvtRenderer', 'Row Heatmap')).toBe('Row Heatmap');
      }));

      it('should re-render pivot table in new language without changing or persisting its configuration', fakeAsync(() => {

        // given
        createTabComponent(sumRecord());
        tabFixture.detectChanges();
        flush();
        const contentBefore = JSON.stringify(tabComponent.tabContent());
        vi.mocked(viewTabsService.requestPersist).mockClear();

        // when
        switchLanguage('de');
        tick(5_000);

        // then
        expect(totalLabels()).toContain('Summen');
        expect(totalLabels()).not.toContain('Totals');
        expect(optionText('pvtAggregator', 'Sum')).toBe('Summe');
        expect(optionText('pvtRenderer', 'Row Heatmap')).toBe('Heatmap pro Zeile');
        expect(tabFixture.nativeElement.querySelector('select.pvtAggregator').value).toBe('Sum');
        expect(tabComponent.getPivotOptions()['aggregatorName']).toBe('Sum');
        expect(tabComponent.getPivotOptions()['cols']).toEqual(['Level']);
        expect(viewTabsService.requestPersist).not.toHaveBeenCalled();
        const content = tabComponent.tabContent();
        expect(JSON.stringify(content)).toBe(contentBefore);
        expect((content.record.data as PivotContext).pivotOptions['localeStrings']).toBeUndefined();
        expect((content.record.data as PivotContext).pivotOptions['rendererOptions']).toBeUndefined();
      }));

      it('should request persisting again when pivot table is changed after language change', fakeAsync(() => {

        // given
        createTabComponent(sumRecord());
        tabFixture.detectChanges();
        flush();
        switchLanguage('ja');
        vi.mocked(viewTabsService.requestPersist).mockClear();

        // when
        tabComponent.onShowColumnTotalsChanged();
        flush();

        // then
        expect(viewTabsService.requestPersist).toHaveBeenCalled();
        expect(totalLabels()).toContain('合計');
      }));

      it('should re-render detached pivot table in new language once attached again', fakeAsync(() => {

        // given
        createTabComponent(sumRecord());
        tabFixture.detectChanges();
        flush();
        const host: HTMLElement = tabFixture.nativeElement;
        const parent = host.parentNode;
        parent.removeChild(host);

        // when
        switchLanguage('de');
        const labelsWhileDetached = totalLabels();
        parent.appendChild(host);
        tabFixture.detectChanges();
        flush();

        // then
        expect(labelsWhileDetached).toContain('Totals');
        expect(totalLabels()).toContain('Summen');
      }));

      it('should not re-render pivot table in new language when pivot table has no options', fakeAsync(() => {

        // given
        createTabComponent(sumRecord());
        tabFixture.detectChanges();
        flush();
        vi.spyOn(tabComponent, 'getPivotOptions').mockReturnValue(undefined);

        // when
        switchLanguage('de');

        // then
        expect(totalLabels()).toContain('Totals');
        expect(tabComponent.computing).toBe(false);
      }));

      it('should reveal raw data of time grouped cell in new language', fakeAsync(() => {

        // given
        const timeLabel = 'Time (per month)';
        const record = sumRecord();
        (record.data as PivotContext).pivotOptions = { rendererName: 'Table', aggregatorName: 'Count', cols: ['Level'], rows: [timeLabel] };
        createTabComponent(record);
        tabFixture.detectChanges();
        flush();
        switchLanguage('de');
        const showSpy = vi.spyOn(rawDataRevealService, 'show').mockReturnValue(undefined);
        const rowLabel: HTMLElement = tabFixture.nativeElement.querySelector('th.pvtRowLabel');

        // when
        const cell: HTMLTableCellElement = tabFixture.nativeElement.querySelector('td.pvtVal');
        (cell.onclick as (e: unknown) => void)({ target: cell });

        // then
        const monthStart = new Date(now);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        expect(rowLabel.textContent).toBe(datePipe.transform(now, 'MMM yyyy'));
        const query: Query = showSpy.mock.lastCall[0];
        expect(query.findValueRangeFilter('Time').valueRange.min).toBe(monthStart.getTime());
      }));
    });

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
    const context = vi.mocked(saveRecordSpy).mock.lastCall[4] as PivotContext;
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

  it('#updateConfigRecords should update records and notify user', async () => {

    // given
    const deleted: ConfigRecord = { route: Route.PIVOT, name: 'deleted', modifiedTime: NOW, query: null, data: {} };
    const renamed: ConfigRecord = { route: Route.PIVOT, name: 'renamed', modifiedTime: NOW, query: null, data: {} };
    const status = { type: StatusType.SUCCESS, msg: 'Deleted 1 view\nRenamed 1 view' };
    vi.spyOn(viewPersistenceService, 'updateRecords').mockResolvedValue(status);
    vi.spyOn(viewPersistenceService, 'findRecords').mockReturnValue([renamed]);

    // when
    await component.updateConfigRecords([deleted], [renamed]);

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

  it('#fetchData should define time unit of time column when pivot options have neither cols nor rows', fakeAsync(() => {

    // given
    component.context.pivotOptions = { rendererName: 'Table' };
    component.context.timeColumns[0].groupingTimeUnit = TimeUnit.YEAR;

    // when
    component.fetchData(new Query());
    flush();

    // then
    expect(component.context.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MILLISECOND);
  }));

  it('#loadConfig should keep time unit of time column when restored time column has no time unit', () => {

    // given
    const context: PivotContext = {
      ...pivotContext(),
      timeColumns: [{ name: 'Time', dataType: DataType.TIME, width: 100 }]
    };
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: null, data: context };

    // when
    component.loadConfig(configRecord);

    // then
    expect(component.timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MILLISECOND);
    expect(component.context.timeColumns[0]).toBe(component.timeColumns[0]);
  });

  it('#loadConfig should fetch data with query of loaded record', fakeAsync(() => {

    // given
    const query = new Query();
    query.setFullTextFilter('WARN');
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: queryToQueryDef(query), data: pivotContext() };
    vi.mocked(dbService.findEntries).mockClear();

    // when
    component.loadConfig(configRecord);
    flush();

    // then
    const fetchQuery: Query = vi.mocked(dbService.findEntries).mock.lastCall[0];
    expect(fetchQuery.getFullTextFilter()).toBe('WARN');
    expect(component.restoredQuery.getFullTextFilter()).toBe('WARN');
  }));

  it('#loadConfig should restore loaded record with query once its data was fetched', fakeAsync(() => {

    // given
    const entries$ = new Subject<Document[]>();
    vi.mocked(dbService.findEntries).mockReturnValue(entries$);
    const query = new Query();
    query.setFullTextFilter('INFO');
    const configRecord: ConfigRecord = { route: Route.PIVOT, name: 'test', modifiedTime: NOW, query: queryToQueryDef(query), data: pivotContext() };
    component.loadConfig(configRecord);
    const colorBeforeData = component.context.negativeColor;

    // when
    entries$.next(entries as Document[]);
    flush();

    // then
    expect(colorBeforeData).not.toBe('yellow');
    expect(component.context.negativeColor).toBe('yellow');
    expect(component.getPivotOptions()['cols']).toEqual(['Level']);
  }));

  it('#fetchData should stop loading and notify error when entries cannot be fetched', () => {

    // given
    vi.mocked(dbService.findEntries).mockReturnValue(throwError(() => 'failure'));
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

    // when
    component.fetchData(new Query());

    // then
    expect(component.loading).toBe(false);
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'failure');
  });

  it('#onTimeUnitChanged should change time unit without refreshing when no data was fetched yet', fakeAsync(() => {

    // given
    vi.mocked(dbService.findEntries).mockReturnValue(new Subject());
    const pendingFixture = TestBed.createComponent(PivotTableComponent);
    const pendingComponent = pendingFixture.componentInstance;
    pendingFixture.detectChanges();
    flush();
    const timeColumn = pendingComponent.timeColumns[0];

    // when
    pendingComponent.onTimeUnitChanged(timeColumn, TimeUnit.YEAR);
    flush();

    // then
    expect(timeColumn.groupingTimeUnit).toBe(TimeUnit.YEAR);
    expect(pendingComponent.dataFrame).toBeUndefined();
  }));

  it('should set computing when pivot renderer area starts refreshing', async () => {

    // given
    const rendererArea: HTMLElement = component.divPivot.nativeElement.querySelector('.pvtRendererArea');
    component.computing = false;

    // when
    rendererArea.style.opacity = '0.5';

    // then
    await sleep(0);
    expect(component.computing).toBe(true);
  });

  it('should not set computing when pivot renderer area finished refreshing', async () => {

    // given
    const rendererArea: HTMLElement = component.divPivot.nativeElement.querySelector('.pvtRendererArea');
    rendererArea.style.opacity = '0.5';
    await sleep(0);
    component.computing = false;

    // when
    rendererArea.style.opacity = '1';

    // then
    await sleep(0);
    expect(component.computing).toBe(false);
  });

  it('should keep single mutation observer when pivot table is refreshed and none when destroyed', fakeAsync(() => {

    // given
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe');
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const connectedObservers = () => observeSpy.mock.calls
      .map((call, i) => ({ target: call[0] as HTMLElement, observer: observeSpy.mock.contexts[i] }))
      .filter(o => o.target.classList.contains('pvtRendererArea'))
      .filter(o => !disconnectSpy.mock.contexts.includes(o.observer));
    component.onShowColumnTotalsChanged();
    flush();
    component.onShowRowTotalsChanged();
    flush();
    const connectedObserversAfterRefreshes = connectedObservers().length;

    // when
    fixture.destroy();

    // then
    expect(connectedObserversAfterRefreshes).toBe(1);
    expect(connectedObservers().length).toBe(0);
  }));

  it('#manageViews should open manage config dialog', () => {

    // given
    vi.spyOn(dialogService, 'showManageConfigDialog').mockReturnValue(undefined);

    // when
    component.manageViews();

    // then
    expect(dialogService.showManageConfigDialog).toHaveBeenCalledWith(component);
  });

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
    expect(fixture.nativeElement.querySelectorAll('.view_toolbar .koia-toolbar-separator ~ .but_config').length).toBe(5);
  });

  it.each([
    { id: '#but_value_grouping', icon: 'group_work' },
    { id: '#but_time_unit', icon: 'date_range' },
    { id: '#but_heatmap_colors', icon: 'color_lens' }
  ])('toolbar button $id should show icon $icon', ({ id, icon }) => {

    // when
    const iconElement: HTMLElement = fixture.nativeElement.querySelector(id + ' mat-icon');

    // then
    expect(iconElement.firstChild.textContent.trim()).toBe(icon);
  });

  it.each([
    { id: '#but_row_totals', icon: 'row_totals' },
    { id: '#but_column_totals', icon: 'column_totals' }
  ])('toolbar button $id should show svg icon $icon', ({ id, icon }) => {

    // when
    const iconElement: HTMLElement = fixture.nativeElement.querySelector(id + ' mat-icon');

    // then
    expect(iconElement.getAttribute('svgicon')).toBe(icon);
  });

  it('value grouping badge should be hidden without groupings', () => {

    // given
    component.context.valueGroupings = [];

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('#but_value_grouping mat-icon').classList).toContain('mat-badge-hidden');
  });

  it('value grouping badge should show number of groupings', () => {

    // given
    component.context.valueGroupings = [{ columnName: 'Amount', ranges: [] }];

    // when
    fixture.detectChanges();

    // then
    const icon: HTMLElement = fixture.nativeElement.querySelector('#but_value_grouping mat-icon');
    expect(icon.classList).not.toContain('mat-badge-hidden');
    expect(icon.querySelector('.mat-badge-content').textContent).toBe('1');
  });

  it('row totals button should be active with hide tooltip while row totals are shown', () => {

    // when
    const button: HTMLElement = fixture.nativeElement.querySelector('#but_row_totals');

    // then
    expect(button.classList).toContain('koia-toggle-active');
    expect(tooltipOf('#but_row_totals')).toBe('Hide Row Totals');
  });

  it('#click on row totals button should hide row totals and deactivate button', fakeAsync(() => {

    // given
    const button: HTMLElement = fixture.nativeElement.querySelector('#but_row_totals');

    // when
    button.click();
    flush();
    fixture.detectChanges();

    // then
    expect(component.context.showRowTotals).toBe(false);
    expect(button.classList).not.toContain('koia-toggle-active');
    expect(tooltipOf('#but_row_totals')).toBe('Show Row Totals');
  }));

  it('#click on column totals button should hide column totals and deactivate button', fakeAsync(() => {

    // given
    const button: HTMLElement = fixture.nativeElement.querySelector('#but_column_totals');

    // when
    button.click();
    flush();
    fixture.detectChanges();

    // then
    expect(component.context.showColumnTotals).toBe(false);
    expect(button.classList).not.toContain('koia-toggle-active');
    expect(tooltipOf('#but_column_totals')).toBe('Show Column Totals');
  }));

  it('more menu should offer only excel export and view management', fakeAsync(() => {

    // given
    const moreButton: HTMLElement = fixture.nativeElement.querySelector('.but_view_more');

    // when
    moreButton.click();
    fixture.detectChanges();
    flush();

    // then
    const texts = Array.from(document.querySelectorAll('.mat-mdc-menu-panel .mat-mdc-menu-item-text')).map(e => e.textContent.trim());
    expect(texts).toEqual(['Save As Excel', 'Manage Views']);
  }));

  function tooltipOf(selector: string): string {
    return fixture.debugElement.query(By.css(selector)).injector.get(MatTooltip).message;
  }

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
