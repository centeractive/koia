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
import { ContextInfo, Column, Route, PropertyFilter, Operator, Query, DataType, Scene, TimeUnit } from 'app/shared/model';
import { of } from 'rxjs';
import { By, HAMMER_LOADER } from '@angular/platform-browser';
import { DBService } from 'app/shared/services/backend';
import { TimeRangeFilter } from './filter/time-range-filter';
import { MatIconModuleMock } from 'app/shared/test';
import { NumberRangeFilter } from './filter/number-range-filter';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { DialogService } from 'app/shared/services';

@Component({ template: '' })
class DummyComponent { }

describe('MainToolbarComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: Object[];
  let valueRange: ValueRange;
  let component: MainToolbarComponent;
  let fixture: ComponentFixture<MainToolbarComponent>;
  const dbService = new DBService(null);
  const dialogService = new DialogService(null);

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
    valueRange = { min: timeMin, max: timeMax };
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
        { provide: DialogService, useValue: dialogService },
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
    spyOn(dbService, 'numberRangeOf').and.returnValue(Promise.resolve(valueRange));
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
    component.router = <Router>{ events: of(event) };
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

  it('#availableOperatorsOf should return all operators when column has TEXT data type', () => {

    // given
    const operators = Object.keys(Operator)
      .map(key => Operator[key]);

    // when / then
    expect(component.availableOperatorsOf('Level')).toEqual(operators);
    expect(component.availableOperatorsOf('Host')).toEqual(operators);
    expect(component.availableOperatorsOf('Path')).toEqual(operators);
  });

  it('#availableOperatorsOf should return operators for TIME data type', () => {

    // when
    const operators = component.availableOperatorsOf('Time');

    // then
    expect(operators).toEqual([Operator.EMPTY, Operator.NOT_EMPTY]);
  });

  it('#availableOperatorsOf should return operators for NUMBER data type', () => {

    // when
    const operators = component.availableOperatorsOf('Amount')

    // then
    const expected = Object.keys(Operator)
      .map(key => Operator[key])
      .filter(o => o !== Operator.CONTAINS);
    expect(operators).toEqual(expected);
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

  it('raw data button should point to raw data view', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butRawData')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.RAWDATA);
  });

  it('pivot view button should point to pivot view', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butPivotView')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.PIVOT);
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

  it('#addValueFilter should add EQUAL filter for number column', fakeAsync(() => {

    // given
    component.columnFilters = [];

    // when
    component.addValueFilter(column('Amount'));

    // then
    expect(component.columnFilters).toEqual([new PropertyFilter('Amount', Operator.EQUAL, '', DataType.NUMBER)]);
  }));

  it('#addValueFilter should add NOT_EMPTY filter for time column', fakeAsync(() => {

    // given
    component.columnFilters = [];

    // when
    component.addValueFilter(column('Time'));

    // then
    expect(component.columnFilters).toEqual([new PropertyFilter('Time', Operator.NOT_EMPTY, '', DataType.TIME)]);
  }));

  it('selecting "add column filter" menu item should add non-time column filter', fakeAsync(() => {

    // given
    component.columnFilters = [];

    // when
    addLevelFilterThroughMenu();

    // then
    expect(component.columnFilters.length).toBe(1);
  }));

  it('pressing <enter> in column filter field should emit onFilterChange', fakeAsync(() => {

    // given
    component.columnFilters = [];
    addLevelFilterThroughMenu();
    const formField = <HTMLElement>fixture.debugElement.query(By.css('.column_filter_value')).nativeElement;
    const htmlInput = <HTMLInputElement>formField.getElementsByTagName('INPUT')[0];
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
    const query = <Query>onFilterChangeEmitSpy.calls.mostRecent().args[0];
    expect(query.getPropertyFilters().length).toBe(1);
    const propFilter = query.getPropertyFilters()[0];
    expect(propFilter.name).toBe('Level');
    expect(propFilter.operator).toBe(Operator.EQUAL);
    expect(propFilter.value).toBe('ERR');
  }));

  it('pressing character key in column filter field should not emit onFilterChange', fakeAsync(() => {

    // given
    component.columnFilters = [];
    addLevelFilterThroughMenu();
    const formField = <HTMLElement>fixture.debugElement.query(By.css('.column_filter_value')).nativeElement;
    const htmlInput = <HTMLInputElement>formField.getElementsByTagName('INPUT')[0];
    spyOn(component.onFilterChange, 'emit');

    // when
    const event: any = document.createEvent('Event');
    event.key = 'x';
    event.initEvent('keyup');
    htmlInput.dispatchEvent(event);

    // then
    expect(component.onFilterChange.emit).not.toHaveBeenCalled();
  }));

  it('pressing <clear> button in column filter field should emit onFilterChange', fakeAsync(() => {

    // given
    component.columnFilters = [];
    addLevelFilterThroughMenu();
    const formField = <HTMLElement>fixture.debugElement.query(By.css('.column_filter_value')).nativeElement;
    const htmlInput = <HTMLInputElement>formField.getElementsByTagName('INPUT')[0];
    htmlInput.value = 'ERR';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');
    const clearButton = <HTMLButtonElement>formField.getElementsByTagName('BUTTON')[0];

    // when
    clearButton.click();

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query = <Query>onFilterChangeEmitSpy.calls.mostRecent().args[0];
    expect(query.hasFilter()).toBeFalsy();
  }));

  it('#onColumnFilterNameChanged should change property filter name and data type', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT);
    component.columnFilters = [columnFilter];
    spyOn(component, 'refreshEntries');

    // when
    component.onColumnFilterNameChanged(columnFilter, column('Amount'));

    // then
    expect(columnFilter.name).toBe('Amount');
    expect(columnFilter.dataType).toBe(DataType.NUMBER);
  });

  it('#onColumnFilterNameChanged should refresh entries when filter is applicable', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, 'ERROR');
    component.columnFilters = [columnFilter];
    spyOn(component, 'refreshEntries');

    // when
    component.onColumnFilterNameChanged(columnFilter, column('Host'));

    // then
    expect(component.refreshEntries).toHaveBeenCalled();
  });

  it('#onColumnFilterNameChanged should not refresh entries when filter is not applicable', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, '');
    component.columnFilters = [columnFilter];
    spyOn(component, 'refreshEntries');

    // when
    component.onColumnFilterNameChanged(columnFilter, column('Host'));

    // then
    expect(component.refreshEntries).not.toHaveBeenCalled();
  });

  it('#onColumnFilterNameChanged should change operator when CONTAINS with non TEXT column', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.CONTAINS, 'ERR');
    component.columnFilters = [columnFilter];
    spyOn(component, 'refreshEntries');

    // when
    component.onColumnFilterNameChanged(columnFilter, column('Amount'));

    // then
    expect(columnFilter.operator).toBe(Operator.EQUAL);
  });

  it('#onColumnFilterValueChanged should change text value', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.CONTAINS, 'WARN', DataType.TEXT);
    component.columnFilters = [columnFilter];

    // when
    component.onColumnFilterValueChanged(columnFilter, 'ERR');

    // then
    expect(columnFilter.value).toBe('ERR');
  });

  it('#onColumnFilterValueChanged should change number value', () => {

    // given
    const columnFilter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);
    component.columnFilters = [columnFilter];

    // when
    component.onColumnFilterValueChanged(columnFilter, '1,200,300.55');

    // then
    expect(columnFilter.value).toBe(1_200_300.55);
  });

  it('#removeColumnFilter should emit onFilterChange when removed filter was effective', () => {

    // given
    const columnFilter = new PropertyFilter('Level', Operator.EQUAL, 'ERROR');
    component.columnFilters = [columnFilter];
    const onFilterChangeEmitSpy = spyOn(component.onFilterChange, 'emit');

    // when
    component.removeColumnFilter(columnFilter);

    // then
    expect(component.onFilterChange.emit).toHaveBeenCalled();
    const query = <Query>onFilterChangeEmitSpy.calls.mostRecent().args[0];
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

  it('#addRangeFilter should add time range filter when TIME column', fakeAsync(() => {

    // when
    component.addRangeFilter(column('Time'), null, false);
    flush();

    // then
    expect(component.rangeFilters.length).toBe(1);
    expect(component.rangeFilters[0] instanceof TimeRangeFilter).toBeTruthy();
    const timeRangeFilter = <TimeRangeFilter>component.rangeFilters[0];
    expect(timeRangeFilter.start).toBe(valueRange.min);
    expect(timeRangeFilter.end).toBe(valueRange.max);
  }));

  it('#addRangeFilter should add time range filter when TIME column', fakeAsync(() => {

    // when
    component.addRangeFilter(column('Amount'), null, false);
    flush();

    // then
    expect(component.rangeFilters.length).toBe(1);
    expect(component.rangeFilters[0] instanceof NumberRangeFilter).toBeTruthy();
    const numberRangeFilter = <NumberRangeFilter>component.rangeFilters[0];
    expect(numberRangeFilter.start).toBe(valueRange.min);
    expect(numberRangeFilter.end).toBe(valueRange.max);
  }));

  it('#onRangeFilterChanged should refresh entries', fakeAsync(() => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false);
    component.rangeFilters = [rangeFilter];
    spyOn(component, 'refreshEntries');

    // when
    component.onRangeFilterChanged(rangeFilter, { value: 3, highValue: 7, pointerType: undefined });

    // then
    expect(rangeFilter.selValueRange.min).toBe(3);
    expect(rangeFilter.selValueRange.max).toBe(7);
    expect(component.refreshEntries).toHaveBeenCalled();
  }));

  it('#onRangeFilterInvertedChanged should refresh entries', fakeAsync(() => {

    // given
    const rangeFilter = new NumberRangeFilter(column('Amount'), 1, 10, { min: 2, max: 5 }, false);
    component.rangeFilters = [rangeFilter];
    spyOn(component, 'refreshEntries');

    // when
    component.onRangeFilterInvertedChanged(rangeFilter, true);

    // then
    expect(rangeFilter.inverted).toBeTruthy();
    expect(component.refreshEntries).toHaveBeenCalled();
  }));

  it('#click on "Remove value range filter" button should remove time range filter', fakeAsync(() => {

    // given
    component.columnFilters = [];
    component.addRangeFilter(column('Time'), null, false);
    flush();
    fixture.detectChanges();
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
    expect(component.rangeFilters[0].sliderOptions.step).toBe(1_000);
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
    expect(component.rangeFilters[0].sliderOptions.step).toBe(60_000);
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
    expect(component.rangeFilters[0].sliderOptions.step).toBe(3_600_000);
  }));

  it('pressing "value range" button should reset value range and emit onFilterChange', fakeAsync(() => {

    // given
    component.addRangeFilter(column('Time'), null, false);
    flush();
    const timeStart = entries[0]['Time'];
    const timeEnd = entries[entries.length - 1]['Time'];
    component.rangeFilters[0].selValueRange.min = timeStart + 1000;
    component.rangeFilters[0].selValueRange.max = timeEnd - 1000;
    component.showRangeFilters = true;
    fixture.detectChanges();
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('.but_reset_range_filter')).nativeElement;
    spyOn(component.onFilterChange, 'emit');

    // when
    htmlButton.click();
    flush();

    // then
    const selValueRange = component.rangeFilters[0].selValueRange;
    expect(selValueRange.min).toBe(timeStart);
    expect(selValueRange.max).toBe(timeEnd);
    expect(component.onFilterChange.emit).toHaveBeenCalled();
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
