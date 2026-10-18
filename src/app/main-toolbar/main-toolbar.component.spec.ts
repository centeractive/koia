import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { Component, NO_ERRORS_SCHEMA, ChangeDetectionStrategy, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, TestModuleMetadata, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterEvent, RouterModule } from '@angular/router';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { Column, ContextInfo, DataType, Operator, PropertyFilter, Query, Route, Scene, TimeUnit } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { TabDef, ViewType } from 'app/shared/model/view-config';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { MatIconModuleMock, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { of, Subject } from 'rxjs';
import { MainToolbarComponent } from './main-toolbar.component';
import { ViewTabBarComponent } from './view-tab-bar/view-tab-bar.component';
import { NumberRangeFilter } from './range-filter/model/number-range-filter';
import { TimeRangeFilter } from './range-filter/model/time-range-filter';
import type { Mock } from 'vitest';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class DummyComponent { }

function configureTestingModule(dbService: DBService, dialogService: DialogService, extra: TestModuleMetadata = {}): Promise<void> {
  return TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    declarations: [MainToolbarComponent, DummyComponent, KoiaFormDirective, ...(extra.declarations ?? [])],
    imports: [
      MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, ReactiveFormsModule,
      MatFormFieldModule, MatSelectModule, MatInputModule, MatMenuModule, NgxSliderModule, MatBottomSheetModule,
      RouterModule.forRoot([{ path: '**', component: DummyComponent }], {}),
      ...(extra.imports ?? [])
    ],
    providers: [
      { provide: DBService, useValue: dbService },
      { provide: DialogService, useValue: dialogService },
      { provide: NotificationService, useValue: new NotificationServiceMock() },
      ...(extra.providers ?? [])
    ]
  })
    .overrideModule(MatIconModule, MatIconModuleMock.override())
    .compileComponents();
}

