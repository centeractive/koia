import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartContext, ChartType, Aggregation, DataType, Column, GroupingType } from '../shared/model';
import { SideBarController } from 'app/shared/controller';
import { ChartMarginService } from 'app/shared/services/chart-margin.service';
import { DataTypeUtils } from 'app/shared/utils';

@Component({
  selector: 'koia-chart-side-bar',
  templateUrl: './chart-side-bar.component.html',
  styleUrls: ['./chart-side-bar.component.css']
})
export class ChartSideBarComponent extends SideBarController implements OnChanges {

  @Input() context: ChartContext;

  selectedChartType: ChartType;
  selectableDataColumns: Column[];
  countDistinctValuesEnabled = true;
  individualValuesEnabled: boolean;
  groupByTimeColumn: Column;
  readonly chartTypes = ChartType.ALL;
  readonly legendPositions = ['top', 'bottom'];

  constructor(private chartMarginService: ChartMarginService) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    this.selectedChartType = ChartType.fromType(this.context.chartType);
    this.defineSelectableItems();
  }

  protected defineSelectableItems() {
    if (this.context) {
      this.selectableDataColumns = this.context.columns
        .filter(c => c.indexed)
        .filter(c => c.dataType !== DataType.TIME);
      this.selectedGroupByColumns = this.context.groupByColumns;
      if (this.selectedGroupByColumns.length > 0 && this.selectedGroupByColumns[0].dataType === DataType.TIME) {
        this.groupByTimeColumn = this.selectedGroupByColumns[0];
      }
    }
    super.defineSelectableItems();
  }

  chartTypeColor(chartType: ChartType): string {
    return this.context.chartType === chartType.type ? 'accent' : '';
  }

  setChartType(chartType: ChartType): void {
    if (chartType.groupingType === GroupingType.NONE) {
      if (this.context.dataColumns.length > 1) {
        this.context.dataColumns = this.context.dataColumns.slice(0, 1);
      }
    } else if (this.context.isNonGrouping() && !DataTypeUtils.containsNonNumericColumns(this.context.dataColumns)) {
      this.context.aggregations = [];
    }
    this.adjustInitialChartWidth(chartType);
    this.selectedChartType = chartType;
    this.context.switchChartType(chartType.type, this.chartMarginService.marginOf(chartType));
    this.adjustAggregation();
    this.defineSelectableItems();
  }

  onColumnChanged(column: Column): void {
    if (this.context.dataColumns.includes(column)) {
      if (this.context.dataColumns.length > 1) {
        this.context.removeDataColumn(column);
      }
    } else {
      if (this.context.isNonGrouping() || this.context.isAggregationCountSelected() ||
        DataTypeUtils.containsNonNumericColumns(this.context.dataColumns.concat(column))) {
        this.context.dataColumns = [column];
      } else {
        this.context.addDataColumn(column);
      }
    }
    this.adjustAggregation();
    this.defineSelectableItems();
  }

  private adjustAggregation(): void {
    this.individualValuesEnabled = !DataTypeUtils.containsNonNumericColumns(this.context.dataColumns);
    this.countDistinctValuesEnabled = this.context.dataColumns.length <= 1;
    if (!this.individualValuesEnabled) {
      this.onAggregationTypeChanged(true);
    }
  }

  onAggregationTypeChanged(countDistinctValues: boolean): void {
    this.context.aggregations = countDistinctValues ? [Aggregation.COUNT] : [];
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
    return chartType === ChartType.MULTI_BAR || chartType === ChartType.LINE || chartType === ChartType.LINE_WITH_FOCUS ||
      chartType === ChartType.AREA || chartType === ChartType.SCATTER;
  }

  dataPanelName(): string {
    if (this.context.isNonGrouping() || this.context.isMultipleGrouping()) {
      return 'Values';
    }
    return 'Values (' + (this.context.chartType.toLowerCase().includes('horizontal') ? 'X-Axis' : 'Y-Axis') + ')';
  }

  groupingPanelName(): string {
    if (this.context.isNonGrouping()) {
      return 'Name';
    } else if (this.context.isMultipleGrouping()) {
      return 'Hierarchy';
    } else {
      return this.context.chartType.toLowerCase().includes('horizontal') ? 'Y-Axis' : 'X-Axis';
    }
  }

  isPieOrDonutChart(): boolean {
    return this.context.chartType === ChartType.PIE.type || this.context.chartType === ChartType.DONUT.type;
  }

  getSingleGroupByColumn(): Column {
    return this.context.groupByColumns.length > 0 ? this.context.groupByColumns[0] : undefined;
  }


  onGroupByColumnChanged(column: Column): void {
    this.context.groupByColumns = [column];
    this.groupByTimeColumn = column.dataType === DataType.TIME ? column : undefined;
  }
}
