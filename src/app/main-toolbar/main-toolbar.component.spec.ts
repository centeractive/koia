import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { Component, NO_ERRORS_SCHEMA, ChangeDetectionStrategy, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, TestModuleMetadata, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
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
import { Column, ComputeOperator, ContextInfo, DataType, Operator, PropertyFilter, Query, Route, Scene, TimeUnit } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { TabDef, ViewType } from 'app/shared/model/view-config';
import { SavedViewsService } from 'app/shared/services/saved-views';
import { LinkedFiltersService, ViewTabsService } from 'app/shared/services/view-tabs';
import { LinkedFiltersServiceMock, MatIconModuleMock, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { of, Subject } from 'rxjs';
import { rightInsetOf, rowCountOf, verticalCenterOf } from 'app/shared/test/dom-queries';
import { LanguageSelectComponent } from 'app/shared/ui/language-select/language-select.component';
import { ManualLinkComponent } from 'app/shared/ui/manual-link/manual-link.component';
import { NavButtonsComponent } from 'app/shared/ui/nav-buttons/nav-buttons.component';
import { page } from 'vitest/browser';
import { MainToolbarComponent } from './main-toolbar.component';
import { RestoreViewMenuComponent } from './restore-view-menu/restore-view-menu.component';
import { SaveViewMenuComponent } from './save-view-menu/save-view-menu.component';
import { ViewTabBarComponent } from './view-tab-bar/view-tab-bar.component';
import { ValueFilterComponent } from './value-filter/value-filter.component';
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
    declarations: [MainToolbarComponent, DummyComponent, KoiaFormDirective, NavButtonsComponent, ...(extra.declarations ?? [])],
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
      { provide: LinkedFiltersService, useClass: LinkedFiltersServiceMock },
      ...(extra.providers ?? [])
    ]
  })
    .overrideModule(MatIconModule, MatIconModuleMock.override())
    .compileComponents();
}

