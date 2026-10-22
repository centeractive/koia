import { DragDropModule } from '@angular/cdk/drag-drop';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { By } from '@angular/platform-browser';
import { Aggregation, ChangeEvent, Column, ComputeOperator, DataType, TimeUnit } from 'app/shared/model';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { MatIconModuleMock } from 'app/shared/test';
import { AggregationMode, ChartSideBarComponent } from './chart-side-bar.component';
import { ScaleComponent } from './scale/scale.component';
import { TicksComponent } from './scale/ticks/ticks.component';
import { SideBarHeaderComponent } from 'app/shared/component/side-bar-header/side-bar-header.component';

let context: ChartContext;
let component: ChartSideBarComponent;
let fixture: ComponentFixture<ChartSideBarComponent>;

describe('ChartSideBarComponent', () => {

  const COLUMNS: Column[] = [
    { name: 'Name', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true },
    { name: 'Percent', dataType: DataType.NUMBER, width: 20, indexed: true }
  ];

  beforeEach(waitForAsync(() => {
    setup(COLUMNS, COLUMNS[0], COLUMNS[1]);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('value mode and name column fields should be outlined for individual values of circular chart', () => {

    // when
    const fields = formFields();

    // then
    expect(fields.length).toBe(2);
    fields.forEach(f => expect(f.classList).toContain('mat-form-field-appearance-outline'));
  });

  it('value mode options should name unique named values on circular chart', () => {

    // when
    const options = openSelectOptions('Value Mode');

    // then
    expect(optionTexts(options)).toEqual(['Count Distinct Values', 'Unique Named Values']);
  });

  it('stacked checkbox should be hidden on circular chart', () => {
    expect(fixture.nativeElement.querySelector('mat-checkbox')).toBeNull();
  });

  it('#click on SCATTER chart button should switch to individual values when number data column is selected', () => {

    // given
    const butChart = findChartButton(ChartType.SCATTER);

    // when
    butChart.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(component.countDistinctValuesEnabled).toBe(true);
    expect(component.individualValuesEnabled).toBe(true);
    expect(context.groupByColumns).toEqual([findColumn('Name')]);
    expect(context.isAggregationCountSelected()).toBe(false);
  });

  it('#click on number data column should replace data column on LINE chart when no group-by column would remain', () => {

    // given
    context.entries = [
      { Name: 'a', Amount: 1, Percent: 1 },
      { Name: 'a', Amount: 2, Percent: 2 }
    ];
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.groupByColumns = [findColumn('Percent')];
    const butPercentColumn = findDataColumnButton('Percent');

    // when
    butPercentColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Percent']);
    expect(context.groupByColumns).toEqual([findColumn('Amount')]);
    expect(context.isAggregationCountSelected()).toBe(false);
  });

});

describe('ChartSideBarComponent - data includes time column', () => {

  const COLUMNS: Column[] = [
    { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
    { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
    { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
    { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true },
    { name: 'Percent', dataType: DataType.NUMBER, width: 20, indexed: true }
  ];

  beforeEach(waitForAsync(() => {
    setup(COLUMNS, COLUMNS[0], COLUMNS[1]);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('value mode, group by, time unit and step size fields should be outlined for counted line chart', () => {

    // given
    context.chartType = ChartType.LINE.type;

    // when
    fixture.detectChanges();

    // then
    const fields = formFields();
    expect(fields.length).toBe(5);
    fields.forEach(f => expect(f.classList).toContain('mat-form-field-appearance-outline'));
  });

  it('accordion panels should be separated by gap like new scene', () => {

    // when
    const accordion: HTMLElement = fixture.nativeElement.querySelector('mat-accordion');

    // then
    expect(getComputedStyle(accordion).rowGap).toBe('12px');
  });

  it('should initialize fields', () => {
    expect(component.selectableDataColumns).toEqual(COLUMNS.filter(c => c.name !== 'Time'));
    const currentNonGroupByColumns = COLUMNS.filter(n => !context.groupByColumns.includes(n));
    expect(component.availableGroupByColumns).toEqual(currentNonGroupByColumns.filter(c => !context.dataColumns.includes(c)));
    expect(component.selectedGroupByColumns).toEqual(context.groupByColumns);
    expect(component.selectedChartType).toEqual(ChartType.fromType(context.chartType));
  });

  it('side bar should contain a button for each chart type', () => {
    const butChartTypeDebutElements = fixture.debugElement.queryAll(By.css('.but_chart_type'));
    expect(butChartTypeDebutElements.length).toBe(component.chartTypes.length);
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

  it('#click on chart type button should update component and context', () => {

    // given
    const butChartTypeDebugElements = fixture.debugElement.queryAll(By.css('.but_chart_type'));

    for (let i = 0; i < component.chartTypes.length; i++) {

      // when
      butChartTypeDebugElements[i].nativeElement.click();

      // then
      const chartType = component.chartTypes[i];
      expect(component.selectedChartType).toBe(chartType);
      expect(context.chartType).toBe(chartType.type);
    }
  });

  it('#click on LINE chart button should enlarge width when no data column exists yet', () => {

    // given
    context.dataColumns = [];
    const initialGridColumnSpan = context.gridColumnSpan;
    const initialWidth = context.width;
    const butChart = findChartButton(ChartType.LINE);

    // when
    butChart.click();

    // then
    expect(context.gridColumnSpan).toBe(initialGridColumnSpan * 2);
    expect(context.width).toBe(initialWidth * 2);
  });

  it('#click on PIE chart button should shrink width back after LINE chart when no data column exists yet', () => {

    // given
    context.dataColumns = [];
    const initialGridColumnSpan = context.gridColumnSpan;
    const initialWidth = context.width;
    findChartButton(ChartType.LINE).click();
    const butChart = findChartButton(ChartType.PIE);

    // when
    butChart.click();

    // then
    expect(context.gridColumnSpan).toBe(initialGridColumnSpan);
    expect(context.width).toBe(initialWidth);
  });

  it('#click on BAR chart button should keep size of PIE chart when no data column exists yet', () => {

    // given
    context.dataColumns = [];
    const initialGridColumnSpan = context.gridColumnSpan;
    const initialWidth = context.width;
    const butChart = findChartButton(ChartType.BAR);

    // when
    butChart.click();

    // then
    expect(context.gridColumnSpan).toBe(initialGridColumnSpan);
    expect(context.width).toBe(initialWidth);
  });

  it('#click on PIE chart button should keep previous selected data columns', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.aggregations = [];
    context.dataColumns = [findColumn('Amount'), findColumn('Percent')];
    const butChart = findChartButton(ChartType.PIE);

    // when
    butChart.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount', 'Percent']);
    expect(component.countDistinctValuesEnabled).toBe(false);
    expect(component.individualValuesEnabled).toBe(true);
  });

  it('#click on LINE chart button should switch to individual values when number data column is selected', () => {

    // given
    context.chartType = ChartType.PIE.type;
    component.selectedChartType = ChartType.PIE;
    context.dataColumns = [findColumn('Amount')];
    const butChart = findChartButton(ChartType.LINE);

    // when
    butChart.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(component.countDistinctValuesEnabled).toBe(true);
    expect(component.individualValuesEnabled).toBe(true);
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
    expect(context.isAggregationCountSelected()).toBe(false);
  });

  it('#click on SCATTER chart button should switch to individual values when number data column is selected', () => {

    // given
    context.chartType = ChartType.PIE.type;
    component.selectedChartType = ChartType.PIE;
    context.dataColumns = [findColumn('Amount')];
    const butChart = findChartButton(ChartType.SCATTER);

    // when
    butChart.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(component.countDistinctValuesEnabled).toBe(true);
    expect(component.individualValuesEnabled).toBe(true);
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
    expect(context.isAggregationCountSelected()).toBe(false);
  });

  it('side bar should contain button for each non-time column', () => {
    const butColumnDebugElements = fixture.debugElement.queryAll(By.css('.but_column'));
    const nonTimeColumns = COLUMNS.filter(c => c.name !== 'Time');

    expect(butColumnDebugElements.length).toBe(nonTimeColumns.length);
  });

  it('#click on data column button should invoke #onColumnChanged', () => {

    // given
    vi.spyOn(component, 'onColumnChanged').mockReturnValue(undefined);
    const butPathColumn = findDataColumnButton('Path');

    // when
    butPathColumn.click();

    // then
    expect(component.onColumnChanged).toHaveBeenCalled();
  });

  it('#click on text data column button should remove previous data column when chart is non-grouping', () => {

    // given
    context.chartType = ChartType.PIE.type;
    component.selectedChartType = ChartType.PIE;
    context.dataColumns = [findColumn('Amount')];
    const butPathColumn = findDataColumnButton('Path');

    // when
    butPathColumn.click();

    // then
    expect(context.dataColumns.length).toBe(1);
    expect(context.dataColumns.map(c => c.name)).toEqual(['Path']);
  });

  it('#click on data column should remove data column when it was selected with another data columns', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.dataColumns = [findColumn('Level'), findColumn('Amount')];
    const butLevelColumn = findDataColumnButton('Level');

    // when
    butLevelColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(component.countDistinctValuesEnabled).toBe(true);
    expect(component.individualValuesEnabled).toBe(true);
  });

  it('#click on data column should remove data column if it was the only selected one', () => {

    // given
    const butLevelColumn = findDataColumnButton('Level');

    // when
    butLevelColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual([]);
  });

  it('#click on text data column should remove column when chart is LINE chart and other column remains selected', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.dataColumns = [findColumn('Amount')];
    const butDataColumn = findDataColumnButton('Host');

    // when
    butDataColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Host']);
    expect(component.countDistinctValuesEnabled).toBe(true);
    expect(component.individualValuesEnabled).toBe(false);
  });

  it('#click on number data column button should replace number data column when chart is LINE chart with count distinct values', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.COUNT];
    const butPercentColumn = findDataColumnButton('Percent');

    // when
    butPercentColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Percent']);
    expect(component.countDistinctValuesEnabled).toBe(true);
    expect(component.individualValuesEnabled).toBe(true);
  });

  it('#click on number data column button should keep existing number data column when chart is LINE chart with individual values', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [];
    const butPercentColumn = findDataColumnButton('Percent');

    // when
    butPercentColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount', 'Percent']);
    expect(component.countDistinctValuesEnabled).toBe(false);
    expect(component.individualValuesEnabled).toBe(true);
  });

  it('#click on data column should replace group by column when data column was used as group by column', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.dataColumns = [findColumn('Amount')];
    context.groupByColumns = [findColumn('Percent')];
    const butPercentColumn = findDataColumnButton('Percent');

    // when
    butPercentColumn.click();

    // then
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
  });

  it('#onColumnNameChanged should set aggregation type COUNT if column has text type', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.aggregations = [];

    // when
    component.onColumnChanged(findColumn('Path'));

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
    expect(component.countDistinctValuesEnabled).toBe(true);
    expect(component.individualValuesEnabled).toBe(false);
    expect(context.dataColumns.map(c => c.name)).toEqual(['Path']);
  });

  it('#onColumnNameChanged should enable individual values if column has number type', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.aggregations = [Aggregation.COUNT];

    // when
    component.onColumnChanged(findColumn('Amount'));

    // then
    expect(component.individualValuesEnabled).toBe(true);
    expect(component.countDistinctValuesEnabled).toBe(true);
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
  });

  it('#dataPanelName should return "Values" when non-grouping', () => {

    // given
    context.chartType = ChartType.DOUGHNUT.type;
    component.selectedChartType = ChartType.DOUGHNUT;

    // when
    const panelName = component.dataPanelName();

    // then
    expect(panelName).toEqual('Values');
  });

  it('#dataPanelName should return "Values (Y-Axis)" when single-grouping', () => {

    // given
    context.chartType = ChartType.AREA.type;
    component.selectedChartType = ChartType.AREA;

    // when
    const panelName = component.dataPanelName();

    // then
    expect(panelName).toEqual('Values (Y-Axis)');
  });

  it('#dataPanelName should return "Values (X-Axis)" when horizontal grouped bar chart', () => {

    // given
    context.chartType = ChartType.HORIZONTAL_BAR.type;
    component.selectedChartType = ChartType.HORIZONTAL_BAR;

    // when
    const panelName = component.dataPanelName();

    // then
    expect(panelName).toEqual('Values (X-Axis)');
  });

  it('#groupingPanelName should return "Name" when non-grouping', () => {

    // given
    context.chartType = ChartType.DOUGHNUT.type;
    component.selectedChartType = ChartType.DOUGHNUT;

    // when
    const panelName = component.groupingPanelName();

    // then
    expect(panelName).toEqual('Name');
  });


  it('#groupingPanelName should return "X-Axis" when non-horizontal chart', () => {

    // given
    context.chartType = ChartType.BAR.type;
    component.selectedChartType = ChartType.BAR;

    // when
    const panelName = component.groupingPanelName();

    // then
    expect(panelName).toEqual('X-Axis');
  });

  it('#groupingPanelName should return "Y-Axis" when horizontal chart', () => {

    // given
    context.chartType = ChartType.HORIZONTAL_BAR.type;
    component.selectedChartType = ChartType.HORIZONTAL_BAR;

    // when
    const panelName = component.groupingPanelName();

    // then
    expect(panelName).toEqual('Y-Axis');
  });

  it('#isCircularChart should return false when LINE chart', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;

    // when
    const actual = component.isCircularChart();

    // then
    expect(actual).toBe(false);
  });

  it('#isCircularChart should return true when PIE chart', () => {

    // given
    context.chartType = ChartType.PIE.type;
    component.selectedChartType = ChartType.PIE;

    // when
    const actual = component.isCircularChart();

    // then
    expect(actual).toBe(true);
  });

  it('#getSingleGroupByColumn should return undefined when no group-by columns exist', () => {

    // given
    context.groupByColumns = [];
    // when
    const column = component.getSingleGroupByColumn();

    // then
    expect(column).toBeUndefined();
  });

  it('#getSingleGroupByColumn should return column when group-by column exists', () => {

    // given
    const timeColumn = findColumn('Time');
    context.groupByColumns = [timeColumn];

    // when
    const column = component.getSingleGroupByColumn();

    // then
    expect(column).toBe(timeColumn);
  });

  it('#onGroupByColumnChanged when no-time column is provided', () => {

    // given
    const column = findColumn('Level');

    // when
    component.onGroupByColumnChanged(column);

    // then
    expect(context.groupByColumns).toEqual([column]);
    expect(component.groupByTimeColumn).toBeUndefined();
  });

  it('#onGroupByColumnChanged when time column is provided', () => {

    // given
    const column = findColumn('Time');

    // when
    component.onGroupByColumnChanged(column);

    // then
    expect(context.groupByColumns).toEqual([column]);
    expect(component.groupByTimeColumn).toBe(column);
  });

  it('#onAggregationTypeChanged should remove group-by columns when count distinct values is selected on category chart', () => {

    // given
    context.chartType = ChartType.BAR.type;
    context.dataColumns = [findColumn('Amount')];

    // when
    component.onAggregationTypeChanged(true);

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
    expect(context.groupByColumns).toEqual([]);
  });

  it('#onAggregationTypeChanged should fire single structure change event', fakeAsync(() => {

    // given
    context.chartType = ChartType.BAR.type;
    context.dataColumns = [findColumn('Amount')];
    const changeListener = vi.fn();
    context.subscribeToChanges(changeListener);

    // when
    component.onAggregationTypeChanged(true);

    // then
    flush();
    expect(changeListener).toHaveBeenCalledTimes(1);
    expect(changeListener).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
  }));

  it('#onAggregationTypeChanged should identify group-by column when individual values are selected', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.COUNT];

    // when
    component.onAggregationTypeChanged(false);

    // then
    expect(context.aggregations).toEqual([]);
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
  });

  it('#click on text data column should keep TIME group-by column and count distinct values on LINEAR_BAR chart', () => {

    // given
    context.chartType = ChartType.LINEAR_BAR.type;
    component.selectedChartType = ChartType.LINEAR_BAR;
    context.dataColumns = [findColumn('Amount')];
    const butHostColumn = findDataColumnButton('Host');

    // when
    butHostColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Host']);
    expect(context.isAggregationCountSelected()).toBe(true);
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
  });

  it('#click on text data column should keep user selected group-by column on LINE chart', () => {

    // given
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    component.onGroupByColumnChanged(findColumn('Path'));
    const butHostColumn = findDataColumnButton('Host');

    // when
    butHostColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Host']);
    expect(context.isAggregationCountSelected()).toBe(true);
    expect(context.groupByColumns).toEqual([findColumn('Path')]);
  });

  it('#click on number data column should select count distinct values on BAR chart when names are not unique', () => {

    // given
    context.entries = REPEATING_ENTRIES;
    context.chartType = ChartType.BAR.type;
    component.selectedChartType = ChartType.BAR;
    const butAmountColumn = findDataColumnButton('Amount');

    // when
    butAmountColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(context.isAggregationCountSelected()).toBe(true);
    expect(context.groupByColumns).toEqual([]);
    expect(component.individualValuesEnabled).toBe(false);
  });

  it('#click on number data column should select individual values on BAR chart when names are unique', () => {

    // given
    context.entries = [
      { Time: 1, Level: 'x', Host: 'h1', Path: 'p', Amount: 1, Percent: 1 },
      { Time: 1, Level: 'x', Host: 'h2', Path: 'p', Amount: 1, Percent: 1 }
    ];
    context.chartType = ChartType.BAR.type;
    component.selectedChartType = ChartType.BAR;
    const butAmountColumn = findDataColumnButton('Amount');

    // when
    butAmountColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(context.isAggregationCountSelected()).toBe(false);
    expect(context.groupByColumns).toEqual([findColumn('Host')]);
  });

  it('#click on LINE chart button should select TIME group-by column when count distinct values on BAR chart', () => {

    // given
    context.chartType = ChartType.BAR.type;
    component.selectedChartType = ChartType.BAR;
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.COUNT];
    const butChart = findChartButton(ChartType.LINE);

    // when
    butChart.click();

    // then
    expect(context.isAggregationCountSelected()).toBe(true);
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
  });

  it('#click on LINEAR_HORIZONTAL_BAR chart button should select TIME group-by column when count distinct values on HORIZONTAL_BAR chart', () => {

    // given
    context.chartType = ChartType.HORIZONTAL_BAR.type;
    component.selectedChartType = ChartType.HORIZONTAL_BAR;
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.COUNT];
    const butChart = findChartButton(ChartType.LINEAR_HORIZONTAL_BAR);

    // when
    butChart.click();

    // then
    expect(context.isAggregationCountSelected()).toBe(true);
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
  });

  it('#click on HORIZONTAL_BAR chart button should select count distinct values when names are not unique', () => {

    // given
    context.entries = REPEATING_ENTRIES;
    context.chartType = ChartType.LINEAR_HORIZONTAL_BAR.type;
    component.selectedChartType = ChartType.LINEAR_HORIZONTAL_BAR;
    context.dataColumns = [findColumn('Amount')];
    const butChart = findChartButton(ChartType.HORIZONTAL_BAR);

    // when
    butChart.click();

    // then
    expect(context.isAggregationCountSelected()).toBe(true);
    expect(context.groupByColumns).toEqual([]);
  });

  it('#click on BAR chart button should keep first data column only when no unique name column exists', () => {

    // given
    context.entries = REPEATING_ENTRIES;
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.dataColumns = [findColumn('Amount'), findColumn('Percent')];
    const butChart = findChartButton(ChartType.BAR);

    // when
    butChart.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(context.isAggregationCountSelected()).toBe(true);
    expect(context.groupByColumns).toEqual([]);
  });

  it('#click on BAR chart button should reset stacked when data columns are reduced', () => {

    // given
    context.entries = REPEATING_ENTRIES;
    context.chartType = ChartType.LINE.type;
    component.selectedChartType = ChartType.LINE;
    context.dataColumns = [findColumn('Amount'), findColumn('Percent')];
    context.stacked = true;
    const butChart = findChartButton(ChartType.BAR);

    // when
    butChart.click();

    // then
    expect(context.stacked).toBe(false);
  });

  it('#onAggregationTypeChanged should keep group-by column when count distinct values is selected on LINE chart', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Amount')];
    context.groupByColumns = [findColumn('Percent')];

    // when
    component.onAggregationTypeChanged(true);

    // then
    expect(context.isAggregationCountSelected()).toBe(true);
    expect(context.groupByColumns).toEqual([findColumn('Percent')]);
  });

  it('#onAggregationTypeChanged should select group-by column when individual values are selected on LINE chart without group-by column', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Amount')];
    context.splitColumns = [findColumn('Time')];
    context.groupByColumns = [];

    // when
    component.onAggregationTypeChanged(false);

    // then
    expect(context.isAggregationCountSelected()).toBe(false);
    expect(context.groupByColumns).toEqual([findColumn('Percent')]);
  });

  it('#ngOnChanges should enable individual values when number data column on LINE chart', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Amount')];

    // when
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });

    // then
    expect(component.individualValuesEnabled).toBe(true);
    expect(component.countDistinctValuesEnabled).toBe(true);
  });

  it('#ngOnChanges should disable individual values when text data column', () => {

    // given
    context.dataColumns = [findColumn('Host')];

    // when
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });

    // then
    expect(component.individualValuesEnabled).toBe(false);
    expect(component.countDistinctValuesEnabled).toBe(true);
  });

  it('time unit field should be hidden when group-by column is removed', () => {

    // given
    context.chartType = ChartType.LINE.type;
    fixture.detectChanges();

    // when
    context.groupByColumns = [];
    fixture.detectChanges();

    // then
    expect(formFieldLabels()).not.toContain('Time Unit Grouping');
    expect(component.groupByTimeColumn).toBeUndefined();
  });

  it('#groupByTimeColumn should return undefined when group-by column is not TIME', () => {

    // given
    context.groupByColumns = [findColumn('Host')];

    // when
    const column = component.groupByTimeColumn;

    // then
    expect(column).toBeUndefined();
  });

  it('group-by and time unit fields should be placed in field row', () => {

    // when
    context.chartType = ChartType.LINE.type;
    fixture.detectChanges();

    // then
    const fieldRow: HTMLElement = fixture.nativeElement.querySelector('.field_group_by').closest('.field-row');
    const labels = Array.from(fieldRow.querySelectorAll('mat-label')).map(l => l.textContent.trim());
    expect(labels).toEqual(['Group by', 'Time Unit Grouping']);
  });

  it('group-by options should exclude data columns', () => {

    // given
    context.chartType = ChartType.LINE.type;
    fixture.detectChanges();

    // when
    const options = openSelectOptions('Group by');

    // then
    expect(columnNames(options)).toEqual(['Time', 'Host', 'Path', 'Amount', 'Percent']);
  });

  it('name options should exclude data columns on PIE chart', () => {

    // given
    context.dataColumns = [findColumn('Amount')];
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
    fixture.detectChanges();

    // when
    const options = openSelectOptions('Name Column');

    // then
    expect(columnNames(options)).toEqual(['Time', 'Level', 'Host', 'Path', 'Percent']);
  });

  it('#timeUnitKey should return not grouped key when time unit is undefined', () => {

    // when
    const key = component.timeUnitKey(undefined);

    // then
    expect(key).toBe('ui.notGrouped');
  });

  it('legend position button should be shown for SCATTER chart when legend is shown', () => {

    // given
    context.chartType = ChartType.SCATTER.type;
    context.showLegend = true;

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('.span_legend button[mat-button]')).toBeTruthy();
  });

});

