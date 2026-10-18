import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { SideBarController } from 'app/shared/controller';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { CommonUtils, DataTypeUtils } from 'app/shared/utils';
import { LanguageService } from 'app/shared/services/language';
import { Aggregation, Column, DataType, EnumLabels, TimeUnit } from '../../shared/model';
import { GroupByColumnSelector } from './group-by-column-selector';

@Component({
  selector: 'koia-chart-side-bar',
  templateUrl: './chart-side-bar.component.html',
  styleUrls: ['./chart-side-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ChartSideBarComponent extends SideBarController implements OnChanges {

  @Input() context: ChartContext;

  selectedChartType: ChartType;
  selectableDataColumns: Column[];
  selectableGroupByColumns: Column[];
  countDistinctValuesEnabled: boolean;
  individualValuesEnabled: boolean;
  readonly chartTypes = ChartType.ALL;
  readonly legendPositions = ['top', 'right', 'bottom', 'left'];

  constructor(private chartMarginService: ChartMarginService, private languageService: LanguageService) {
    super();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    this.selectedChartType = ChartType.fromType(this.context.chartType);
    this.defineAggregationOptions();
    this.defineSelectableItems();
  }

  protected override defineSelectableItems() {
    this.selectableDataColumns = this.context.columns
      .filter(c => c.indexed)
      .filter(c => c.dataType !== DataType.TIME);
    this.selectableGroupByColumns = this.context.columns.filter(c => !this.context.dataColumns.includes(c));
    super.defineSelectableItems();
  }

  get groupByTimeColumn(): Column {
    const column = this.getSingleGroupByColumn();
    return column?.dataType === DataType.TIME ? column : undefined;
  }

  chartTypeColor(chartType: ChartType): string {
    return this.context.chartType === chartType.type ? 'accent' : 'basic';
  }

  switchTo(chartType: ChartType): void {
    if (this.context.isCircularChart() && !DataTypeUtils.containsNonNumericColumns(this.context.dataColumns)) {
      this.context.aggregations = [];
    }
    this.adjustInitialChartWidth(chartType);
    this.context.switchChartType(chartType.type, this.chartMarginService.marginOf(chartType));
    this.selectedChartType = chartType;
    this.adjustAggregation();
    this.adjustGroupByColumns();
    this.defineSelectableItems();
  }

  onColumnChanged(column: Column): void {
    const extendedDataColumns = this.context.dataColumns.concat(column);
    if (this.context.dataColumns.includes(column)) {
      this.context.removeDataColumn(column);
      this.resetStackedOfSingleDataColumn();
    } else if (!this.context.isAggregationCountSelected() &&
      !DataTypeUtils.containsNonNumericColumns(extendedDataColumns) &&
      new GroupByColumnSelector(this.context).hasValidColumnForIndividualValues(extendedDataColumns)) {
      this.context.addDataColumn(column);
    } else {
      this.context.dataColumns = [column];
    }
    this.adjustAggregation();
    this.adjustGroupByColumns();
    this.defineSelectableItems();
  }

  private defineAggregationOptions(): void {
    this.countDistinctValuesEnabled = this.context.dataColumns.length <= 1;
    this.individualValuesEnabled = !DataTypeUtils.containsNonNumericColumns(this.context.dataColumns) &&
      new GroupByColumnSelector(this.context).hasValidColumnForIndividualValues();
  }

  private adjustAggregation(): void {
    this.defineAggregationOptions();
    if (!this.individualValuesEnabled && !this.countDistinctValuesEnabled) {
      this.context.dataColumns = this.context.dataColumns.slice(0, 1);
      this.resetStackedOfSingleDataColumn();
      this.defineAggregationOptions();
    }
    if (!this.individualValuesEnabled && !this.context.isAggregationCountSelected()) {
      this.context.aggregations = [Aggregation.COUNT];
    }
  }

  private resetStackedOfSingleDataColumn(): void {
    if (this.context.dataColumns.length == 1 && this.context.stacked) {
      this.context.stacked = false;
    }
  }

  private adjustGroupByColumns(): void {
    const groupByColumns = new GroupByColumnSelector(this.context).select();
    if (!CommonUtils.compare(groupByColumns, this.context.groupByColumns)) {
      this.context.groupByColumns = groupByColumns;
    }
  }

  onAggregationTypeChanged(countDistinctValues: boolean): void {
    this.context.aggregations = countDistinctValues ? [Aggregation.COUNT] : [];
    this.adjustGroupByColumns();
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
      return this.languageService.instant('chart.values');
    }
    const axis = this.languageService.instant(this.context.isHorizontalChart() ? 'chart.xAxis' : 'chart.yAxis');
    return this.languageService.instant('chart.valuesOnAxis', { axis });
  }

  groupingPanelName(): string {
    if (this.context.isCircularChart()) {
      return this.languageService.instant('chart.name');
    } else {
      return this.languageService.instant(this.context.isHorizontalChart() ? 'chart.yAxis' : 'chart.xAxis');
    }
  }

  chartTypeLabel(chartType: ChartType): string {
    return EnumLabels.chartType(chartType.type);
  }

  timeUnitKey(timeUnit: TimeUnit): string {
    return timeUnit ? EnumLabels.timeUnitKey(timeUnit) : 'ui.notGrouped';
  }

  isCircularChart(): boolean {
    return this.context.isCircularChart();
  }

  getSingleGroupByColumn(): Column {
    return this.context.groupByColumns.length > 0 ? this.context.groupByColumns[0] : undefined;
  }

  onGroupByColumnChanged(column: Column): void {
    this.context.groupByColumns = [column];
  }
}