describe('MainToolbarComponent with many tabs', () => {

  const dbService = new DBService(null, null);
  const dialogService = new DialogService(null);
  let fixture: ComponentFixture<MainToolbarComponent>;

  beforeEach(async () => {
    const tabs: TabDef[] = Array.from({ length: 30 }, (_, i) => ({ id: 'tab' + (i + 1), type: ViewType.DASHBOARD, title: 'Dashboard ' + (i + 1) }));
    const viewTabsService = { tabs, ready: true, layoutOf: vi.fn() } as unknown as ViewTabsService;
    const savedViewsService = { ready: true, findAll: () => [] } as unknown as SavedViewsService;
    await configureTestingModule(dbService, dialogService, {
      declarations: [ViewTabBarComponent, SaveViewMenuComponent, RestoreViewMenuComponent, LanguageSelectComponent, ManualLinkComponent, ValueFilterComponent],
      imports: [MatTabsModule, MatBadgeModule],
      providers: [{ provide: ViewTabsService, useValue: viewTabsService }, { provide: SavedViewsService, useValue: savedViewsService }]
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

  function leftOf(selector: string): number {
    return fixture.nativeElement.querySelector(selector).getBoundingClientRect().left;
  }

  function addLevelFilters(count: number): void {
    const toolbar = fixture.componentInstance;
    const level = toolbar.scene.columns.find(c => c.name === 'Level');
    Array.from({ length: count }).forEach(() => toolbar.addValueFilter(level));
  }

  function navWidth(): number {
    return fixture.nativeElement.querySelector('nav').getBoundingClientRect().width;
  }

  function expectOnSingleLine(controls: Element[]): void {
    expect(controls.length).toBe(4);
    const firstCenter = verticalCenterOf(controls[0]);
    controls.forEach((c, i) => {
      expect(verticalCenterOf(c)).toBeCloseTo(firstCenter, 0);
      if (i > 0) {
        expect(c.getBoundingClientRect().left).toBeGreaterThanOrEqual(controls[i - 1].getBoundingClientRect().right);
      }
    });
  }

  it('controls left and right of tab bar should be vertically centered with tab bar', () => {

    // given
    addLevelFilters(1);

    // when
    fixture.detectChanges();

    // then
    const root: HTMLElement = fixture.nativeElement;
    const nav = root.querySelector('nav');
    expect(nav.getBoundingClientRect().height).toBe(48);
    expect(verticalCenterOf(nav)).toBeCloseTo(verticalCenterOf(root.querySelector('.div_toolbar')), 0);
    const controls = Array.from(root.querySelectorAll('#butHome, #butShowSceneDetails, #butScenes, #butScene, '
      + '#but_save_view, #but_restore_view, .span_navigation > .koia-toolbar-separator, #butAddTab, '
      + '.but_add_col_filter, #butToggleFilters, .span_buttons:not(.span_navigation) > button:last-child, #butManual, #but_language'));
    expect(controls.length).toBe(14);
    controls.forEach(c => expect(verticalCenterOf(c)).toBeCloseTo(verticalCenterOf(nav), 0));
  });

  it('should keep Add Filter button and refresh button visible when tabs exceed toolbar width', () => {

    // when
    const toolbarRight = toolbarRect().right;

    // then
    expect(rightOf('.but_add_col_filter')).toBeLessThanOrEqual(toolbarRight);
    expect(rightOf('.span_buttons:not(.span_navigation) > button:last-child')).toBeLessThanOrEqual(toolbarRight);
  });

  it('should keep manual link and language selection visible when tabs exceed toolbar width', () => {

    // when
    const languageRect = fixture.nativeElement.querySelector('#but_language').getBoundingClientRect();

    // then
    expect(languageRect.right).toBeLessThanOrEqual(toolbarRect().right);
    expect(rightOf('#butManual')).toBeLessThanOrEqual(languageRect.left);
  });

  it('should enable tab pagination when tabs exceed toolbar width', () => {

    // when
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');

    // then
    expect(nav.classList).toContain('mat-mdc-tab-header-pagination-controls-enabled');
  });

  it('adding value filter should show it in row below toolbar with tab bar touching bottom of toolbar', () => {

    // given
    addLevelFilters(1);

    // when
    fixture.detectChanges();

    // then
    const filter: HTMLElement = fixture.nativeElement.querySelector('.div_value_filters .div_property_filter');
    expect(filter.getBoundingClientRect().top).toBeGreaterThanOrEqual(toolbarRect().bottom);
    const navRect: DOMRect = fixture.nativeElement.querySelector('nav').getBoundingClientRect();
    expect(navRect.bottom).toBeCloseTo(toolbarRect().bottom, 0);
  });

  it('many value filters should wrap to further rows with each filter on one row', () => {

    // given
    addLevelFilters(10);

    // when
    fixture.detectChanges();

    // then
    const root: HTMLElement = fixture.nativeElement;
    const filters: HTMLElement[] = Array.from(root.querySelectorAll('.div_value_filters .div_property_filter'));
    expect(filters.length).toBe(10);
    expect(rowCountOf(root, '.span_column_filter')).toBeGreaterThan(1);
    const rowRight = root.querySelector('.div_value_filters').getBoundingClientRect().right;
    const spans = Array.from(root.querySelectorAll('.span_column_filter')).map(s => s.getBoundingClientRect());
    spans.forEach(s => expect(s.right).toBeLessThanOrEqual(rowRight));
    filters.forEach(f => expectOnSingleLine(Array.from(f.querySelectorAll(':scope > :not(mat-menu)'))));
    expect(spans[1].top).toBe(spans[0].top);
    expect(spans[1].left - spans[0].right).toBeCloseTo(20, 0);
  });

  it('Add Filter button should keep 20px distance to tab bar when tabs exceed toolbar width', () => {

    // when
    const distance = leftOf('.but_add_col_filter') - rightOf('.span_navigation');

    // then
    expect(distance).toBeCloseTo(20, 0);
  });

  it('should keep tab bar width when value filters are added', () => {

    // given
    addLevelFilters(1);
    fixture.detectChanges();
    const widthBefore = navWidth();

    // when
    addLevelFilters(9);
    fixture.detectChanges();

    // then
    expect(navWidth()).toBe(widthBefore);
  });

  it('filters toggle should show filter icon with number of filters as badge', () => {

    // given
    addLevelFilters(3);

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('#butToggleFilters mat-icon').textContent.startsWith('filter_alt')).toBe(true);
    expect(fixture.nativeElement.querySelector('#butToggleFilters .mat-badge-content').textContent).toBe('3');
  });

  it('should keep add tab button visible', () => {

    // when
    const toolbarRight = toolbarRect().right;

    // then
    expect(rightOf('#butAddTab')).toBeLessThanOrEqual(toolbarRight);
  });

  it('should keep save and restore view button size when tabs exceed toolbar width', () => {

    // when
    const widths = ['#but_save_view', '#but_restore_view'].map(id => fixture.nativeElement.querySelector(id).getBoundingClientRect().width);

    // then
    const detailsWidth = fixture.nativeElement.querySelector('#butShowSceneDetails').getBoundingClientRect().width;
    expect(widths).toEqual([detailsWidth, detailsWidth]);
  });

  it('save view menu should get scene and tab of toolbar', () => {

    // given
    fixture.componentRef.setInput('tabId', 'tab3');

    // when
    fixture.detectChanges();

    // then
    const menu: SaveViewMenuComponent = fixture.debugElement.query(By.directive(SaveViewMenuComponent)).componentInstance;
    expect(menu.sceneId).toBe('1');
    expect(menu.activeTabId).toBe('tab3');
  });
});

describe('MainToolbarComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: object[];
  let valueRange: ValueRange;
  let component: MainToolbarComponent;
  let fixture: ComponentFixture<MainToolbarComponent>;
  const dbService = new DBService(null, null);
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

  beforeEach(waitForAsync(() => configureTestingModule(dbService, dialogService, { declarations: [LanguageSelectComponent, ManualLinkComponent] })));

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

  it('navigation buttons should be separated from save view menu by divider', () => {

    // when
    const separator: HTMLElement = fixture.nativeElement.querySelectorAll('.span_navigation > .koia-toolbar-separator')[0];

    // then
    expect(separator.previousElementSibling.tagName).toBe('KOIA-NAV-BUTTONS');
    expect(separator.nextElementSibling.tagName).toBe('KOIA-SAVE-VIEW-MENU');
  });

  it('scene details button should be shown between home and scenes buttons', () => {

    // when
    const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('koia-nav-buttons > button'));

    // then
    expect(buttons.map(b => b.id)).toEqual(['butHome', 'butShowSceneDetails', 'butScenes', 'butScene']);
  });

  it('manual link should be shown directly left of language selection', () => {

    // when
    const manualLink = fixture.nativeElement.querySelector('.span_language > koia-manual-link + koia-language-select');

    // then
    expect(manualLink).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#butManual')).toBeTruthy();
  });

  describe('on desktop', () => {

    beforeAll(() => page.viewport(1280, 800));

    afterAll(() => page.viewport(414, 896));

    it('language selection should be at right end of toolbar', () => {

      // when
      const inset = rightInsetOf(fixture.nativeElement.querySelector('#but_language'), fixture.nativeElement.querySelector('.div_toolbar'));

      // then
      expect(inset).toBe(8);
    });

    it('filter buttons should be at right end of toolbar in dialog style', () => {

      // given
      fixture.componentRef.setInput('dialogStyle', true);

      // when
      fixture.detectChanges();

      // then
      const refreshButton = fixture.nativeElement.querySelector('.span_buttons:not(.span_navigation) > button:last-child');
      expect(rightInsetOf(refreshButton, fixture.nativeElement.querySelector('.div_toolbar'))).toBe(8);
    });

    it('toolbar should not reserve tab height in dialog style', () => {

      // given
      fixture.componentRef.setInput('dialogStyle', true);

      // when
      fixture.detectChanges();

      // then
      const toolbarHeight = fixture.nativeElement.querySelector('.div_toolbar').getBoundingClientRect().height;
      const buttonsHeight = fixture.nativeElement.querySelector('.span_buttons:not(.span_navigation)').getBoundingClientRect().height;
      expect(toolbarHeight).toBe(buttonsHeight);
      expect(toolbarHeight).toBe(40);
    });
  });

  it('save and restore view menus should be separated from tab bar by divider', () => {

    // when
    const saveViewMenu: HTMLElement = fixture.nativeElement.querySelector('koia-save-view-menu');

    // then
    const restoreViewMenu = saveViewMenu.nextElementSibling;
    const separator = restoreViewMenu.nextElementSibling;
    expect(restoreViewMenu.tagName).toBe('KOIA-RESTORE-VIEW-MENU');
    expect(separator.classList).toContain('koia-toolbar-separator');
    expect(separator.nextElementSibling.tagName).toBe('KOIA-VIEW-TAB-BAR');
  });

  it('add filter button should be accent icon button showing add filter icon', () => {

    // when
    const button: HTMLElement = fixture.nativeElement.querySelector('.but_add_col_filter');

    // then
    expect(button.querySelector('mat-icon').getAttribute('svgIcon')).toBe('add_filter');
    expect(button.classList).toContain('mat-mdc-icon-button');
    expect(button.classList).toContain('mat-accent');
    expect(button.getAttribute('aria-label')).toBe('Add Filter');
    expect(button.textContent.trim()).toBe('');
  });

  it('full text filter should be compact outlined field', () => {

    // given
    component.showFullTextFilter = true;
    component.showFilters = true;

    // when
    fixture.detectChanges();

    // then
    const field: HTMLElement = fixture.nativeElement.querySelector('.full_text_filter');
    expect(field.classList).toContain('mat-form-field-appearance-outline');
    expect(field.querySelector<HTMLElement>('.mat-mdc-text-field-wrapper').offsetHeight).toBe(40);
  });

  it('filters should be separated from toolbar by top border', fakeAsync(() => {

    // given
    component.addRangeFilter(column('Amount'), null);

    // when
    flush();
    fixture.detectChanges();

    // then
    const style = getComputedStyle(fixture.nativeElement.querySelector('.div_filters'));
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopColor).toBe('rgb(197, 202, 233)');
  }));

  it('range filter row should not be separated from value filter row by line', fakeAsync(() => {

    // given
    component.addValueFilter(column('Level'));
    component.addRangeFilter(column('Amount'), null);

    // when
    flush();
    fixture.detectChanges();

    // then
    const filters: HTMLElement = fixture.nativeElement.querySelector('.div_filters');
    const rows = ['.div_value_filters', '.div_range_filters'].map(selector => filters.querySelector(selector));
    expect(rows.map(row => getComputedStyle(row).borderTopWidth)).toEqual(['0px', '0px']);
  }));

  it('should not show value filter row when only range filters exist', fakeAsync(() => {

    // given
    component.addRangeFilter(column('Amount'), null);

    // when
    flush();
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('.div_value_filters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.div_range_filters')).not.toBeNull();
  }));

  it('should not show range filter row when only value filters exist', () => {

    // given
    component.addValueFilter(column('Level'));

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('.div_range_filters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.div_value_filters')).not.toBeNull();
  });

  it('should show full text filter in value filter row', () => {

    // given
    component.showFullTextFilter = true;
    component.showFilters = true;

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('.div_value_filters .full_text_filter')).not.toBeNull();
  });

  it('should not show filters toggle without filters', () => {

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('#butToggleFilters')).toBeNull();
  });

  it('#filterCount should count shown full text filter, value filters and range filters', () => {

    // given
    component.showFullTextFilter = true;
    component.propertyFilters = [new PropertyFilter('Level', Operator.EQUAL, 'INFO'), new PropertyFilter('Host', Operator.EQUAL, 'server1')];
    component.rangeFilters = [new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false)];

    // when
    const count = component.filterCount();

    // then
    expect(count).toBe(4);
  });

  it('#filterCount should not count hidden full text filter', () => {

    // given
    component.showFullTextFilter = false;
    component.fullTextFilter = 'abc';
    component.propertyFilters = [];
    component.rangeFilters = [];

    // when
    const count = component.filterCount();

    // then
    expect(count).toBe(0);
  });

  it('#click on filters toggle should hide all filters', fakeAsync(() => {

    // given
    showAllKindsOfFilters();

    // when
    toggleFilters();

    // then
    expect(fixture.nativeElement.querySelector('.div_value_filters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.div_range_filters')).toBeNull();
    expect(component.showFilters).toBe(false);
    expect(fixture.nativeElement.querySelector('#butToggleFilters').getAttribute('aria-label')).toBe('Show filters');
  }));

  it('#click on filters toggle should show hidden filters', fakeAsync(() => {

    // given
    showAllKindsOfFilters();
    toggleFilters();

    // when
    toggleFilters();

    // then
    expect(fixture.nativeElement.querySelector('.div_value_filters')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.div_range_filters')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#butToggleFilters').getAttribute('aria-label')).toBe('Hide filters');
  }));

  it('#addValueFilter should show filters', () => {

    // given
    component.showFilters = false;

    // when
    component.addValueFilter(column('Level'));

    // then
    expect(component.showFilters).toBe(true);
  });

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

  it('#ngOnInit should retain range filters matching empty values', fakeAsync(() => {

    // given
    const query = new Query();
    query.addValueRangeFilter('Time', now - 1_000, now, true, true, true);
    query.addValueRangeFilter('Amount', 20, 80, true, true, true);
    component.query = query;
    component.rangeFilters = [];

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.rangeFilters.map(f => f.orEmpty)).toEqual([true, true]);
    expect(component.rangeFilters[0]).toBeInstanceOf(TimeRangeFilter);
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

  it('#ngOnInit should show filters when query has value filter', () => {

    // given
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'INFO'));
    component.query = query;

    // when
    component.ngOnInit();

    // then
    expect(component.showFilters).toBe(true);
  });

  it('#ngOnInit should show filters when query has full text filter', () => {

    // given
    const query = new Query();
    query.setFullTextFilter('abc');
    component.query = query;

    // when
    component.ngOnInit();

    // then
    expect(component.showFilters).toBe(true);
  });

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

  it('#ngOnChanges should hide filters when restored query has none', () => {

    // given
    component.showFilters = true;
    component.restoredQuery = new Query();

    // when
    component.ngOnChanges({ restoredQuery: new SimpleChange(undefined, component.restoredQuery, false) });

    // then
    expect(component.showFilters).toBe(false);
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
    component.showFilters = true;
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
    component.showFilters = true;
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
    component.showFilters = true;
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

  it('#removeRangeFilter should hide filters when the last one was removed', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false);
    component.rangeFilters = [rangeFilter];
    component.showFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.showFilters).toBe(false);
  });

  it('#removeRangeFilter should keep filters shown when others remain', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false);
    const otherRangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 3, max: 4 }, false);
    component.rangeFilters = [rangeFilter, otherRangeFilter];
    component.showFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.showFilters).toBe(true);
  });

  it('#removeRangeFilter should keep filters shown when value filter remains', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false);
    component.rangeFilters = [rangeFilter];
    component.propertyFilters = [new PropertyFilter('Level', Operator.EQUAL, 'INFO')];
    component.showFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.showFilters).toBe(true);
  });

  it('#removePropertyFilter should hide filters when the last one was removed', () => {

    // given
    const propertyFilter = new PropertyFilter('Level', Operator.EQUAL, 'INFO');
    component.propertyFilters = [propertyFilter];
    component.showFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removePropertyFilter(propertyFilter);

    // then
    expect(component.showFilters).toBe(false);
  });

  it('#removePropertyFilter should keep filters shown when range filter remains', () => {

    // given
    const propertyFilter = new PropertyFilter('Level', Operator.EQUAL, 'INFO');
    component.propertyFilters = [propertyFilter];
    component.rangeFilters = [new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false)];
    component.showFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.removePropertyFilter(propertyFilter);

    // then
    expect(component.showFilters).toBe(true);
  });

  it('#resetFullTextFilter should hide filters when it was the only filter', () => {

    // given
    component.showFullTextFilter = true;
    component.fullTextFilter = 'abc';
    component.showFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.resetFullTextFilter();

    // then
    expect(component.showFilters).toBe(false);
  });

  it('#resetFullTextFilter should keep filters shown when value filter remains', () => {

    // given
    component.showFullTextFilter = true;
    component.fullTextFilter = 'abc';
    component.propertyFilters = [new PropertyFilter('Level', Operator.EQUAL, 'INFO')];
    component.showFilters = true;
    vi.spyOn(component, 'refreshEntries').mockReturnValue(undefined);

    // when
    component.resetFullTextFilter();

    // then
    expect(component.showFilters).toBe(true);
  });

  it('#filterableColumns should exclude computed columns', () => {

    // given
    component.scene = { ...scene, columns: [...scene.columns, computedColumn()] };

    // when
    const columns = component.filterableColumns();

    // then
    expect(columns).toEqual(scene.columns);
  });

  it('add filter menu should not list computed columns', fakeAsync(() => {

    // given
    component.scene = { ...scene, columns: [...scene.columns, computedColumn()] };
    fixture.detectChanges();

    // when
    fixture.debugElement.query(By.css('.but_add_col_filter')).nativeElement.click();
    flush();
    fixture.detectChanges();

    // then
    const names = fixture.debugElement.queryAll(By.css('.mat-mdc-menu-content > span > button > span'))
      .map(e => e.nativeElement.textContent.trim());
    expect(names).toEqual(['Time', 'Level', 'Host', 'Path', 'Amount', 'Paid']);
  }));

  function computedColumn(): Column {
    return {
      name: 'Share', dataType: DataType.NUMBER, width: 10, indexed: false,
      computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Amount' }
    };
  }

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
        savedViews: []
      }
    };
  }

  function showAllKindsOfFilters(): void {
    component.showFullTextFilter = true;
    component.addValueFilter(column('Level'));
    component.addRangeFilter(column('Amount'), null);
    flush();
    fixture.detectChanges();
  }

  function toggleFilters(): void {
    fixture.nativeElement.querySelector('#butToggleFilters').click();
    fixture.detectChanges();
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

  describe('linked filters', () => {

    let linked: LinkedFiltersServiceMock;

    beforeEach(() => {
      linked = TestBed.inject(LinkedFiltersService) as unknown as LinkedFiltersServiceMock;
    });

    function initAs(route: Route, tabId?: string, dialogStyle = false): void {
      component.route = route;
      component.tabId = tabId;
      component.dialogStyle = dialogStyle;
      component.ngOnInit();
      fixture.detectChanges();
    }

    function initOnUrl(route: Route, tabId: string, navigatedUrl: string, currentUrl: string): void {
      component.route = route;
      component.tabId = tabId;
      component.router = { events: navigatedUrl ? of(new NavigationEnd(0, navigatedUrl, navigatedUrl)) : of(), url: currentUrl } as unknown as Router;
      component.ngOnInit();
    }

    function toggle(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('#butLinkFilters');
    }

    function levelQuery(level: string): Query {
      return new Query(new PropertyFilter('Level', Operator.EQUAL, level, DataType.TEXT));
    }

    it('given dialog style then shows no link filters toggle', () => {

      // when
      initAs(Route.RAWDATA, undefined, true);

      // then
      expect(component.linkedFiltersKey).toBeUndefined();
      expect(toggle()).toBeNull();
    });

    it('given filters not linked then toggle shows link_off, is not active, is not pressed and offers to link', () => {

      // when
      initAs(Route.RAWDATA);

      // then
      expect(toggle().querySelector('mat-icon').textContent.trim()).toBe('link_off');
      expect(toggle().classList).not.toContain('koia-toggle-active');
      expect(toggle().getAttribute('aria-pressed')).toBe('false');
      expect(toggle().getAttribute('aria-label')).toBe('Link filters of all tabs');
      expect(toggle().disabled).toBe(false);
    });

    it('given filters linked then toggle shows link, is active, is pressed and offers to unlink', () => {

      // given
      linked.isLinked.mockReturnValue(true);

      // when
      initAs(Route.RAWDATA);

      // then
      expect(toggle().querySelector('mat-icon').textContent.trim()).toBe('link');
      expect(toggle().classList).toContain('koia-toggle-active');
      expect(toggle().getAttribute('aria-pressed')).toBe('true');
      expect(toggle().getAttribute('aria-label')).toBe('Unlink filters, every tab keeps its filters');
    });

    it('given tabs not ready then toggle is disabled', () => {

      // given
      linked.ready = false;

      // when
      initAs(Route.RAWDATA);

      // then
      expect(toggle().disabled).toBe(true);
    });

    it('#toggleLinkedFilters given not linked when clicked then links the applied filters with the tab key and emits nothing', () => {

      // given
      initAs(Route.GRID, 'tab1');
      const query = levelQuery('ERROR');
      component.query = query;
      vi.spyOn(component.onFilterChange, 'emit');

      // when
      toggle().click();

      // then
      expect(linked.link).toHaveBeenCalledWith(query, 'tab1');
      expect(component.onFilterChange.emit).not.toHaveBeenCalled();
    });

    it('#toggleLinkedFilters given not linked and no query when clicked then links empty filters', () => {

      // given
      initAs(Route.GRID, 'tab1');
      component.query = undefined;

      // when
      component.toggleLinkedFilters();

      // then
      expect(linked.link).toHaveBeenCalledWith(new Query(), 'tab1');
    });

    it('#toggleLinkedFilters given linked when clicked then unlinks', () => {

      // given
      linked.isLinked.mockReturnValue(true);
      initAs(Route.GRID, 'tab1');

      // when
      toggle().click();

      // then
      expect(linked.unlink).toHaveBeenCalled();
      expect(linked.link).not.toHaveBeenCalled();
    });

    it('#refreshEntries given valid filters then emits and then updates linked filters with the key', () => {

      // given
      initAs(Route.RAWDATA);
      component.propertyFilters = [new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)];
      vi.spyOn(component.onFilterChange, 'emit');

      // when
      component.refreshEntries();

      // then
      const query: Query = vi.mocked(component.onFilterChange.emit).mock.lastCall[0];
      expect(query.getPropertyFilters()).toEqual(component.propertyFilters);
      expect(component.query).toBe(query);
      expect(linked.update).toHaveBeenCalledWith(query, Route.RAWDATA);
      expect(vi.mocked(component.onFilterChange.emit).mock.invocationCallOrder[0]).toBeLessThan(linked.update.mock.invocationCallOrder[0]);
    });

    it('#refreshEntries given invalid filter then neither emits nor updates', () => {

      // given
      initAs(Route.RAWDATA);
      component.propertyFilters = [new PropertyFilter('Amount', Operator.EQUAL, 'x', DataType.NUMBER)];
      vi.spyOn(component.onFilterChange, 'emit');

      // when
      component.refreshEntries();

      // then
      expect(component.onFilterChange.emit).not.toHaveBeenCalled();
      expect(linked.update).not.toHaveBeenCalled();
    });

    it('#refreshEntries given dialog style then does not update linked filters', () => {

      // given
      initAs(Route.RAWDATA, undefined, true);
      vi.spyOn(component.onFilterChange, 'emit');

      // when
      component.refreshEntries();

      // then
      expect(component.onFilterChange.emit).toHaveBeenCalled();
      expect(linked.update).not.toHaveBeenCalled();
    });

    it('given raw data toolbar then the key is rawdata', () => {

      // when
      initAs(Route.RAWDATA);

      // then
      expect(component.linkedFiltersKey).toBe(Route.RAWDATA);
    });

    it('given tab toolbar then the key is the tab id', () => {

      // when
      initAs(Route.GRID, 'tab3');

      // then
      expect(component.linkedFiltersKey).toBe('tab3');
    });

    it('given toolbar of neither raw data nor tab then there is no key', () => {

      // when
      initAs(Route.SCENE);

      // then
      expect(component.linkedFiltersKey).toBeUndefined();
    });

    it('given different linked filters when navigated to own url then shows and emits them', fakeAsync(() => {

      // given
      const filters = levelQuery('ERROR');
      linked.takeFilters.mockReturnValue(filters);
      vi.spyOn(component.onFilterChange, 'emit');

      // when
      initOnUrl(Route.GRID, 'tab1', '/view/tab1', '/view/tab1');
      flush();

      // then
      expect(linked.takeFilters).toHaveBeenCalledWith('tab1');
      expect(component.query).toBe(filters);
      expect(component.propertyFilters).toEqual(filters.getPropertyFilters());
      expect(component.onFilterChange.emit).toHaveBeenCalledWith(filters);
    }));

    it('given equal linked filters when navigated to own url then emits nothing', fakeAsync(() => {

      // given
      component.query = levelQuery('ERROR');
      linked.takeFilters.mockReturnValue(levelQuery('ERROR'));
      vi.spyOn(component.onFilterChange, 'emit');

      // when
      initOnUrl(Route.GRID, 'tab1', '/view/tab1', '/view/tab1');
      flush();

      // then
      expect(linked.takeFilters).toHaveBeenCalledWith('tab1');
      expect(component.onFilterChange.emit).not.toHaveBeenCalled();
    }));

    it('given dialog style when navigated to own url then takes no filters', fakeAsync(() => {

      // given
      component.dialogStyle = true;

      // when
      initOnUrl(Route.RAWDATA, undefined, '/' + Route.RAWDATA, '/' + Route.RAWDATA);
      flush();

      // then
      expect(linked.takeFilters).not.toHaveBeenCalled();
    }));

    it('given navigation to another url then takes no filters', fakeAsync(() => {

      // when
      initOnUrl(Route.GRID, 'tab1', '/view/tab2', '/view/tab2');
      flush();

      // then
      expect(linked.takeFilters).not.toHaveBeenCalled();
    }));

    it('given own url current when loaded$ emits then syncs', fakeAsync(() => {

      // given
      const filters = levelQuery('WARN');
      linked.takeFilters.mockReturnValue(filters);
      vi.spyOn(component.onFilterChange, 'emit');
      initOnUrl(Route.RAWDATA, undefined, undefined, '/' + Route.RAWDATA);

      // when
      linked.loaded$.next();
      flush();

      // then
      expect(linked.takeFilters).toHaveBeenCalledWith(Route.RAWDATA);
      expect(component.onFilterChange.emit).toHaveBeenCalledWith(filters);
    }));

    it('given other url current when loaded$ emits then does nothing', fakeAsync(() => {

      // given
      initOnUrl(Route.RAWDATA, undefined, undefined, '/view/tab1');

      // when
      linked.loaded$.next();
      flush();

      // then
      expect(linked.takeFilters).not.toHaveBeenCalled();
    }));

    it('#ngOnDestroy then unsubscribes from loaded$', () => {

      // given
      initOnUrl(Route.RAWDATA, undefined, undefined, '/' + Route.RAWDATA);

      // when
      component.ngOnDestroy();

      // then
      expect(linked.loaded$.observed).toBe(false);
    });

    it('#retainInitialFilters given range filters loading when retained again then shows the range filters of the last retain only', fakeAsync(() => {

      // given
      const query = new Query();
      query.addValueRangeFilter('Amount', 10, 50);
      component.query = query;
      component.retainInitialFilters();

      // when
      component.retainInitialFilters();
      flush();

      // then
      expect(component.rangeFilters.length).toBe(1);
    }));

    it('#addRangeFilter given filters retained while its range loads then drops the stale range filter', fakeAsync(() => {

      // given
      component.addRangeFilter(column('Amount'), null);

      // when
      component.query = new Query();
      component.retainInitialFilters();
      flush();

      // then
      expect(component.rangeFilters).toEqual([]);
    }));
  });

  function column(name: string): Column {
    return scene.columns.find(c => c.name === name);
  }
});
