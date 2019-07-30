import { async, ComponentFixture, TestBed, flush, fakeAsync } from '@angular/core/testing';

import { MainToolbarComponent } from './main-toolbar.component';
import { NO_ERRORS_SCHEMA, Component } from '@angular/core';
import {
  MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatFormFieldModule, MatSelectModule,
  MatInputModule, MatMenuModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Ng5SliderModule } from 'ng5-slider';
import { RouterModule, Router, NavigationEnd, Event } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ContextInfo, Column, Route, PropertyFilter, Operator, Query, DataType, Scene, TimeUnit, ValueRange } from 'app/shared/model';
import { of } from 'rxjs';
import { By, HAMMER_LOADER } from '@angular/platform-browser';
import { DBService } from 'app/shared/services/backend';
import { TimeRangeFilter } from './time-range-filter';
import { MatIconModuleMock } from 'app/shared/test';

@Component({ template: '' })
class DummyComponent { }

describe('MainToolbarComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: Object[];
  let timeValueRange: ValueRange;
  let component: MainToolbarComponent;
  let fixture: ComponentFixture<MainToolbarComponent>;
  const dbService = new DBService(null);

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
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 }
    ];
    scene = createScene('1', context, columns);
    entries = [
      { ID: 1, Time: now - 90_000, Level: 'INFO', Host: 'server1', Path: '/opt/log/info.log', Amount: 10 },
      { ID: 2, Time: now - 80_000, Level: 'INFO', Host: 'server1', Path: '/opt/log/info.log', Amount: 20 },
      { ID: 3, Time: now - 70_000, Level: 'INFO', Host: 'server1', Path: '/opt/log/info.log', Amount: 30 },
      { ID: 4, Time: now - 60_000, Level: 'WARN', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 40 },
      { ID: 5, Time: now - 50_000, Level: 'WARN', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 50 },
      { ID: 6, Time: now - 40_000, Level: 'WARN', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 60 },
      { ID: 7, Time: now - 30_000, Level: 'ERROR', Host: 'server2', Path: '/var/log/error.log', Amount: 70 },
      { ID: 8, Time: now - 20_000, Level: 'ERROR', Host: 'server2', Path: '/var/log/error.log', Amount: 80 },
      { ID: 9, Time: now - 10_000, Level: 'ERROR', Host: 'server2', Path: '/var/log/error.log', Amount: 90 },
      { ID: 10, Time: now, Level: 'ERROR', Data: 'ERROR line four', Host: 'server2', Path: '/var/log/error.log', Amount: 100 },
    ];
    const timeMin = entries[0]['Time'];
    const timeMax = entries[entries.length - 1]['Time'];
    timeValueRange = { min: timeMin, max: timeMax};
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [MainToolbarComponent, DummyComponent],
      imports: [
        MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, MatFormFieldModule, MatSelectModule,
        MatInputModule, MatMenuModule, Ng5SliderModule, BrowserAnimationsModule, RouterTestingModule,
        RouterModule.forRoot([{ path: '**', component: DummyComponent }])
      ],
      providers: [
        { provide: DBService, useValue: dbService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    })
    .overrideModule(MatIconModule, MatIconModuleMock.override())
    .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(MainToolbarComponent);
    component = fixture.componentInstance;
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    spyOn(dbService, 'timeRangeOf').and.returnValue(Promise.resolve(timeValueRange));
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

  it('#ngOnInit should init selected time range from query when it has time defined', fakeAsync(() => {

    // given
    component.query = new Query();
    component.query.addValueRangeFilter('Time', now - 1_000, now);
    component.columnFilters = [];
    component.rangeFilters = [];
    fixture.detectChanges();

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.columnFilters.length).toBe(0);
    expect(component.rangeFilters.length).toBe(1);
    const timeRangeFilter = component.rangeFilters[0];
    expect(timeRangeFilter.selStart).toEqual(now - 1_000);
    expect(timeRangeFilter.selEnd).toEqual(now);
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
    component.columnFilters = [];
    component.rangeFilters = [];

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.fullTextFilter).toBe('abc');
    expect(component.columnFilters.length).toBe(2);
    expect(component.columnFilters[0]).toBe(levelFilter);
    expect(component.columnFilters[1]).toBe(amountFilter);
  }));

  it('#ngAfterViewChecked should re-create time slider options once the view became active', fakeAsync(() => {

    // given
    component.route = Route.GRID;
    const event: Event = new NavigationEnd(0, '/' + Route.GRID, '/' + Route.GRID);
    component.router = <Router> { events: of(event) };
    const timeRangeFilter = new TimeRangeFilter(column('Time'), timeValueRange.min, timeValueRange.max, null);
    const prevTimeRangeOptions = timeRangeFilter.rangeOptions;
    component.rangeFilters = [ timeRangeFilter ];
    expect(prevTimeRangeOptions).toBeTruthy();
    component.ngOnInit();
    spyOn(component.rangeFilters[0], 'defineRangeOptions');

    // when
    component.ngAfterViewChecked();
    component.ngAfterViewChecked();
    component.ngAfterViewChecked();
    flush();

    // then
    expect(component.rangeFilters[0].defineRangeOptions).toHaveBeenCalledTimes(1);
  }));

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
    const timeRangeFilter = new TimeRangeFilter(column('Time'), timeValueRange.min, timeValueRange.max, null);
    timeRangeFilter.selStart = timeValueRange.min + 1000;
    timeRangeFilter.selEnd = timeValueRange.max - 1000;
    component.rangeFilters = [ timeRangeFilter ];
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');

    // when
    component.refreshEntries();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query: Query = onFilterChangeEmitSpy.calls.mostRecent().args[0];
    const valueRangeFilter = query.findValueRangeFilter('Time');
    expect(valueRangeFilter).toBeDefined();
    expect(valueRangeFilter.valueRange.min).toBe(timeValueRange.min + 1000);
    expect(valueRangeFilter.valueRange.max).toBe(timeValueRange.max - 1000);
  });

  it('raw data button should point to raw data view', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butRawData')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.RAWDATA);
  });

  it('grid view button should point to grid view', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butGridView')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.GRID);
  });

  it('flex view button should point to flex view', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butFlexView')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.FLEX);
  });

  it('pivot view button should point to pivot view', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butPivotView')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.PIVOT);
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
    expect(query.hasFilter()).toBeFalsy();
  });

  it('selecting "add column filter" menu item should add non-time column filter', fakeAsync(() => {

    // given
    component.columnFilters = [];

    // when
    clickAddColumnFilterMenuItem('Level');

    // then
    expect(component.columnFilters.length).toBe(1);
  }));

  it('selecting "add column filter" menu item should add time range filter', fakeAsync(() => {

    // given
    component.columnFilters = [];

    // when
    clickAddColumnFilterMenuItem('Time');

    // then
    expect(component.rangeFilters.length).toBe(1);
    expect(dbService.timeRangeOf).toHaveBeenCalledWith(column('Time'));
  }));

  it('pressing <enter> in column filter field should emit onFilterChange', fakeAsync(() => {

    // given
    component.columnFilters = [];
    clickAddColumnFilterMenuItem('Level');
    const formField = <HTMLElement> fixture.debugElement.query(By.css('.column_filter_value')).nativeElement;
    const htmlInput = <HTMLInputElement> formField.getElementsByTagName('INPUT')[0];
    htmlInput.value = 'ERR';
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
    const query = <Query> onFilterChangeEmitSpy.calls.mostRecent().args[0];
    expect(query.hasFullTextFilter()).toBeFalsy();
    expect(query.getPropertyFilters().length).toBe(1);
    const propFilter = query.getPropertyFilters()[0];
    expect(propFilter.propertyName).toBe('Level');
    expect(propFilter.operator).toBe(Operator.EQUAL);
    expect(propFilter.filterValue).toBe('ERR');
    expect(query.findValueRangeFilter('Time')).toBeUndefined();
  }));

  it('pressing <clear> button in column filter field should emit onFilterChange', fakeAsync(() => {

    // given
    component.columnFilters = [];
    clickAddColumnFilterMenuItem('Level');
    const formField = <HTMLElement> fixture.debugElement.query(By.css('.column_filter_value')).nativeElement;
    const htmlInput = <HTMLInputElement> formField.getElementsByTagName('INPUT')[0];
    htmlInput.value = 'ERR';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');
    const clearButton = <HTMLButtonElement> formField.getElementsByTagName('BUTTON')[0];

    // when
    clearButton.click();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query = <Query> onFilterChangeEmitSpy.calls.mostRecent().args[0];
    expect(query.hasFilter()).toBeFalsy();
  }));

  it('#removeColumnFilter should emit onFilterChange when removed filter was effective', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, 'ERROR');
    component.columnFilters = [columnFilter];
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');

    // when
    component.removeColumnFilter(columnFilter);

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query = <Query> onFilterChangeEmitSpy.calls.mostRecent().args[0];
    expect(query.hasFilter()).toBeFalsy();
  });

  it('#removeColumnFilter should not emit onFilterChange when removed filter was not effective', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, '');
    component.columnFilters = [columnFilter];
    spyOn(component.onFilterChange, 'emit');

    // when
    component.removeColumnFilter(columnFilter);

    // then
    expect(component.onFilterChange.emit).not.toHaveBeenCalled();
  });

  it('#click on "Remove value range filter" button should remove time range filter', fakeAsync(() => {

    // given
    component.columnFilters = [];
    clickAddColumnFilterMenuItem('Time');
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('.but_remove_range_filter')).nativeElement;

    // when
    htmlButton.click();
    fixture.detectChanges();

    // then
    flush();
    expect(component.rangeFilters.length).toBe(0);
  }));

  it('#onStepChanged should change time step when millisecond is selected', fakeAsync(() => {

    // given
    component.addColumnFilter(column('Time'));
    flush();

    // when
    component.rangeFilters[0].onStepChanged(TimeUnit.MILLISECOND);
    fixture.detectChanges();

    // then
    flush();
    expect(component.rangeFilters[0].selectedStep).toBe(TimeUnit.MILLISECOND);
    expect(component.rangeFilters[0].selectedStepAbbrev).toBe('ms');
    expect(component.rangeFilters[0].rangeOptions.step).toBe(1);
  }));

  it('#onStepChanged should change time step when second is selected',  fakeAsync(() => {

    // given
    component.addColumnFilter(column('Time'));
    flush();

    // when
    component.rangeFilters[0].onStepChanged(TimeUnit.SECOND);

    // then
    expect(component.rangeFilters[0].selectedStep).toBe(TimeUnit.SECOND);
    expect(component.rangeFilters[0].selectedStepAbbrev).toBe('s');
    expect(component.rangeFilters[0].rangeOptions.step).toBe(1_000);
  }));

  it('#onStepChanged should change time step when minute is selected',  fakeAsync(() => {

    // given
    component.addColumnFilter(column('Time'));
    flush();

    // when
    component.rangeFilters[0].onStepChanged(TimeUnit.MINUTE);

    // then
    expect(component.rangeFilters[0].selectedStep).toBe(TimeUnit.MINUTE);
    expect(component.rangeFilters[0].selectedStepAbbrev).toBe('m');
    expect(component.rangeFilters[0].rangeOptions.step).toBe(60_000);
  }));

  it('#onStepChanged should change time step when hour is selected', fakeAsync(() => {

    // given
    component.addColumnFilter(column('Time'));
    flush();

    // when
    component.rangeFilters[0].onStepChanged(TimeUnit.HOUR);

    // then
    expect(component.rangeFilters[0].selectedStep).toBe(TimeUnit.HOUR);
    expect(component.rangeFilters[0].selectedStepAbbrev).toBe('h');
    expect(component.rangeFilters[0].rangeOptions.step).toBe(3_600_000);
  }));

  it('pressing "reset timerange" button should reset selected time range and emit onFilterChange', fakeAsync(() => {

    // given
    component.addColumnFilter(column('Time'));
    flush();
    const timeStart = entries[0]['Time'];
    const timeEnd = entries[entries.length - 1]['Time'];
    component.rangeFilters[0].selStart = timeStart + 1000;
    component.rangeFilters[0].selEnd = timeEnd - 1000;
    component.showRangeFilters = true;
    fixture.detectChanges();
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('.but_reset_range_filter')).nativeElement;
    spyOn(component.onFilterChange, 'emit');

    // when
    htmlButton.click();
    flush();

    // then
    expect(component.rangeFilters[0].selStart).toBe(timeStart);
    expect(component.rangeFilters[0].selEnd).toBe(timeEnd);
    expect(component.onFilterChange.emit).toHaveBeenCalled();
  }));

  function createScene(id: string, context: ContextInfo[], columns: Column[]): Scene {
    return {
      _id: id,
      creationTime: now,
      name: 'Scene ' + id,
      shortDescription: 'Scene ' + id + ' Short Description',
      context: context,
      columns: columns,
      database: 'test_data_' + id,
      config: {
        records: [],
        views: []
      }
    };
  }

  function clickAddColumnFilterMenuItem(columnName: string): void {
    const menuTrigger: HTMLSpanElement = fixture.debugElement.query(By.css('#butAddColFilter')).nativeElement;
    menuTrigger.click()
    flush();
    fixture.detectChanges();

    const iColumn = scene.columns.map(c => c.name).indexOf(columnName);
    const butColumn: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_new_col_filter'))[iColumn].nativeElement;
    butColumn.click();
    flush();
    fixture.detectChanges();
    flush();
  }

  function column(name: string): Column {
    return scene.columns.find(c => c.name === name);
  }
});
