import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HAMMER_LOADER, By } from '@angular/platform-browser';
import { PivotTableSideBarComponent } from './pivot-table-side-bar.component';
import { IDataFrame, DataFrame } from 'data-forge';
import { Column, DataType, TimeUnit } from '../../shared/model';
import { ValueRange } from '../../shared/value-range/model/value-range.type';
import { ValueGrouping } from '../../shared/value-range/model/value-grouping.type';
import { PivotContext } from '../model';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule, MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

describe('PivotTableSideBarComponent', () => {

  let now: number;
  let columns: Column[];
  let data: IDataFrame;
  let context: PivotContext;
  let component: PivotTableSideBarComponent;
  let fixture: ComponentFixture<PivotTableSideBarComponent>;

  beforeAll(() => {
    now = new Date().getTime();
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100 },
      { name: 'Level', dataType: DataType.TEXT, width: 60 },
      { name: 'Host', dataType: DataType.TEXT, width: 80 },
      { name: 'Path', dataType: DataType.TEXT, width: 200 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 },
      { name: 'Percent', dataType: DataType.NUMBER, width: 40 }
    ];
    const entries = [
      { Time: now - 1000, Level: 'INFO', Data: 'one', Host: 'server1', Path: 'var/log/*.log', Amount: 10, Percent: 12 },
      { Time: now - 2000, Level: 'INFO', Data: 'two', Host: 'server1', Path: 'var/log/*.trc', Amount: 20, Percent: 24 },
      { Time: now - 3000, Level: 'INFO', Data: 'three', Host: 'server2', Path: 'var/log/*.txt', Amount: 30, Percent: 36 },
      { Time: now - 4000, Level: 'WARN', Data: 'four', Host: 'server3', Path: 'var/log/*.out', Amount: 40, Percent: 48 },
    ]
    data = new DataFrame(entries);
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [PivotTableSideBarComponent],
      imports: [
        MatExpansionModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatFormFieldModule,
        DragDropModule, BrowserAnimationsModule, MatSelectModule
      ],
      providers: [
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PivotTableSideBarComponent);
    component = fixture.componentInstance;
    component.columns = columns;
    context = {
      timeColumns: [{ name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE }],
      negativeColor: 'red',
      positiveColor: 'green',
      showRowTotals: true,
      showColumnTotals: true,
      valueGroupings: [],
      pivotOptions: null
    };
    component.context = context;
    component.data = data;
    component.ngOnChanges(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should identify non grouped columns', () => {
    expect(component.nonGroupedColumns).toBeTruthy();
    expect(component.nonGroupedColumns.length).toBe(2);
    expect(component.nonGroupedColumns.map(c => c.name)).toEqual(['Amount', 'Percent']);
  });

  it('#ngOnChanges should work smoothly when context is null', () => {
    component.context = null;
    component.ngOnChanges(null);
  });

  it('#ngOnChanges should work smoothly when columns are null', () => {
    component.columns = null;
    component.ngOnChanges(null);
  });

  it('#ngOnChanges should work smoothly when data is null', () => {
    component.data = null;
    component.ngOnChanges(null);
  });

  it('#click on multi expand toggle should close all expansion panels when unchecked', () => {

    // given
    spyOn(component.accordion, 'closeAll');
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

  it('#ngOnChanges should retain groupings missing limit', () => {

    // given
    const ranges: ValueRange[] = [{ max: 20, active: true }, { max: 50, active: true }]
    const amountGrouping: ValueGrouping = { columnName: 'Amount', ranges: ranges };
    const percentGrouping: ValueGrouping = { columnName: 'Percent', ranges: ranges };
    component.context.valueGroupings = [amountGrouping, percentGrouping];

    // when
    component.ngOnChanges(null);

    // then
    expect(amountGrouping.minMaxValues).toEqual({ min: 10, max: 40 });
    expect(percentGrouping.minMaxValues).toEqual({ min: 12, max: 48 });
  });

  it('#addValueGrouping should remove column from non-grouped columns', () => {

    // given
    const amountColumn = columns.filter(c => c.name === 'Amount')[0];

    // when
    component.addValueGrouping(amountColumn);

    // then
    expect(component.nonGroupedColumns).toBeTruthy();
    expect(component.nonGroupedColumns.length).toBe(1);
    expect(component.nonGroupedColumns[0].name).toEqual('Percent');
  });

  it('#addValueGrouping should add grouping with initial ranges to context', () => {

    // given
    const percentColumn = columns.filter(c => c.name === 'Percent')[0];

    // when
    component.addValueGrouping(percentColumn);

    // then
    expect(component.context.valueGroupings).toBeTruthy();
    expect(component.context.valueGroupings.length).toBe(1);
    const grouping = component.context.valueGroupings[0];
    expect(grouping.columnName).toBe('Percent');
    expect(grouping.minMaxValues).toEqual({ min: 12, max: 48 });
    const expectedRanges = [
      { max: 50, active: true },
      { max: 40, active: true },
      { max: 30, active: true },
      { max: 20, active: true }
    ];
    expect(grouping.ranges).toEqual(expectedRanges);
  });

  it('#removeValueGrouping should remove grouping and update non grouped columns', () => {

    // given
    const amountColumn = columns.filter(c => c.name === 'Amount')[0];
    const grouping = component.addValueGrouping(amountColumn);

    // when
    component.removeValueGrouping(grouping);

    // then
    expect(component.context.valueGroupings.includes(grouping)).toBeFalsy();
    expect(component.nonGroupedColumns[0].name).toEqual('Amount', 'Percent');
  });

  it('#addGroupingRange should add range', () => {

    // given
    const amountColumn = columns.filter(c => c.name === 'Amount')[0];
    const grouping = component.addValueGrouping(amountColumn);
    const initialRangesCount = grouping.ranges.length;

    // when
    component.addGroupingRange(grouping);

    // then
    expect(grouping.ranges.length).toBe(initialRangesCount + 1);
  });

  it('#removeGroupingRange should remove range', () => {

    // given
    const amountColumn = columns.filter(c => c.name === 'Amount')[0];
    const grouping = component.addValueGrouping(amountColumn);
    const range1 = { max: 10, active: true };
    const range2 = { max: 20, active: true };
    const range3 = { max: 30, active: true };
    grouping.ranges = [range1, range2, range3];

    // when
    component.removeGroupingRange(grouping, range2);

    // then
    expect(grouping.ranges).toEqual([range1, range3]);
  });

  it('#dropGroupingRange should move range to new position', () => {

    // given
    const amountColumn = columns.filter(c => c.name === 'Amount')[0];
    const grouping = component.addValueGrouping(amountColumn);
    const range1 = { max: 10, active: true };
    const range2 = { max: 20, active: true };
    const range3 = { max: 30, active: true };
    grouping.ranges = [range1, range2, range3];

    // when
    component.dropGroupingRange(grouping, <CdkDragDrop<string[]>> { previousIndex: 2, currentIndex: 0 });

    // then
    expect(grouping.ranges).toEqual([range3, range1, range2]);
  });

  it('#isNumberKey should return value obtained from NumberUtils#isNumberKey', () => {
    expect(component.isNumberKey(new KeyboardEvent('keydown', { key: '1'.toString() }))).toBeTruthy();
    expect(component.isNumberKey(new KeyboardEvent('keydown', { key: '-'.toString() }))).toBeTruthy();
    expect(component.isNumberKey(new KeyboardEvent('keydown', { key: '.'.toString() }))).toBeTruthy();
    expect(component.isNumberKey(new KeyboardEvent('keydown', { key: 'a'.toString() }))).toBeFalsy();
  });
});