describe('ChartSideBarComponent - time aggregation', () => {

  const COLUMNS: Column[] = [
    { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.DAY, indexed: true },
    { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
  ];

  beforeEach(waitForAsync(() => {
    const columns = COLUMNS.map(c => ({ ...c }));
    setup(columns, columns[0], columns[2]);
    switchContextTo(ChartType.LINE);
  }));

  it('time aggregation options should be shown for LINE chart grouped by time column', () => {
    expect(optionTexts(openSelectOptions('Value Mode')))
      .toEqual(['Count Distinct Values', 'Individual Values', 'Aggregate Values', 'Count Rows']);
  });

  it('time aggregation options should be hidden for LINE chart grouped by text column', () => {

    // when
    context.groupByColumns = [findColumn('Level')];
    fixture.detectChanges();

    // then
    expect(optionTexts(openSelectOptions('Value Mode'))).toEqual(['Count Distinct Values', 'Individual Values']);
  });

  it('time aggregation options should be hidden for BAR chart', () => {

    // when
    switchContextTo(ChartType.BAR);
    context.groupByColumns = [findColumn('Time')];
    fixture.detectChanges();

    // then
    expect(optionTexts(openSelectOptions('Value Mode'))).toEqual(['Count Distinct Values', 'Individual Values']);
  });

  it('aggregate values option should be disabled when text data column is selected', () => {

    // given
    context.dataColumns = [findColumn('Level')];
    context.groupByColumns = [findColumn('Time')];

    // when
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
    fixture.detectChanges();

    // then
    const options = openSelectOptions('Value Mode');
    expect(findOption(options, 'Aggregate Values').getAttribute('aria-disabled')).toBe('true');
    expect(findOption(options, 'Count Rows').getAttribute('aria-disabled')).toBe('false');
  });

  it('#selection of aggregate values option should select SUM', () => {

    // when
    findOption(openSelectOptions('Value Mode'), 'Aggregate Values').click();

    // then
    expect(context.aggregations).toEqual([Aggregation.SUM]);
  });

  it('#selection of count rows option should select row count', () => {

    // when
    findOption(openSelectOptions('Value Mode'), 'Count Rows').click();

    // then
    expect(context.aggregations).toEqual([Aggregation.ROW_COUNT]);
    expect(context.dataColumns).toEqual([]);
  });

  it('selecting current aggregate values option should keep value aggregation', () => {

    // given
    component.onValueAggregationChanged(Aggregation.MAX);
    fixture.detectChanges();

    // when
    findOption(openSelectOptions('Value Mode'), 'Aggregate Values').click();

    // then
    expect(context.aggregations).toEqual([Aggregation.MAX]);
  });

  it('value mode should show selected aggregation mode', () => {

    // when
    component.onRowCountSelected();
    fixture.detectChanges();

    // then
    expect(fixture.debugElement.query(By.css('.field_aggregation_mode mat-select')).componentInstance.value).toBe('rowCount');
  });

  it.each<{ mode: AggregationMode; expected: Aggregation[] }>([
    { mode: 'count', expected: [Aggregation.COUNT] },
    { mode: 'individual', expected: [] },
    { mode: 'aggregate', expected: [Aggregation.SUM] },
    { mode: 'rowCount', expected: [Aggregation.ROW_COUNT] }
  ])('#onAggregationModeChanged should select $expected for mode $mode', ({ mode, expected }) => {

    // given
    context.aggregations = [Aggregation.MAX];

    // when
    component.onAggregationModeChanged(mode);

    // then
    expect(context.aggregations).toEqual(expected);
  });

  it('stacked checkbox should be placed in value mode row of non-circular chart', () => {

    // when
    const fieldRow: HTMLElement = fixture.nativeElement.querySelector('.field_aggregation_mode').closest('.field-row');

    // then
    expect(fieldRow.querySelector('mat-checkbox')).toBeTruthy();
  });

  it('value aggregation field should show selected aggregation', () => {

    // when
    component.onAggregateValuesSelected();
    fixture.detectChanges();

    // then
    const field = fixture.debugElement.query(By.css('.field_value_aggregation'));
    expect(field.query(By.css('mat-label')).nativeElement.textContent.trim()).toBe('Aggregation');
    expect(field.query(By.css('mat-select')).componentInstance.value).toBe(Aggregation.SUM);
  });

  it('#click on value aggregation option should change value aggregation', () => {

    // given
    component.onAggregateValuesSelected();
    fixture.detectChanges();
    const options = openSelectOptions('Aggregation');

    // when
    findOption(options, 'Max').click();

    // then
    expect(optionTexts(options)).toEqual(['Average', 'Median', 'Max', 'Min', 'Sum']);
    expect(context.aggregations).toEqual([Aggregation.MAX]);
  });

  it('value aggregation field should be hidden when individual values are selected', () => {
    expect(fixture.nativeElement.querySelector('.field_value_aggregation')).toBeNull();
  });

  it('time unit field should be shown for chart with value aggregation', () => {

    // when
    component.onAggregateValuesSelected();
    fixture.detectChanges();

    // then
    expect(formFieldLabels()).toContain('Time Unit Grouping');
  });

  it('time unit field should be shown for row count chart', () => {

    // when
    component.onRowCountSelected();
    fixture.detectChanges();

    // then
    expect(formFieldLabels()).toContain('Time Unit Grouping');
  });

  it('time unit field should be hidden for individual values', () => {
    expect(formFieldLabels()).not.toContain('Time Unit Grouping');
  });

  it('#onRowCountSelected should fire single structure change event', fakeAsync(() => {

    // given
    const changeListener = vi.fn();
    context.subscribeToChanges(changeListener);

    // when
    component.onRowCountSelected();

    // then
    flush();
    expect(changeListener).toHaveBeenCalledTimes(1);
    expect(changeListener).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
    expect(context.aggregations).toEqual([Aggregation.ROW_COUNT]);
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
  }));

  it('#click on number data column should select individual values when row count is selected', () => {

    // given
    component.onRowCountSelected();
    fixture.detectChanges();

    // when
    findDataColumnButton('Amount').click();

    // then
    expect(context.dataColumns).toEqual([findColumn('Amount')]);
    expect(context.aggregations).toEqual([]);
  });

  it('#click on text data column should select count distinct values when row count is selected', () => {

    // given
    component.onRowCountSelected();
    fixture.detectChanges();

    // when
    findDataColumnButton('Level').click();

    // then
    expect(context.dataColumns).toEqual([findColumn('Level')]);
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
  });

  it('#click on BAR chart button should reset value aggregation', () => {

    // given
    component.onAggregateValuesSelected();

    // when
    findChartButton(ChartType.BAR).click();

    // then
    expect(context.getValueAggregation()).toBeUndefined();
  });

  it('#click on BAR chart button should reset row count', () => {

    // given
    component.onRowCountSelected();

    // when
    findChartButton(ChartType.BAR).click();

    // then
    expect(context.isRowCountSelected()).toBe(false);
  });

  it('#click on AREA chart button should keep row count', () => {

    // given
    component.onRowCountSelected();

    // when
    findChartButton(ChartType.AREA).click();

    // then
    expect(context.aggregations).toEqual([Aggregation.ROW_COUNT]);
  });

  it('#click on PIE chart button should reset row count and shrink width like undefined chart', () => {

    // given
    component.onRowCountSelected();
    context.gridColumnSpan = 2;
    const initialWidth = context.width;

    // when
    findChartButton(ChartType.PIE).click();

    // then
    expect(context.isRowCountSelected()).toBe(false);
    expect(context.gridColumnSpan).toBe(1);
    expect(context.width).toBe(initialWidth / 2);
  });

  it('#click on LINEAR_BAR chart button should keep size of row count LINE chart', () => {

    // given
    component.onRowCountSelected();
    context.gridColumnSpan = 2;
    const initialWidth = context.width;

    // when
    findChartButton(ChartType.LINEAR_BAR).click();

    // then
    expect(context.aggregations).toEqual([Aggregation.ROW_COUNT]);
    expect(context.gridColumnSpan).toBe(2);
    expect(context.width).toBe(initialWidth);
  });

  it('#onAggregateValuesSelected should select default value aggregation', () => {

    // when
    component.onAggregateValuesSelected();

    // then
    expect(context.aggregations).toEqual([ChartSideBarComponent.DEFAULT_VALUE_AGGREGATION]);
    expect(ChartSideBarComponent.DEFAULT_VALUE_AGGREGATION).toBe(Aggregation.SUM);
  });

  it('#onGroupByColumnChanged should reset value aggregation when text group-by column is selected', () => {

    // given
    component.onAggregateValuesSelected();

    // when
    component.onGroupByColumnChanged(findColumn('Level'));

    // then
    expect(context.aggregations).toEqual([]);
  });

  it('#onGroupByColumnChanged should keep row count when time group-by column is selected', () => {

    // given
    component.onRowCountSelected();

    // when
    component.onGroupByColumnChanged(findColumn('Time'));

    // then
    expect(context.aggregations).toEqual([Aggregation.ROW_COUNT]);
  });

  it.each([
    { aggregations: [Aggregation.COUNT], mode: 'count' },
    { aggregations: [], mode: 'individual' },
    { aggregations: [Aggregation.AVG], mode: 'aggregate' },
    { aggregations: [Aggregation.ROW_COUNT], mode: 'rowCount' }
  ])('#aggregationMode should return $mode when aggregations are $aggregations', ({ aggregations, mode }) => {

    // given
    context.aggregations = aggregations;

    // when
    const aggregationMode = component.aggregationMode();

    // then
    expect(aggregationMode).toBe(mode);
  });

  it('#aggregationLabel should return label of aggregation', () => {

    // when
    const label = component.aggregationLabel(Aggregation.AVG);

    // then
    expect(label).toBe('Average');
  });

  function switchContextTo(chartType: ChartType): void {
    context.chartType = chartType.type;
    component.selectedChartType = chartType;
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
    fixture.detectChanges();
  }
});

describe('ChartSideBarComponent - computed columns', () => {

  const COLUMNS: Column[] = [
    { name: 'Name', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true },
    { name: 'Percent', dataType: DataType.NUMBER, width: 20, indexed: true },
    { name: 'Comment', dataType: DataType.TEXT, width: 100, indexed: false },
    computedColumn('Share', ComputeOperator.PERCENTAGE),
    computedColumn('Sum', ComputeOperator.ADD)
  ];

  beforeEach(waitForAsync(() => {
    const columns = COLUMNS.map(c => ({ ...c }));
    setup(columns, columns[0], columns[1]);
  }));

  it('#defineSelectableItems should offer computed and indexed columns as data columns', () => {
    expect(component.selectableDataColumns.map(c => c.name)).toEqual(['Name', 'Amount', 'Percent', 'Share', 'Sum']);
  });

  it('#defineSelectableItems should not offer computed columns as group-by columns', () => {
    expect(component.selectableGroupByColumns.map(c => c.name)).toEqual(['Name', 'Percent', 'Comment']);
  });

  it('#onComputedColumnCreated should select the context column of the created column', () => {

    // when
    component.onComputedColumnCreated(computedColumn('Share', ComputeOperator.PERCENTAGE));

    // then
    expect(context.dataColumns).toContain(findColumn('Share'));
  });

  it('#ngDoCheck should refresh the columns and aggregation options when the context columns were replaced', () => {

    // given
    component.countDistinctValuesEnabled = false;
    const columns = context.columns.filter(c => c.name !== 'Sum');

    // when
    context.updateColumns(columns);
    fixture.detectChanges();

    // then
    expect(component.selectableDataColumns.map(c => c.name)).toEqual(['Name', 'Amount', 'Percent', 'Share']);
    expect(component.countDistinctValuesEnabled).toBe(true);
  });

  it('data column buttons should list the renamed and not the deleted computed column', () => {

    // given
    const columns = context.columns
      .filter(c => c.name !== 'Sum')
      .map(c => c.name === 'Share' ? { ...c, name: 'Quota' } : c);

    // when
    context.updateColumns(columns, new Map([['Quota', 'Share']]));
    fixture.detectChanges();

    // then
    expect(dataColumnButtonTexts()).toEqual(['Name', 'Amount', 'Percent', 'Quota']);
  });

  it('data column button should show functions icon and formula tooltip of computed column', () => {

    // when
    const button = fixture.debugElement.queryAll(By.css('.but_column'))[3];

    // then
    expect(button.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('functions');
    expect(button.properties['matTooltip']).toBe('Amount as % of Percent');
  });

  it('edit launcher should only exist for computed columns', () => {

    // when
    const launchers = fixture.debugElement.queryAll(By.css('.span_data_column koia-computed-column-launcher'));

    // then
    expect(launchers.map(l => l.parent.query(By.css('.but_column')).nativeElement.textContent.trim().split(/\s+/).pop()))
      .toEqual(['Share', 'Sum']);
  });

  it('#columnSaved of create launcher should select the created column', () => {

    // given
    const launcher = fixture.debugElement.query(By.css('#div_sel_data_columns > koia-computed-column-launcher'));

    // when
    launcher.triggerEventHandler('columnSaved', computedColumn('Sum', ComputeOperator.ADD));

    // then
    expect(context.dataColumns).toContain(findColumn('Sum'));
  });

  function computedColumn(name: string, operator: ComputeOperator): Column {
    return {
      name, dataType: DataType.NUMBER, width: 70, indexed: false,
      computation: { leftColumn: 'Amount', operator, rightColumn: 'Percent' }
    };
  }

  function dataColumnButtonTexts(): string[] {
    return fixture.debugElement.queryAll(By.css('.but_column')).map(b => b.nativeElement.textContent.trim().split(/\s+/).pop());
  }
});

const REPEATING_ENTRIES = [
  { Time: 1, Level: 'x', Host: 'h', Path: 'p', Amount: 1, Percent: 1 },
  { Time: 1, Level: 'x', Host: 'h', Path: 'p', Amount: 1, Percent: 1 }
];

function setup(columns: Column[], baseColumn: Column, valueColumn: Column): void {
  TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    declarations: [ChartSideBarComponent, ScaleComponent, TicksComponent, KoiaFormDirective, SideBarHeaderComponent],
    imports: [
      MatExpansionModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatFormFieldModule,
      MatMenuModule, DragDropModule, MatSelectModule, MatInputModule, MatSliderModule
    ]
  })
    .overrideModule(MatIconModule, MatIconModuleMock.override())
    .compileComponents();

  fixture = TestBed.createComponent(ChartSideBarComponent);
  component = fixture.componentInstance;
  context = new ChartContext(columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
  context.dataColumns = [valueColumn];
  context.groupByColumns = [baseColumn];
  component.context = context;
  component.gridColumns = 4;
  component.elementCount = 3;
  component.elementPosition = 2;
  component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
  fixture.detectChanges();
}

function formFields(): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('mat-form-field'));
}

