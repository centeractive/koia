import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartSideBarComponent } from './chart-side-bar.component';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Column, Aggregation, DataType, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HAMMER_LOADER, By } from '@angular/platform-browser';
import { MatIconModuleMock } from 'app/shared/test';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule, MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';

describe('ChartSideBarComponent', () => {

  let columns: Column[];
  let context: ChartContext;
  let component: ChartSideBarComponent;
  let fixture: ComponentFixture<ChartSideBarComponent>;

  beforeAll(() => {
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
      { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true },
      { name: 'Percent', dataType: DataType.NUMBER, width: 20, indexed: true }
    ];
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ChartSideBarComponent],
      imports: [
        MatExpansionModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatFormFieldModule,
        MatMenuModule, DragDropModule, BrowserAnimationsModule, MatSelectModule
      ],
      providers: [
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    })
      .overrideModule(MatIconModule, MatIconModuleMock.override())
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartSideBarComponent);
    component = fixture.componentInstance;
    context = new ChartContext(columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    context.dataColumns = [findColumn('Level')];
    context.groupByColumns = [findColumn('Time')];

    component.context = context;
    component.gridColumns = 4;
    component.elementCount = 3;
    component.elementPosition = 2;
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize fields', () => {
    expect(component.selectableDataColumns).toEqual(columns.filter(c => c.name !== 'Time'));
    const currentNonGroupByColumns = columns.filter(n => !context.groupByColumns.includes(n));
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

  it('#click on PIE chart button should decrease number of data columns to one', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.aggregations = [];
    context.dataColumns = [findColumn('Amount'), findColumn('Percent')];
    const butChart = findChartButton(ChartType.PIE);

    // when
    butChart.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(component.countDistinctValuesEnabled).toBeTruthy();
    expect(component.individualValuesEnabled).toBeTruthy();
  });

  it('#click on LINE chart button should switch to individual values when number data column is selected', () => {

    // given
    context.chartType = ChartType.PIE.type;
    context.dataColumns = [findColumn('Amount')];
    const butChart = findChartButton(ChartType.LINE);

    // when
    butChart.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(component.countDistinctValuesEnabled).toBeTruthy();
    expect(component.individualValuesEnabled).toBeTruthy();
    expect(context.isAggregationCountSelected()).toBeFalsy();
  });

  it('side bar should contain button for each non-time column', () => {
    const butColumnDebugElements = fixture.debugElement.queryAll(By.css('.but_column'));
    const nonTimeColumns = columns.filter(c => c.name !== 'Time');

    expect(butColumnDebugElements.length).toBe(nonTimeColumns.length);
  });

  it('#click on data column button should invoke #onColumnChanged', () => {

    // given
    spyOn(component, 'onColumnChanged');
    const butDataColumn = findDataColumnButton('Path');

    // when
    butDataColumn.click();

    // then
    expect(component.onColumnChanged).toHaveBeenCalled();
  });

  it('#click on data column button should remove previous data column when chart is non-grouping', () => {

    // given
    context.chartType = ChartType.PIE.type;
    const butDataColumnDebugElements = fixture.debugElement.queryAll(By.css('.but_column'));

    butDataColumnDebugElements.forEach(e => {

      // when
      e.nativeElement.click();

      // then
      expect(context.dataColumns.length).toBe(1);
    });
  });

  it('#click on data column should remove data column when it was selected with another data columns', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Level'), findColumn('Amount')];
    const butDataColumn = findDataColumnButton('Level');

    // when
    butDataColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
    expect(component.countDistinctValuesEnabled).toBeTruthy();
    expect(component.individualValuesEnabled).toBeTruthy();
  });

  it('#click on data column should keep column selected if it was the only selected one', () => {

    // given
    const butDataColumn = findDataColumnButton('Level');

    // when
    butDataColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Level']);
    expect(component.countDistinctValuesEnabled).toBeTruthy();
    expect(component.individualValuesEnabled).toBeFalsy();
  });

  it('#click on text data column should remove column when chart is LINE chart and other column remains selected', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Amount')];
    const butDataColumn = findDataColumnButton('Host');

    // when
    butDataColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Host']);
    expect(component.countDistinctValuesEnabled).toBeTruthy();
    expect(component.individualValuesEnabled).toBeFalsy();
  });

  it('#click on number data column button should replace number data column when chart is LINE chart with count distinct values', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.COUNT];
    const butDataColumn = findDataColumnButton('Percent');

    // when
    butDataColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Percent']);
    expect(component.countDistinctValuesEnabled).toBeTruthy();
    expect(component.individualValuesEnabled).toBeTruthy();
  });

  it('#click on number data column button should keep existing number data column when chart is LINE chart with individual values', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [];
    const butDataColumn = findDataColumnButton('Percent');

    // when
    butDataColumn.click();

    // then
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount', 'Percent']);
    expect(component.countDistinctValuesEnabled).toBeFalsy();
    expect(component.individualValuesEnabled).toBeTruthy();
  });

  it('#click on data column should replace group by column when data column was used as group by column', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.dataColumns = [findColumn('Amount')];
    context.groupByColumns = [findColumn('Percent')];
    const butDataColumn = findDataColumnButton('Percent');

    // when
    butDataColumn.click();

    // then
    expect(context.groupByColumns).toEqual([findColumn('Time')]);
  });

  it('#onColumnNameChanged should set aggregation type COUNT if column has text type', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.aggregations = [];

    // when
    component.onColumnChanged(findColumn('Path'));

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
    expect(component.countDistinctValuesEnabled).toBeTruthy();
    expect(component.individualValuesEnabled).toBeFalsy();
    expect(context.dataColumns.map(c => c.name)).toEqual(['Path']);
  });

  it('#onColumnNameChanged should enable individual values if column has number type', () => {

    // given
    context.chartType = ChartType.LINE.type;
    context.aggregations = [Aggregation.COUNT];

    // when
    component.onColumnChanged(findColumn('Amount'));

    // then
    expect(component.individualValuesEnabled).toBeTruthy();
    expect(component.countDistinctValuesEnabled).toBeTruthy();
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
    expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
  });

  it('#dataPanelName should return "Values" when non-grouping', () => {

    // given
    context.chartType = ChartType.DONUT.type;

    // when
    const panelName = component.dataPanelName();

    // then
    expect(panelName).toEqual('Values');
  });

  it('#dataPanelName should return "Values (Y-Axis)" when single-grouping', () => {

    // given
    context.chartType = ChartType.AREA.type;

    // when
    const panelName = component.dataPanelName();

    // then
    expect(panelName).toEqual('Values (Y-Axis)');
  });

  it('#dataPanelName should return "Values (X-Axis)" when horizontal grouped bar chart', () => {

    // given
    context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;

    // when
    const panelName = component.dataPanelName();

    // then
    expect(panelName).toEqual('Values (X-Axis)');
  });

  it('#dataPanelName should return "Values" when multiple-grouping', () => {

    // given
    context.chartType = ChartType.SUNBURST.type;

    // when
    const panelName = component.dataPanelName();

    // then
    expect(panelName).toEqual('Values');
  });

  it('#groupingPanelName should return "Name" when non-grouping', () => {

    // given
    context.chartType = ChartType.DONUT.type;

    // when
    const panelName = component.groupingPanelName();

    // then
    expect(panelName).toEqual('Name');
  });

  it('#groupingPanelName should return "Hierarchy" when multiple grouping available', () => {

    // given
    context.chartType = ChartType.SUNBURST.type;

    // when
    const panelName = component.groupingPanelName();

    // then
    expect(panelName).toEqual('Hierarchy');
  });

  it('#groupingPanelName should return "X-Axis" when non-horizontal chart', () => {

    // given
    context.chartType = ChartType.MULTI_BAR.type;

    // when
    const panelName = component.groupingPanelName();

    // then
    expect(panelName).toEqual('X-Axis');
  });

  it('#groupingPanelName should return "Y-Axis" when horizontal chart', () => {

    // given
    context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;

    // when
    const panelName = component.groupingPanelName();

    // then
    expect(panelName).toEqual('Y-Axis');
  });

  it('#isPieOrDonutChart should return false when not PIE or DONUT chart', () => {

    // given
    context.chartType = ChartType.LINE_WITH_FOCUS.type;

    // when
    const actual = component.isPieOrDonutChart();

    // then
    expect(actual).toBeFalsy();
  });

  it('#isPieOrDonutChart should return true when PIE chart', () => {

    // given
    context.chartType = ChartType.PIE.type;

    // when
    const actual = component.isPieOrDonutChart();

    // then
    expect(actual).toBeTruthy();
  });

  it('#isPieOrDonutChart should return true when DONUT chart', () => {

    // given
    context.chartType = ChartType.DONUT.type;

    // when
    const actual = component.isPieOrDonutChart();

    // then
    expect(actual).toBeTruthy();
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

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }

  function findChartButton(chartType: ChartType): HTMLButtonElement {
    const iChart = component.chartTypes.indexOf(chartType);
    return fixture.debugElement.queryAll(By.css('.but_chart_type'))[iChart].nativeElement;
  }

  function findDataColumnButton(columnName: string): HTMLButtonElement {
    const iColumn = component.selectableDataColumns.map(c => c.name).indexOf(columnName);
    return fixture.debugElement.queryAll(By.css('.but_column'))[iColumn].nativeElement;
  }
});
