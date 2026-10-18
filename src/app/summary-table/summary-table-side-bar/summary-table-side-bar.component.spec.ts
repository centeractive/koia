import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { By } from '@angular/platform-browser';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { Aggregation, Column, DataType, SummaryContext, TimeUnit } from 'app/shared/model';
import { ContainerModel, DragDropEventFactory } from 'app/shared/test';
import { SummaryTableSideBarComponent } from './summary-table-side-bar.component';
import { SideBarHeaderComponent } from 'app/shared/component/side-bar-header/side-bar-header.component';

describe('SummaryTableSideBarComponent', () => {

  const dragDropEventFactory = new DragDropEventFactory<Aggregation>();
  let columns: Column[];
  let entries: object[];
  let context: SummaryContext;
  let component: SummaryTableSideBarComponent;
  let fixture: ComponentFixture<SummaryTableSideBarComponent>;

  beforeAll(() => {
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE },
      { name: 'Level', dataType: DataType.TEXT, width: 60 },
      { name: 'Host', dataType: DataType.TEXT, width: 80 },
      { name: 'Path', dataType: DataType.TEXT, width: 200 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 },
      { name: 'Percent', dataType: DataType.NUMBER, width: 30 }
    ];
    const now = new Date().getTime();
    entries = [
      { Time: now, Level: 'ERROR', Host: 'localhost', Path: 'C:/temp/test.log', Amount: 328, Percent: 12 },
      { Time: now, Level: 'WARN', Host: 'localhost', Path: 'C:/temp/test.log', Amount: 654, Percent: 21 },
      { Time: now, Level: 'INFO', Host: 'localhost', Path: 'C:/temp/test.log', Amount: 891, Percent: 28 }
    ];
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [SummaryTableSideBarComponent, KoiaFormDirective, SideBarHeaderComponent],
      imports: [
        MatExpansionModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatFormFieldModule,
        MatMenuModule, DragDropModule, MatSelectModule, MatRadioModule
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryTableSideBarComponent);
    component = fixture.componentInstance;
    component.entries = entries.slice(0);

    context = new SummaryContext(columns.slice(0));
    context.dataColumns = [findColumn('Amount')];
    context.groupByColumns = [findColumn('Time')];
    context.aggregations = [Aggregation.MIN, Aggregation.MAX];

    component.context = context;
    component.elementCount = 3;
    component.elementPosition = 2;
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('accordion panels should be separated by gap like new scene', () => {

    // when
    const accordion: HTMLElement = fixture.nativeElement.querySelector('mat-accordion');

    // then
    expect(getComputedStyle(accordion).rowGap).toBe('12px');
  });

  it('should initialize fields', () => {
    expect(component.dataColumns).toEqual(columns.filter(c => c.dataType !== DataType.TIME));
    const currentNonGroupByColumns = columns.filter(n => !context.groupByColumns.includes(n));
    expect(component.availableGroupByColumns).toEqual(currentNonGroupByColumns.filter(c => !context.dataColumns.includes(c)));
    expect(component.selectedGroupByColumns).toEqual(context.groupByColumns);
    expect(component.selectedAggregations).toEqual([Aggregation.MIN, Aggregation.MAX]);
  });

  it('#click on multi expand toggle should close all expansion panels when unchecked', () => {

    // given
    vi.spyOn(component.accordion, 'closeAll').mockReturnValue(undefined);
    const multiExpandToggleElement: MatSlideToggle = fixture.debugElement.query(By.css('.toggle_multi_expand')).nativeElement;
    const multiExpandToggleLabelElement = fixture.debugElement.query(By.css('label')).nativeElement;
    multiExpandToggleLabelElement.click();

    // when
    multiExpandToggleLabelElement.click();
    fixture.detectChanges();

    // then
    expect(multiExpandToggleElement.checked).toBeFalsy();
    expect(component.accordion.closeAll).toHaveBeenCalledTimes(1);
  });

  it('#onAggregationTypeChanged should set context aggreation COUNT when count distinct values', () => {

    // when
    component.onAggregationTypeChanged(true);

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
  });

  it('#onAggregationTypeChanged should define value aggregation when not count distinct values', () => {

    // when
    component.onAggregationTypeChanged(false);

    // then
    expect(context.aggregations).toEqual(SummaryTableSideBarComponent.VALUE_AGGREGATIONS.slice(0, 1));
  });

  it('#onColumnChanged should define aggregation COUNT when text column', () => {

    // when
    component.onColumnChanged(findColumn('Host'));

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
  });

  it('#onColumnChanged should change aggregation when number column and previous aggreation was COUNT', () => {

    // given
    context.aggregations = [Aggregation.COUNT];

    // when
    component.onColumnChanged(findColumn('Amount'));

    // then
    expect(context.aggregations).toEqual(SummaryTableSideBarComponent.VALUE_AGGREGATIONS.slice(0, 1));
  });

  it('#onColumnChanged should keep aggregation when number column and previous aggreation was not COUNT', () => {

    // given
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.SUM, Aggregation.MEDIAN];

    // when
    component.onColumnChanged(findColumn('Percent'));

    // then
    expect(context.aggregations).toEqual([Aggregation.SUM, Aggregation.MEDIAN]);
  });

  it('#addValueGroupingFor should keep aggregation count when already selected', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.COUNT];
    let contextChangeEvents = 0;
    context.subscribeToChanges(() => ++contextChangeEvents);

    // when
    component.addValueGroupingFor(findColumn('Amount'));
    flush();

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
    expect(context.valueGroupings.length).toBe(1);
    expect(context.valueGroupings[0].columnName).toBe('Amount');
    expect(contextChangeEvents).toBe(1);
  }));

  it('#addValueGroupingFor should switch to aggregation COUNT when not selected', fakeAsync(() => {

    // given
    const amountColumn = findColumn('Amount');
    context.dataColumns = [amountColumn];
    context.aggregations = [Aggregation.SUM, Aggregation.MEDIAN];
    let contextChangeEvents = 0;
    context.subscribeToChanges(() => ++contextChangeEvents);

    // when
    component.addValueGroupingFor(amountColumn);
    flush();

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
    expect(context.valueGroupings.length).toBe(1);
    expect(context.valueGroupings[0].columnName).toBe('Amount');
    expect(contextChangeEvents).toBe(1);
  }));

  it('#isCountDistinctValuesEnabled should return true if context has no data column', () => {

    // given
    context.dataColumns = [];

    // when
    const countDistinctValuesEnabled = component.isAggregateValuesEnabled();

    // then
    expect(countDistinctValuesEnabled).toBe(true);
  });

  it('#isCountDistinctValuesEnabled should return true if context has non-value-grouped numeric data column', () => {

    // given
    context.dataColumns = [findColumn('Percent')];

    // when
    const countDistinctValuesEnabled = component.isAggregateValuesEnabled();

    // then
    expect(countDistinctValuesEnabled).toBe(true);
  });

  it('#isCountDistinctValuesEnabled should return false if context has value-grouped numeric data column', () => {

    // given
    context.dataColumns = [findColumn('Percent')];
    context.valueGroupings = [{ columnName: 'Percent', ranges: [{ min: 1, max: 10 }, { min: 10, max: 20 }] }];

    // when
    const countDistinctValuesEnabled = component.isAggregateValuesEnabled();

    // then
    expect(countDistinctValuesEnabled).toBe(false);
  });

  it('#click on data column button should invoke #onColumnNameChanged', () => {

    // given
    vi.spyOn(component, 'onColumnChanged').mockReturnValue(undefined);
    const butColumn: HTMLButtonElement = fixture.debugElement.query(By.css('.but_column')).nativeElement;

    // when
    butColumn.click();

    // then
    expect(component.onColumnChanged).toHaveBeenCalled();
  });

  it('#dropAggregation should re-position context aggregations when moved inside selected aggregations', () => {

    // given
    context.aggregations = [Aggregation.MIN, Aggregation.AVG, Aggregation.MAX];
    component.selectedAggregations = context.aggregations.slice(0);
    const dragDropEvent = dragDropEventFactory.createInContainerEvent('selectedAggregations', component.selectedAggregations, 1, 0);

    // when
    component.dropAggregation(dragDropEvent);

    // then
    expect(context.aggregations).toEqual([Aggregation.AVG, Aggregation.MIN, Aggregation.MAX]);
  });

  it('#dropAggregation should not change context aggregations when moved inside available aggregations', () => {

    // given
    context.aggregations = [Aggregation.MIN, Aggregation.AVG, Aggregation.MAX];
    component.selectedAggregations = context.aggregations.slice(0);
    const data = [Aggregation.MEDIAN, Aggregation.SUM];
    const dragDropEvent = dragDropEventFactory.createInContainerEvent('availableGroupByColumns', data, 1, 0);

    // when
    component.dropAggregation(dragDropEvent);

    // then
    expect(context.aggregations).toEqual([Aggregation.MIN, Aggregation.AVG, Aggregation.MAX]);
  });

  it('#dropAggregation should change context aggregations when moved into selected aggregations', () => {

    // given
    context.aggregations = [Aggregation.MIN, Aggregation.AVG];
    component.selectedAggregations = context.aggregations.slice(0);
    const from: ContainerModel<Aggregation> = {
      id: 'availableAggregations',
      data: [Aggregation.MEDIAN, Aggregation.MAX, Aggregation.SUM],
      index: 1
    };
    const to: ContainerModel<Aggregation> = {
      id: 'selectedAggregations',
      data: component.selectedAggregations,
      index: 2
    };
    const dragDropEvent = dragDropEventFactory.createCrossContainerEvent(from, to);

    // when
    component.dropAggregation(dragDropEvent);

    // then
    expect(context.aggregations).toEqual([Aggregation.MIN, Aggregation.AVG, Aggregation.MAX]);
  });

  it('selected aggregation should not be draggable when it is the only one', () => {

    // given
    context.aggregations = [Aggregation.MAX];
    component.ngOnChanges({ context: new SimpleChange(context, context, false) });

    // when
    fixture.detectChanges();

    // then
    const drags = selectedAggregationDrags();
    expect(drags.length).toBe(1);
    expect(drags[0].disabled).toBe(true);
  });

  it('selected aggregations should be draggable when several are selected', () => {

    // when
    const drags = selectedAggregationDrags();

    // then
    expect(drags.length).toBe(2);
    expect(drags.every(d => !d.disabled)).toBe(true);
  });

  function selectedAggregationDrags(): CdkDrag[] {
    return fixture.debugElement.query(By.css('#selectedAggregations'))
      .queryAll(By.directive(CdkDrag))
      .map(d => d.injector.get(CdkDrag));
  }

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }
});
