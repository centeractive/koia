import { ComponentFixture, TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';

import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By, HAMMER_LOADER } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Event, NavigationEnd, Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxSliderModule } from 'app/ngx-slider/slider.module';
import { Column, ContextInfo, DataType, Operator, PropertyFilter, Query, Route, Scene, TimeUnit } from 'app/shared/model';
import { DialogService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { MatIconModuleMock } from 'app/shared/test';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { of } from 'rxjs';
import { MainToolbarComponent } from './main-toolbar.component';
import { NumberRangeFilter } from './range-filter/model/number-range-filter';
import { TimeRangeFilter } from './range-filter/model/time-range-filter';

@Component({
    template: '',
    standalone: false
})
class DummyComponent { }

describe('MainToolbarComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: object[];
  let valueRange: ValueRange;
  let component: MainToolbarComponent;
  let fixture: ComponentFixture<MainToolbarComponent>;
  const dbService = new DBService(null);
  const dialogService = new DialogService(null);
  let getActiveSceneSpy: jasmine.Spy;

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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [MainToolbarComponent, DummyComponent],
      imports: [
        MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, ReactiveFormsModule,
        MatFormFieldModule, MatSelectModule, MatInputModule, MatMenuModule, NgxSliderModule, BrowserAnimationsModule,
        RouterTestingModule, RouterModule.forRoot([{ path: '**', component: DummyComponent }], {})
      ],
      providers: [
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => null) }
      ]
    })
      .overrideModule(MatIconModule, MatIconModuleMock.override())
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(MainToolbarComponent);
    component = fixture.componentInstance;
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    spyOn(dbService, 'numberRangeOf').and.resolveTo(valueRange);
    spyOn(dbService, 'findEntries').and.returnValue(of(entries));
    fixture.detectChanges();
    flush();
    spyOn(component.router, 'navigate');
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load active scene data', () => {
    expect(dbService.getActiveScene).toHaveBeenCalled();
  });

  it('#ngOnInit should not retain initial filters when active scene is not defeined', () => {

    // given
    getActiveSceneSpy.and.returnValue(undefined);
    spyOn(component, 'retainInitialFilters');

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
    expect(component.propertyFilters.length).toBe(2);
    expect(component.propertyFilters[0]).toBe(levelFilter);
    expect(component.propertyFilters[1]).toBe(amountFilter);
  }));

  it('#ngAfterViewChecked should re-create time slider options once the view became active', fakeAsync(() => {

    // given
    component.route = Route.GRID;
    const event: Event = new NavigationEnd(0, '/' + Route.GRID, '/' + Route.GRID);
    component.router = { events: of(event) } as Router;
    const timeRangeFilter = new TimeRangeFilter(column('Time'), valueRange.min, valueRange.max, null, false);
    const prevSliderOptions = timeRangeFilter.sliderOptions;
    component.rangeFilters = [timeRangeFilter];
    expect(prevSliderOptions).toBeTruthy();
    component.ngOnInit();
    spyOn(component.rangeFilters[0], 'defineSliderOptions');

    // when
    component.ngAfterViewChecked();
    component.ngAfterViewChecked();
    component.ngAfterViewChecked();
    flush();

    // then
    expect(component.rangeFilters[0].defineSliderOptions).toHaveBeenCalledTimes(1);
  }));

  it('#click on "Show Scene Details" button should show scene details', fakeAsync(() => {

    // given
    spyOn(dialogService, 'showSceneDetailsDialog');
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
    spyOn(component.onFilterChange, 'emit');

    // when
    component.refreshEntries();

    // then
    expect(component.onFilterChange.emit).not.toHaveBeenCalled();
  });

  it('#refreshEntries should emit filter change with no time', () => {

    // given
    component.query = new Query();
    component.query.addValueRangeFilter('Time', now - 1_000, now);
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');

    // when
    component.refreshEntries();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query: Query = onFilterChangeEmitSpy.calls.mostRecent().args[0];
    expect(query.findValueRangeFilter('Time')).toBeUndefined();
  });

  it('#refreshEntries should emit filter change with time', () => {

    // given
    component.query = new Query();
    const timeRangeFilter = new TimeRangeFilter(column('Time'), valueRange.min, valueRange.max, null, false);
    timeRangeFilter.selValueRange.min = valueRange.min + 1000;
    timeRangeFilter.selValueRange.max = valueRange.max - 1000;
    component.rangeFilters = [timeRangeFilter];
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');

    // when
    component.refreshEntries();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query: Query = onFilterChangeEmitSpy.calls.mostRecent().args[0];
    const valueRangeFilter = query.findValueRangeFilter('Time');
    expect(valueRangeFilter).toBeDefined();
    expect(valueRangeFilter.valueRange.min).toBe(valueRange.min + 1000);
    expect(valueRangeFilter.valueRange.max).toBe(valueRange.max - 1000);
  });

  it('raw data tab should point to raw data view', () => {

    // given
    const tab: HTMLAnchorElement = fixture.debugElement.query(By.css('#tabRawData')).nativeElement;

    // when
    const link = tab.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.RAWDATA);
  });

  it('pivot view tab should point to pivot view', () => {

    // given
    const tab: HTMLAnchorElement = fixture.debugElement.query(By.css('#tabPivotTable')).nativeElement;

    // when
    const link = tab.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.PIVOT);
  });

  it('grid view tab should point to grid view', () => {

    // given
    const tab: HTMLAnchorElement = fixture.debugElement.query(By.css('#tabGridView')).nativeElement;

    // when
    const link = tab.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.GRID);
  });

  it('flex view tab should point to flex view', () => {

    // given
    const tab: HTMLAnchorElement = fixture.debugElement.query(By.css('#tabFlexView')).nativeElement;

    // when
    const link = tab.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.FLEX);
  });

  it('pressing non-<enter> key in full text filter field should not emit onFilterChange', () => {

    // given
    component.showFullTextFilter = true;
    fixture.detectChanges();
    const htmlInput: HTMLInputElement = fixture.debugElement.query(By.css('#fullTextFilter')).nativeElement;
    htmlInput.value = 'abc';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    spyOn(component.onFilterChange, 'emit');

    // when
    const event: any = document.createEvent('Event');
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
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');

    // when
    const event: any = document.createEvent('Event');
    event.key = 'Enter';
    event.initEvent('keyup');
    htmlInput.dispatchEvent(event);

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query: Query = onFilterChangeEmitSpy.calls.mostRecent().args[0];
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
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');
    const clearButton: HTMLButtonElement = fixture.debugElement.query(By.css('#clearFullTextFilterButton')).nativeElement;

    // when
    clearButton.click();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query = onFilterChangeEmitSpy.calls.mostRecent().args[0];
    expect(query.hasFilter()).toBeFalse();
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
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');

    // when
    component.removePropertyFilter(columnFilter);

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query = onFilterChangeEmitSpy.calls.mostRecent().args[0];
    expect(query.hasFilter()).toBeFalse();
  });

  it('#removeColumnFilter should not emit onFilterChange when removed filter was not effective', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, '');
    component.propertyFilters = [columnFilter];
    spyOn(component.onFilterChange, 'emit');

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
    expect(component.rangeFilters[0] instanceof TimeRangeFilter).toBeTrue();
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
    expect(component.rangeFilters[0] instanceof NumberRangeFilter).toBeTrue();
    const numberRangeFilter = component.rangeFilters[0];
    expect(numberRangeFilter.start).toBe(valueRange.min);
    expect(numberRangeFilter.end).toBe(valueRange.max);
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
    spyOn(component, 'refreshEntries');

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.refreshEntries).toHaveBeenCalled();
  });

  it('#removeRangeFilter should not refresh entries when range filter was not filtered', () => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 1, max: 10 }, false);
    component.rangeFilters = [rangeFilter];
    spyOn(component, 'refreshEntries');

    // when
    component.removeRangeFilter(rangeFilter);

    // then
    expect(component.refreshEntries).not.toHaveBeenCalled();
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
      By.css('#butAddColFilter')).nativeElement;
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
