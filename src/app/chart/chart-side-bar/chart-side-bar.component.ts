import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SideBarController } from 'app/shared/controller';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { ChartUtils, DataTypeUtils } from 'app/shared/utils';
import { Aggregation, Column, DataType } from '../../shared/model';

@Component({
  selector: 'koia-chart-side-bar',
  templateUrl: './chart-side-bar.component.html',
  styleUrls: ['./chart-side-bar.component.css'],
  standalone: false
})
export class ChartSideBarComponent extends SideBarController implements OnChanges {

  @Input() context: ChartContext;

  selectedChartType: ChartType;
  selectableDataColumns: Column[];
  countDistinctValuesEnabled = true;
  individualValuesEnabled: boolean;
  groupByTimeColumn: Column;
  readonly chartTypes = ChartType.ALL;
  readonly legendPositions = ['top', 'right', 'bottom', 'left'];

  constructor(private chartMarginService: ChartMarginService) {
    super();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    this.selectedChartType = ChartType.fromType(this.context.chartType);
    this.defineSelectableItems();
  }

  protected override defineSelectableItems() {
    this.selectableDataColumns = this.context.columns
      .filter(c => c.indexed)
      .filter(c => c.dataType !== DataType.TIME);
    super.defineSelectableItems();
    if (this.selectedGroupByColumns.length > 0 && this.selectedGroupByColumns[0].dataType === DataType.TIME) {
      this.groupByTimeColumn = this.selectedGroupByColumns[0];
    }
  }

  chartTypeColor(chartType: ChartType): string {
    return this.context.chartType === chartType.type ? 'accent' : 'basic';
  }

  switchTo(chartType: ChartType): void {
    if (this.context.isCircularChart() && !DataTypeUtils.containsNonNumericColumns(this.context.dataColumns)) {
      this.context.aggregations = [];
    }
    if (this.context.isCategoryChart() && this.context.isAggregationCountSelected()) {
      this.context.groupByColumns = [];
    }

    this.adjustInitialChartWidth(chartType);
    this.selectedChartType = chartType;
    this.context.switchChartType(chartType.type, this.chartMarginService.marginOf(chartType));
    this.adjustAggregation();
    this.defineSelectableItems();
  }

  onColumnChanged(column: Column): void {
    if (this.context.dataColumns.includes(column)) {
      this.context.removeDataColumn(column);
      if (this.context.dataColumns.length == 1 && this.context.stacked) {
        this.context.stacked = false;
      }
    } else if (this.context.isAggregationCountSelected() ||
      DataTypeUtils.containsNonNumericColumns(this.context.dataColumns.concat(column))) {
      this.context.dataColumns = [column];
      this.context.groupByColumns = [];
    } else {
      this.context.addDataColumn(column);
    }
    this.defineGroupByColumns();
    this.adjustAggregation();
    this.defineSelectableItems();
  }

  selectableGroupByColumns(): Column[] {
    if (this.selectedChartType === ChartType.SCATTER) {
      return this.context.getNumericColumns();
    }
    return this.context.columns;
  }

  private defineGroupByColumns(): void {
    if (this.context.groupByColumns.length === 0) {
      this.context.groupByColumns = ChartUtils.identifyGroupByColumns(this.context);
    }
  }

  private adjustAggregation(): void {
    this.individualValuesEnabled = !DataTypeUtils.containsNonNumericColumns(this.context.dataColumns);
    this.countDistinctValuesEnabled = this.context.dataColumns.length <= 1;
    if (!this.individualValuesEnabled) {
      this.onAggregationTypeChanged(!this.individualValuesEnabled);
    }
  }

  onAggregationTypeChanged(countDistinctValues: boolean): void {
    this.context.aggregations = countDistinctValues ? [Aggregation.COUNT] : [];
    if (countDistinctValues) {
      this.context.groupByColumns = []; // TODO: is this correct?
    }
  }

  private adjustInitialChartWidth(newChartType: ChartType): void {
    if (!this.context.hasDataColumn()) {
      const isNewTypeLarge = this.isLargeChartType(newChartType);
      if (this.isLargeChartType(this.selectedChartType) !== isNewTypeLarge) {
        this.context.gridColumnSpan = Math.min(this.gridColumns, isNewTypeLarge ? 2 : 1);
        const width = isNewTypeLarge ? this.context.width * 2 : this.context.width / 2;
        this.context.setSize(width, this.context.height);
      }
    }
  }

  private isLargeChartType(chartType: ChartType): boolean {
    return chartType === ChartType.LINE || chartType === ChartType.AREA || chartType === ChartType.SCATTER;
  }

  dataPanelName(): string {
    if (this.context.isCircularChart()) {
      return 'Values';
    }
    return 'Values (' + (this.context.isHorizontalChart() ? 'X-Axis' : 'Y-Axis') + ')';
  }

  groupingPanelName(): string {
    if (this.context.isCircularChart()) {
      return 'Name';
    } else {
      return this.context.isHorizontalChart() ? 'Y-Axis' : 'X-Axis';
    }
  }

  isCircularChart(): boolean {
    return this.context.isCircularChart();
  }

  getSingleGroupByColumn(): Column {
    return this.context.groupByColumns.length > 0 ? this.context.groupByColumns[0] : undefined;
  }

  onGroupByColumnChanged(column: Column): void {
    this.context.groupByColumns = [column];
    this.groupByTimeColumn = column.dataType === DataType.TIME ? column : undefined;
  }
}