function formFieldLabels(): string[] {
  return Array.from(fixture.nativeElement.querySelectorAll('mat-form-field mat-label')).map((l: HTMLElement) => l.textContent.trim());
}

function openSelectOptions(label: string): HTMLElement[] {
  formFields().find(f => f.querySelector('mat-label')?.textContent.trim() === label)
    .querySelector<HTMLElement>('.mat-mdc-select-trigger').click();
  fixture.detectChanges();
  return Array.from(document.querySelectorAll('mat-option'));
}

function optionTexts(options: HTMLElement[]): string[] {
  return options.map(o => o.textContent.trim());
}

function columnNames(options: HTMLElement[]): string[] {
  return options.map(o => o.textContent.trim().split(/\s+/).pop());
}

function findOption(options: HTMLElement[], text: string): HTMLElement {
  return options.find(o => o.textContent.trim() === text);
}

function findColumn(name: string): Column {
  return context.columns.find(c => c.name === name);
}

function findChartButton(chartType: ChartType): HTMLButtonElement {
  const iChart = component.chartTypes.indexOf(chartType);
  return fixture.debugElement.queryAll(By.css('.but_chart_type'))[iChart].nativeElement;
}

function findDataColumnButton(columnName: string): HTMLButtonElement {
  const iColumn = component.selectableDataColumns.map(c => c.name).indexOf(columnName);
  return fixture.debugElement.queryAll(By.css('.but_column'))[iColumn].nativeElement;
}