describe('MainToolbarComponent with many tabs', () => {

  const dbService = new DBService(null);
  const dialogService = new DialogService(null);
  let fixture: ComponentFixture<MainToolbarComponent>;

  beforeEach(async () => {
    const tabs: TabDef[] = Array.from({ length: 30 }, (_, i) => ({ id: 'tab' + (i + 1), type: ViewType.DASHBOARD, title: 'Dashboard ' + (i + 1) }));
    const viewTabsService = { tabs, ready: true, layoutOf: vi.fn() } as unknown as ViewTabsService;
    await configureTestingModule(dbService, dialogService, {
      declarations: [ViewTabBarComponent],
      imports: [MatTabsModule],
      providers: [{ provide: ViewTabsService, useValue: viewTabsService }]
    });
    vi.spyOn(dbService, 'getActiveScene').mockReturnValue(SceneFactory.createScene('1', [{ name: 'Level', dataType: DataType.TEXT, width: 60 }]));
    vi.spyOn(dbService, 'findEntries').mockReturnValue(of([]));
    fixture = TestBed.createComponent(MainToolbarComponent);
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.width = '900px';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function toolbarRect(): DOMRect {
    return fixture.nativeElement.querySelector('.div_toolbar').getBoundingClientRect();
  }

  function rightOf(selector: string): number {
    return fixture.nativeElement.querySelector(selector).getBoundingClientRect().right;
  }

  it('should keep Add Filter button and refresh button visible when tabs exceed toolbar width', () => {

    // when
    const toolbarRight = toolbarRect().right;

    // then
    expect(rightOf('.but_add_col_filter')).toBeLessThanOrEqual(toolbarRight);
    expect(rightOf('.span_buttons:not(.span_navigation) > button:last-child')).toBeLessThanOrEqual(toolbarRight);
  });

  it('should enable tab pagination when tabs exceed toolbar width', () => {

    // when
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');

    // then
    expect(nav.classList).toContain('mat-mdc-tab-header-pagination-controls-enabled');
  });

  it('tab bar should touch bottom of toolbar when column filter makes toolbar taller', () => {

    // given
    const toolbar = fixture.componentInstance;
    toolbar.addValueFilter(toolbar.scene.columns.find(c => c.name === 'Level'));

    // when
    fixture.detectChanges();

    // then
    const navRect: DOMRect = fixture.nativeElement.querySelector('nav').getBoundingClientRect();
    expect(toolbarRect().height - navRect.height).toBeGreaterThanOrEqual(1);
    expect(navRect.bottom).toBeCloseTo(toolbarRect().bottom, 0);
  });

  it('should keep add tab button visible', () => {

    // when
    const toolbarRight = toolbarRect().right;

    // then
    expect(rightOf('#butAddTab')).toBeLessThanOrEqual(toolbarRight);
  });
});

describe('MainToolbarComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: object[];
  let valueRange: ValueRange;
  let component: MainToolbarComponent;
  let fixture: ComponentFixture<MainToolbarComponent>;
  const dbService = new DBService(null);
  const dialogService = new DialogService(null);
  let getActiveSceneSpy: Mock;

  beforeAll(() => {
    now = new Date().getTime();
    const context = [
      { name: 'Profile', value: 'Test' },
      { name: 'Search Criteria', value: 'contains "xyz"' }
    ]
    const columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, format: 'yyyy-MM-dd HH:mm:ss SSS' },
      { name: 'Level', dataType: DataType.TEXT, width: 60 },
      { name: 'Host', dataType: DataType.TEXT, width: 80 },
      { name: 'Path', dataType: DataType.TEXT, width: 200 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 },
      { name: 'Paid', dataType: DataType.BOOLEAN, width: 10 }
    ];
    scene = createScene('1', context, columns);
    entries = [
      { ID: 1, Time: now - 90_000, Level: 'INFO', Host: 'server1', Path: '/opt/log/info.log', Amount: 10, Paid: false },
      { ID: 2, Time: now - 80_000, Level: 'INFO', Host: 'server1', Path: '/opt/log/info.log', Amount: 20, Paid: false },
      { ID: 3, Time: now - 70_000, Level: 'INFO', Host: 'server1', Path: '/opt/log/info.log', Amount: 30, Paid: true },
      { ID: 4, Time: now - 60_000, Level: 'WARN', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 40, Paid: false },
      { ID: 5, Time: now - 50_000, Level: 'WARN', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 50, Paid: true },
      { ID: 6, Time: now - 40_000, Level: 'WARN', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 60, Paid: true },
      { ID: 7, Time: now - 30_000, Level: 'ERROR', Host: 'server2', Path: '/var/log/error.log', Amount: 70, Paid: false },
      { ID: 8, Time: now - 20_000, Level: 'ERROR', Host: 'server2', Path: '/var/log/error.log', Amount: 80, Paid: true },
      { ID: 9, Time: now - 10_000, Level: 'ERROR', Host: 'server2', Path: '/var/log/error.log', Amount: 90, Paid: true },
      { ID: 10, Time: now, Level: 'ERROR', Data: 'ERROR line four', Host: 'server2', Path: '/var/log/error.log', Amount: 100, Paid: false }
    ];
    const timeMin = entries[0]['Time'];
    const timeMax = entries[entries.length - 1]['Time'];
    valueRange = { min: timeMin, max: timeMax };
  });

  beforeEach(waitForAsync(() => configureTestingModule(dbService, dialogService)));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(MainToolbarComponent);
    component = fixture.componentInstance;
    getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
    vi.spyOn(dbService, 'numberRangeOf').mockResolvedValue(valueRange);
    vi.spyOn(dbService, 'findEntries').mockReturnValue(of(entries));
    fixture.detectChanges();
    flush();
    vi.spyOn(component.router, 'navigate').mockReturnValue(undefined);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load active scene data', () => {
    expect(dbService.getActiveScene).toHaveBeenCalled();
  });

  it('toolbar should let header surface show through', () => {

    // when
    const style = getComputedStyle(fixture.nativeElement.querySelector('.div_main'));

    // then
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('navigation buttons should be separated from tab bar by divider', () => {

    // when
    const separator: HTMLElement = fixture.nativeElement.querySelector('.span_navigation > .koia-toolbar-separator');

    // then
    expect(separator.previousElementSibling.id).toBe('butScene');
    expect(separator.nextElementSibling.tagName).toBe('KOIA-VIEW-TAB-BAR');
  });

  it('add filter button should be rounded accent button without non-breaking spaces', () => {

    // when
    const button: HTMLElement = fixture.nativeElement.querySelector('.but_add_col_filter');

    // then
    const style = getComputedStyle(button);
    expect(style.backgroundColor).toBe('rgb(56, 142, 60)');
    expect(style.color).toBe('rgb(255, 255, 255)');
    expect(style.borderTopLeftRadius).toBe('8px');
    expect(button.querySelector('.mdc-button__label').textContent.trim()).toBe('Add Filter');
  });

  it('full text filter should be compact outlined field', () => {

    // given
    component.showFullTextFilter = true;

    // when
    fixture.detectChanges();

    // then
    const field: HTMLElement = fixture.nativeElement.querySelector('.full_text_filter');
    expect(field.classList).toContain('mat-form-field-appearance-outline');
    expect(field.querySelector<HTMLElement>('.mat-mdc-text-field-wrapper').offsetHeight).toBe(40);
  });

  it('range filters should be separated from toolbar by top border', fakeAsync(() => {

    // given
    component.addRangeFilter(column('Amount'), null);

    // when
    flush();
    fixture.detectChanges();

    // then
    const style = getComputedStyle(fixture.nativeElement.querySelector('.div_range_filters'));
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopColor).toBe('rgb(197, 202, 233)');
  }));

  it('#ngOnInit should not retain initial filters when active scene is not defeined', () => {

    // given
    getActiveSceneSpy.mockReturnValue(undefined);
    vi.spyOn(component, 'retainInitialFilters').mockReturnValue(undefined);

    // when
    component.ngOnInit();

    // then
    expect(component.retainInitialFilters).not.toHaveBeenCalled();
  });

  it('#ngOnInit should init selected time range from query when it has time defined', fakeAsync(() => {

    // given
    component.query = new Query();
    component.query.addValueRangeFilter('Time', now - 1_000, now);
    component.propertyFilters = [];
    component.rangeFilters = [];
    fixture.detectChanges();

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.propertyFilters.length).toBe(0);
    expect(component.rangeFilters.length).toBe(1);
    const timeRangeFilter = component.rangeFilters[0];
    expect(timeRangeFilter.selValueRange.min).toEqual(now - 1_000);
    expect(timeRangeFilter.selValueRange.max).toEqual(now);
  }));

  it('#ngOnInit should initialize filters when query was injected', fakeAsync(() => {

    // given
    const query = new Query();
    query.setFullTextFilter('abc');
    const levelFilter = new PropertyFilter('Level', Operator.NOT_EQUAL, '50');
    const amountFilter = new PropertyFilter('Amount', Operator.GREATER_THAN_OR_EQUAL, 'ERROR');
    query.addPropertyFilter(levelFilter);
    query.addPropertyFilter(amountFilter);
    component.query = query;
    component.propertyFilters = [];
    component.rangeFilters = [];

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.fullTextFilter).toBe('abc');
    expect(component.showFullTextFilter).toBe(true);
    expect(component.propertyFilters.length).toBe(2);
    expect(component.propertyFilters[0]).toEqual(levelFilter);
    expect(component.propertyFilters[0]).not.toBe(levelFilter);
    expect(component.propertyFilters[1]).toEqual(amountFilter);
    expect(component.propertyFilters[1]).not.toBe(amountFilter);
  }));

  it('#ngOnInit should not modify filters of injected query when filters are edited', fakeAsync(() => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'INFO'));
    query.addValueRangeFilter('Amount', 20, 80);
    component.query = query;
    component.ngOnInit();
    flush();

    // when
    component.propertyFilters[0].value = 'ERROR';
    component.addValueFilter(column('Host'));
    component.rangeFilters[0].selValueRange.min = 30;
    component.rangeFilters[0].inverted = true;

    // then
    expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'INFO')]);
    const valueRangeFilter = query.findValueRangeFilter('Amount');
    expect(valueRangeFilter.valueRange.min).toBe(20);
    expect(valueRangeFilter.valueRange.max).toBe(80);
    expect(valueRangeFilter.inverted).toBe(false);
  }));

  it('#ngOnInit should hide full text filter when query has none', () => {

    // given
    component.query = new Query();

    // when
    component.ngOnInit();

    // then
    expect(component.showFullTextFilter).toBe(false);
  });

  it('#ngOnInit should define current url of route', () => {

    // given
    component.route = Route.RAWDATA;
    component.tabId = undefined;

    // when
    component.ngOnInit();

    // then
    expect(component.currURL).toBe('/' + Route.RAWDATA);
  });

  it('#ngOnInit should define current url of tab', () => {

    // given
    component.route = Route.GRID;
    component.tabId = 'tab3';

    // when
    component.ngOnInit();

    // then
    expect(component.currURL).toBe('/view/tab3');
  });

  it('#ngOnChanges should keep restored query filters for initialization when invoked before #ngOnInit', () => {

    // given
    const toolbar = TestBed.createComponent(MainToolbarComponent).componentInstance;
    const query = new Query();
    query.setFullTextFilter('abc');
    query.addValueRangeFilter('Time', now - 1_000, now);
    toolbar.restoredQuery = query;

    // when
    toolbar.ngOnChanges({ restoredQuery: new SimpleChange(undefined, query, true) });

    // then
    expect(toolbar.query).toBe(query);
    expect(toolbar.fullTextFilter).toBe('');
  });

  it('#ngOnChanges should retain filters of restored query when invoked after #ngOnInit', () => {

    // given
    const query = new Query();
    query.setFullTextFilter('abc');
    component.restoredQuery = query;

    // when
    component.ngOnChanges({ restoredQuery: new SimpleChange(undefined, query, false) });

    // then
    expect(component.query).toBe(query);
    expect(component.fullTextFilter).toBe('abc');
  });

  it('#ngOnChanges should hide range filters when restored query has none', () => {

    // given
    component.showRangeFilters = true;
    component.restoredQuery = new Query();

    // when
    component.ngOnChanges({ restoredQuery: new SimpleChange(undefined, component.restoredQuery, false) });

    // then
    expect(component.showRangeFilters).toBe(false);
  });

  it('#ngOnChanges should keep query when restored query changed to null', () => {

    // given
    const query = component.query;
    component.restoredQuery = null;

    // when
    component.ngOnChanges({ restoredQuery: new SimpleChange(new Query(), null, false) });

    // then
    expect(component.query).toBe(query);
  });

  it('#ngOnChanges should keep query when other input changed', () => {

    // given
    const query = component.query;
    component.restoredQuery = new Query();

    // when
    component.ngOnChanges({ route: new SimpleChange(Route.GRID, Route.FLEX, false) });

    // then
    expect(component.query).toBe(query);
  });

  it('#ngOnDestroy should stop listening on navigation events', fakeAsync(() => {

    // given
    const events = new Subject<RouterEvent>();
    component.router = { events } as unknown as Router;
    component.ngOnInit();

    // when
    component.ngOnDestroy();

    // then
    expect(events.observed).toBe(false);
  }));

  it('#ngAfterViewChecked should re-create time slider options once the tab became active', fakeAsync(() => {

    // given
    component.route = Route.GRID;
    component.tabId = 'tab1';
    const event: RouterEvent = new NavigationEnd(0, '/view/tab1', '/view/tab1');
    component.router = { events: of(event) } as Router;
    const timeRangeFilter = new TimeRangeFilter(column('Time'), valueRange.min, valueRange.max, null, false);
    const prevSliderOptions = timeRangeFilter.sliderOptions;
    component.rangeFilters = [timeRangeFilter];
    expect(prevSliderOptions).toBeTruthy();
    component.ngOnInit();
    vi.spyOn(component.rangeFilters[0], 'defineSliderOptions').mockReturnValue(undefined);

    // when
    component.ngAfterViewChecked();
    component.ngAfterViewChecked();
    component.ngAfterViewChecked();
    flush();

    // then
    expect(component.rangeFilters[0].defineSliderOptions).toHaveBeenCalledTimes(1);
  }));

  it('#ngAfterViewChecked should not re-create time slider options when another tab became active', fakeAsync(() => {

    // given
    component.route = Route.GRID;
    component.tabId = 'tab1';
    const event: RouterEvent = new NavigationEnd(0, '/view/tab2', '/view/tab2');
    component.router = { events: of(event) } as Router;
    component.rangeFilters = [new TimeRangeFilter(column('Time'), valueRange.min, valueRange.max, null, false)];
    component.ngOnInit();
    vi.spyOn(component.rangeFilters[0], 'defineSliderOptions').mockReturnValue(undefined);

    // when
    component.ngAfterViewChecked();
    flush();

    // then
    expect(component.rangeFilters[0].defineSliderOptions).not.toHaveBeenCalled();
  }));

  it('#click on "Show Scene Details" button should show scene details', fakeAsync(() => {

    // given
    vi.spyOn(dialogService, 'showSceneDetailsDialog').mockReturnValue(undefined);
    const button: HTMLButtonElement = fixture.debugElement.query(By.css('#butShowSceneDetails')).nativeElement;

    // when
    button.click();
    flush();

    // then
    expect(dialogService.showSceneDetailsDialog).toHaveBeenCalledWith(scene);
  }));

  it('#refreshEntries should not emit filter change when number filter is invalid', () => {

    // given
    component.addValueFilter(column('Amount'));
    component.propertyFilters[0].value = 'x';
    vi.spyOn(component.onFilterChange, 'emit').mockReturnValue(undefined);

    // when
    component.refreshEntries();

    // then
    expect(component.onFilterChange.emit).not.toHaveBeenCalled();
  });

  it('#refreshEntries should emit filter change with no time', () => {

    // given
    component.query = new Query();
    component.query.addValueRangeFilter('Time', now - 1_000, now);
    const onFilterChangeEmitSpy = vi.spyOn(component.onFilterChange, 'emit').mockReturnValue(undefined);

    // when
    component.refreshEntries();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query: Query = vi.mocked(onFilterChangeEmitSpy).mock.lastCall[0];
    expect(query.findValueRangeFilter('Time')).toBeUndefined();
  });

  it('#refreshEntries should emit filter change with time', () => {

    // given
    component.query = new Query();
    const timeRangeFilter = new TimeRangeFilter(column('Time'), valueRange.min, valueRange.max, null, false);
    timeRangeFilter.selValueRange.min = valueRange.min + 1000;
    timeRangeFilter.selValueRange.max = valueRange.max - 1000;
    component.rangeFilters = [timeRangeFilter];
    const onFilterChangeEmitSpy = vi.spyOn(component.onFilterChange, 'emit').mockReturnValue(undefined);

    // when
    component.refreshEntries();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query: Query = vi.mocked(onFilterChangeEmitSpy).mock.lastCall[0];
    const valueRangeFilter = query.findValueRangeFilter('Time');
    expect(valueRangeFilter).toBeDefined();
    expect(valueRangeFilter.valueRange.min).toBe(valueRange.min + 1000);
    expect(valueRangeFilter.valueRange.max).toBe(valueRange.max - 1000);
  });

  it('pressing non-<enter> key in full text filter field should not emit onFilterChange', () => {

    // given
    component.showFullTextFilter = true;
    fixture.detectChanges();
    const htmlInput: HTMLInputElement = fixture.debugElement.query(By.css('#fullTextFilter')).nativeElement;
    htmlInput.value = 'abc';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    vi.spyOn(component.onFilterChange, 'emit').mockReturnValue(undefined);

    // when
    const event = document.createEvent('Event') as Event & { key: string };
    event.key = 'x';
    event.initEvent('keyup');
    htmlInput.dispatchEvent(event);

    // then
    expect(component.onFilterChange.emit).not.toHaveBeenCalled();
  });

  it('pressing <enter> in full text filter field should emit onFilterChange', () => {

    // given
    component.showFullTextFilter = true;
    fixture.detectChanges();
    const htmlInput: HTMLInputElement = fixture.debugElement.query(By.css('#fullTextFilter')).nativeElement;
    htmlInput.value = 'abc';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const onFilterChangeEmitSpy = vi.spyOn(component.onFilterChange, 'emit').mockReturnValue(undefined);

    // when
    const event = document.createEvent('Event') as Event & { key: string };
    event.key = 'Enter';
    event.initEvent('keyup');
    htmlInput.dispatchEvent(event);

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query: Query = vi.mocked(onFilterChangeEmitSpy).mock.lastCall[0];
    expect(query.getFullTextFilter()).toBe('abc');
    expect(query.getPropertyFilters().length).toBe(0);
    expect(query.getValueRangeFilters().length).toBe(0);
  });

  it('pressing <clear> button in full text filter field should emit onFilterChange', () => {

    // given
    component.showFullTextFilter = true;
    fixture.detectChanges();
    const htmlInput: HTMLInputElement = fixture.debugElement.query(By.css('#fullTextFilter')).nativeElement;
    htmlInput.value = 'abc';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const onFilterChangeEmitSpy = vi.spyOn(component.onFilterChange, 'emit').mockReturnValue(undefined);
    const clearButton: HTMLButtonElement = fixture.debugElement.query(By.css('#clearFullTextFilterButton')).nativeElement;

    // when
    clearButton.click();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query = vi.mocked(onFilterChangeEmitSpy).mock.lastCall[0];
    expect(query.hasFilter()).toBe(false);
    expect(component.showFullTextFilter).toBe(false);
  });

  it('#addValueFilter should add EQUAL filter for boolean column', fakeAsync(() => {

    // given
    component.propertyFilters = [];

    // when
    component.addValueFilter(column('Paid'));

    // then
    expect(component.propertyFilters).toEqual([new PropertyFilter('Paid', Operator.EQUAL, true, DataType.BOOLEAN)]);
  }));

  it('#addValueFilter should add EQUAL filter for number column', fakeAsync(() => {

    // given
    component.propertyFilters = [];

    // when
    component.addValueFilter(column('Amount'));

    // then
    expect(component.propertyFilters).toEqual([new PropertyFilter('Amount', Operator.EQUAL, '', DataType.NUMBER)]);
  }));

  it('#addValueFilter should add NOT_EMPTY filter for time column', fakeAsync(() => {

    // given
    component.propertyFilters = [];

    // when
    component.addValueFilter(column('Time'));

    // then
    expect(component.propertyFilters).toEqual([new PropertyFilter('Time', Operator.NOT_EMPTY, '', DataType.TIME)]);
  }));

  it('selecting "add column filter" menu item should add non-time column filter', fakeAsync(() => {

    // given
    component.propertyFilters = [];

    // when
    addLevelFilterThroughMenu();

    // then
    expect(component.propertyFilters.length).toBe(1);
  }));

  it('#removeColumnFilter should emit onFilterChange when removed filter was effective', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, 'ERROR');
    component.propertyFilters = [columnFilter];
    const onFilterChangeEmitSpy = vi.spyOn(component.onFilterChange, 'emit').mockReturnValue(undefined);

    // when
    component.removePropertyFilter(columnFilter);

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query = vi.mocked(onFilterChangeEmitSpy).mock.lastCall[0];
    expect(query.hasFilter()).toBe(false);
  });

  it('#removeColumnFilter should not emit onFilterChange when removed filter was not effective', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, '');
    component.propertyFilters = [columnFilter];
    vi.spyOn(component.onFilterChange, 'emit').mockReturnValue(undefined);

    // when
    component.removePropertyFilter(columnFilter);

    // then
    expect(component.onFilterChange.emit).not.toHaveBeenCalled();
  });

  it('#addRangeFilter should add time range filter when TIME column', fakeAsync(() => {

    // when
    component.addRangeFilter(column('Time'), null, false);
    flush();

    // then
    expect(component.rangeFilters.length).toBe(1);
    expect(component.rangeFilters[0] instanceof TimeRangeFilter).toBe(true);
    const timeRangeFilter = component.rangeFilters[0];
    expect(timeRangeFilter.start).toBe(valueRange.min);
    expect(timeRangeFilter.end).toBe(valueRange.max);
  }));

  it('#addRangeFilter should add time range filter when TIME column', fakeAsync(() => {

    // when
    component.addRangeFilter(column('Amount'), null, false);
    flush();

    // then
    expect(component.rangeFilters.length).toBe(1);
    expect(component.rangeFilters[0] instanceof NumberRangeFilter).toBe(true);
    const numberRangeFilter = component.rangeFilters[0];
    expect(numberRangeFilter.start).toBe(valueRange.min);
    expect(numberRangeFilter.end).toBe(valueRange.max);
  }));

  it('#addRangeFilter should notify error when value range cannot be read', fakeAsync(() => {

    // given
    vi.spyOn(dbService, 'numberRangeOf').mockRejectedValue('cannot read');
    vi.spyOn(component, 'notifyError').mockReturnValue(undefined);

    // when
    component.addRangeFilter(column('Amount'), null, false);
    flush();

    // then
    expect(component.notifyError).toHaveBeenCalledWith('cannot read');
    expect(component.rangeFilters.length).toBe(0);
  }));

  it('#onStepChanged should change time step when millisecond is selected', fakeAsync(() => {

    // given
    component.addRangeFilter(column('Time'), null, false);
    flush();

    // when
    component.rangeFilters[0].onStepChanged(TimeUnit.MILLISECOND);
    fixture.detectChanges();

    // then
    flush();
    expect(component.rangeFilters[0].selectedStep).toBe(TimeUnit.MILLISECOND);
    expect(component.rangeFilters[0].selectedStepAbbrev).toBe('ms');
    expect(component.rangeFilters[0].sliderOptions.step).toBe(1);
  }));

  it('#onStepChanged should change time step when second is selected', fakeAsync(() => {

    // given
    component.addRangeFilter(column('Time'), null, false);
    flush();

    // when
    component.rangeFilters[0].onStepChanged(TimeUnit.SECOND);

    // then
    expect(component.rangeFilters[0].selectedStep).toBe(TimeUnit.SECOND);
    expect(component.rangeFilters[0].selectedStepAbbrev).toBe('s');
  }));

  it('#onStepChanged should change time step when minute is selected', fakeAsync(() => {

    // given
    component.addRangeFilter(column('Time'), null, false);
    flush();

    // when
    component.rangeFilters[0].onStepChanged(TimeUnit.MINUTE);

    // then
    expect(component.rangeFilters[0].selectedStep).toBe(TimeUnit.MINUTE);
    expect(component.rangeFilters[0].selectedStepAbbrev).toBe('m');
  }));

  it('#onStepChanged should change time step when hour is selected', fakeAsync(() => {

    // given
    component.addRangeFilter(column('Time'), null, false);
    flush();

    // when
    component.rangeFilters[0].onStepChanged(TimeUnit.HOUR);

    // then
    expect(component.rangeFilters[0].selectedStep).toBe(TimeUnit.HOUR);
    expect(component.rangeFilters[0].selectedStepAbbrev).toBe('h');
  }));

  it('#removeRangeFilter should refresh entries when range filter was filtered', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false);
    component.rangeFilters = [rangeFilter];
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.refreshEntries).toHaveBeenCalled();
  });

  it('#removeRangeFilter should refresh entries when range filter was inverted only', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 1, max: 10 }, true);
    component.rangeFilters = [rangeFilter];
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.refreshEntries).toHaveBeenCalled();
  });

  it('#removeRangeFilter should not refresh entries when range filter was not filtered', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 1, max: 10 }, false);
    component.rangeFilters = [rangeFilter];
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.refreshEntries).not.toHaveBeenCalled();
  });

  it('#removeRangeFilter should hide range filters when the last one was removed', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false);
    component.rangeFilters = [rangeFilter];
    component.showRangeFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.showRangeFilters).toBe(false);
  });

  it('#removeRangeFilter should keep range filters shown when others remain', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false);
    const otherRangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 3, max: 4 }, false);
    component.rangeFilters = [rangeFilter, otherRangeFilter];
    component.showRangeFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.showRangeFilters).toBe(true);
  });

  function createScene(id: string, context: ContextInfo[], columns: Column[]): Scene {
    return {
      _id: id,
      creationTime: now,
      name: 'Scene ' + id,
      shortDescription: 'Scene ' + id + ' Short Description',
      context: context,
      columns: columns,
      database: 'test_data_' + id,
      columnMappings: undefined,
      config: {
        records: [],
        views: []
      }
    };
  }

  function addLevelFilterThroughMenu(): void {
    const menuTrigger: HTMLSpanElement = fixture.debugElement.query(
      By.css('.but_add_col_filter')).nativeElement;
    menuTrigger.click()
    flush();
    fixture.detectChanges();

    const butColumn: HTMLButtonElement = fixture.debugElement.queryAll(
      By.css('.menu_item_add_text_filter'))[0].nativeElement;
    butColumn.click();
    flush();
    fixture.detectChanges();
    flush();
  }

  function column(name: string): Column {
    return scene.columns.find(c => c.name === name);
  }
});
