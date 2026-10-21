import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { SideBarController } from 'app/shared/controller';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { CommonUtils, DataTypeUtils } from 'app/shared/utils';
import { isAnalyzableColumn, isComputedColumn } from 'app/shared/utils/column-utils';
import { LanguageService } from 'app/shared/services/language';
import { Aggregation, Column, DataType, EnumLabels, TimeUnit, VALUE_AGGREGATIONS } from '../../shared/model';
import { GroupByColumnSelector } from './group-by-column-selector';

export type AggregationMode = 'count' | 'individual' | 'aggregate' | 'rowCount';

@Component({
  selector: 'koia-chart-side-bar',
  templateUrl: './chart-side-bar.component.html',
  styleUrls: ['./chart-side-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ChartSideBarComponent extends SideBarController implements OnChanges {

  static readonly DEFAULT_VALUE_AGGREGATION = Aggregation.SUM;

  @Input() context: ChartContext;

  selectedChartType: ChartType;
  selectableDataColumns: Column[];
  selectableGroupByColumns: Column[];
  countDistinctValuesEnabled: boolean;
  individualValuesEnabled: boolean;
  readonly chartTypes = ChartType.ALL;
  readonly legendPositions = ['top', 'right', 'bottom', 'left'];
  readonly valueAggregations = VALUE_AGGREGATIONS;

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
      .filter(isAnalyzableColumn)
      .filter(c => c.dataType !== DataType.TIME);
    this.selectableGroupByColumns = this.context.columns
      .filter(c => !isComputedColumn(c) && !this.context.dataColumns.includes(c));
    super.defineSelectableItems();
  }

  protected override onComputedColumnsChanged(): void {
    this.defineAggregationOptions();
    super.onComputedColumnsChanged();
  }

  onComputedColumnCreated(column: Column): void {
    this.onColumnChanged(this.contextColumnOf(column));
  }

  get groupByTimeColumn(): Column {
    const column = this.getSingleGroupByColumn();
    return column?.dataType === DataType.TIME ? column : undefined;
  }

  chartTypeColor(chartType: ChartType): string {
    return this.context.chartType === chartType.type ? 'accent' : 'basic';
  }

  switchTo(chartType: ChartType): void {
    this.resetUnavailableTimeAggregation(chartType.type);
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
    this.resetUnavailableTimeAggregation();
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
    this.resetUnavailableTimeAggregation();
  }

  private resetUnavailableTimeAggregation(chartType = this.context.chartType): void {
    if ((this.context.isRowCountSelected() || this.context.getValueAggregation()) && !this.isTimeAggregationAvailable(chartType)) {
      this.context.aggregations = [];
    }
  }

  onAggregationTypeChanged(countDistinctValues: boolean): void {
    this.context.aggregations = countDistinctValues ? [Aggregation.COUNT] : [];
    this.adjustGroupByColumns();
  }

  aggregationMode(): AggregationMode {
    if (this.context.isAggregationCountSelected()) {
      return 'count';
    } else if (this.context.isRowCountSelected()) {
      return 'rowCount';
    }
    return this.context.getValueAggregation() ? 'aggregate' : 'individual';
  }

  onAggregationModeChanged(mode: AggregationMode): void {
    switch (mode) {
      case 'count':
        this.onAggregationTypeChanged(true);
        break;
      case 'individual':
        this.onAggregationTypeChanged(false);
        break;
      case 'aggregate':
        this.onAggregateValuesSelected();
        break;
      default:
        this.onRowCountSelected();
    }
  }

  /**
   * values can be aggregated and rows counted per time unit on non-category charts grouped by a time column
   */
  isTimeAggregationAvailable(chartType = this.context.chartType): boolean {
    return !ChartType.isCategoryChart(ChartType.fromType(chartType)) && !!this.groupByTimeColumn;
  }

  aggregationLabel(aggregation: Aggregation): string {
    return EnumLabels.aggregation(aggregation);
  }

  onValueAggregationChanged(aggregation: Aggregation): void {
    this.context.aggregations = [aggregation];
    this.adjustGroupByColumns();
  }

  onAggregateValuesSelected(): void {
    this.onValueAggregationChanged(ChartSideBarComponent.DEFAULT_VALUE_AGGREGATION);
  }

  onRowCountSelected(): void {
    this.context.silent = true;
    this.context.dataColumns = [];
    this.context.silent = false;
    this.context.aggregations = [Aggregation.ROW_COUNT];
    this.adjustGroupByColumns();
    this.defineAggregationOptions();
    this.defineSelectableItems();
  }

  private adjustInitialChartWidth(newChartType: ChartType): void {
    if (!this.context.isDataDefined()) {
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
    this.resetUnavailableTimeAggregation();
  }
}
