import { Component, ElementRef, Inject, Input, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { ExportDataProvider } from 'app/shared/controller';
import { DBService } from 'app/shared/services/backend';
import { CommonUtils } from 'app/shared/utils';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { DataFrame, IDataFrame } from 'data-forge';
import { Subscription } from 'rxjs';
import { Aggregation, ChangeEvent, Column, DataType, Route, SummaryContext } from '../shared/model';
import { AggregationKeys, AggregationService, RawDataRevealService } from '../shared/services';
import { DataFrameSorter } from './data-frame-sorter';
import { ExportDataGenerator } from './export-data-generator';
import { RowSpanComputer, Span } from './row-span-computer';
import { SummaryDataComputer } from './summary-data-computer';
import { SummaryValueFormatter } from './summary-value-formatter';

@Component({
  selector: 'koia-summary-table',
  templateUrl: './summary-table.component.html',
  styleUrls: ['./summary-table.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SummaryTableComponent implements OnInit, OnDestroy, ExportDataProvider {

  @Input() context: SummaryContext;

  keys: AggregationKeys;
  aggregations: Aggregation[];
  frameColumns: string[];
  frameData: object[];
  overalls: number[];
  currentSort: Sort;
  rowSpans: Array<Span[]>;
  computing: boolean;

  private rowSpanComputer: RowSpanComputer;
  private baseDataFrame: IDataFrame<number, object>;
  private dataFrame: IDataFrame<number, object>;
  private dataFrameSorter = new DataFrameSorter();
  private valueFormatter = new SummaryValueFormatter();
  private exportDataGenerator = new ExportDataGenerator();
  private dataComputer: SummaryDataComputer;
  private contextSubscription: Subscription;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, private router: Router, private dbService: DBService,
    aggregationService: AggregationService, valueRangeGroupingService: ValueRangeGroupingService,
    private rawDataRevealService: RawDataRevealService) {
    this.dataComputer = new SummaryDataComputer(aggregationService, valueRangeGroupingService);
  }

  ngOnInit(): void {
    if (!this.dbService.getActiveScene()) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.rowSpanComputer = new RowSpanComputer();
      this.initSort();
      this.contextSubscription = this.context.subscribeToChanges((e: ChangeEvent) => this.contextChanged(e));
      this.createBaseDataFrame();
    }
  }

  private createBaseDataFrame(): void {
    this.baseDataFrame = new DataFrame(this.context.entries || []);
    if (this.context.hasDataColumn()) {
      this.refreshDataFrameAsync(ChangeEvent.STRUCTURE);
    } else {
      this.clearData();
    }
  }

  private clearData(): void {
    this.dataFrame = undefined;
    this.keys = undefined;
    this.aggregations = undefined;
    this.frameColumns = undefined;
    this.frameData = undefined;
    this.rowSpans = undefined;
    this.overalls = undefined;
  }

  private contextChanged(e: ChangeEvent): void {
    if (e === ChangeEvent.STRUCTURE) {
      this.createBaseDataFrame()
    } else {
      this.refreshDataFrameAsync(e)
    }
  }

  onAggregationCellClick(entry: object): void {
    const groupByColumns = this.context.groupByColumns;
    const columns = groupByColumns //
      .filter(c => c.dataType !== DataType.TIME) //
      .concat(this.context.dataColumns[0]);
    const columnValues = columns.map(c => entry[c.name]);
    if (groupByColumns.find(c => c.dataType === DataType.TIME) !== undefined) {
      const groupByKeys = this.keys.groupBy;
      const timeColumns = groupByColumns.filter(c => c.dataType === DataType.TIME);
      const startTimes = timeColumns.map(c => entry[groupByKeys[groupByColumns.indexOf(c)]]);
      this.rawDataRevealService.ofTimeUnit(this.context.query, timeColumns, startTimes, columns.map(c => c.name), columnValues,
        this.context);
    } else {
      this.rawDataRevealService.ofQuery(this.context.query, columns.map(c => c.name), columnValues, this.context);
    }
  }

  /**
   * sorts count tables by their first group-by column, other tables by their data column
   */
  private initSort(): void {
    let active: string;
    if (this.context.isAggregationCountSelected() && this.context.groupByColumns.length > 0) {
      active = new AggregationKeys(this.context).groupBy[0];
    } else {
      active = this.context.hasDataColumn() ? this.context.dataColumns[0].name : undefined;
    }
    this.currentSort = { active: active, direction: 'asc' };
  }

  refreshDataFrameAsync(changeEvent: ChangeEvent): void {
    Promise.resolve().then(() => this.refreshDataFrame(changeEvent));
  }

  private async refreshDataFrame(changeEvent: ChangeEvent): Promise<void> {
    if (changeEvent === ChangeEvent.SIZE) {
      return;
    }
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    if (this.context.hasDataColumn()) {
      const { dataFrame, overalls } = this.dataComputer.compute(this.baseDataFrame, this.context);
      this.keys = new AggregationKeys(this.context);
      this.aggregations = this.context.aggregations;
      this.dataFrame = dataFrame;
      this.frameColumns = this.keys.all;
      this.overalls = overalls;
      this.sortDataFrame();
    }
    this.computing = false;
  }

  async sort(sort: Sort): Promise<void> {
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    if (this.dataFrame) {
      this.currentSort = sort;
      this.sortDataFrame();
    }
    this.computing = false;
  }

  private sortDataFrame(): void {
    this.dataFrame = this.dataFrameSorter.sort(this.dataFrame, this.currentSort, this.context);
    this.frameData = this.dataFrame.toArray();
    if (this.frameData.length > 0) {
      this.computeRowSpans();
    }
  }

  /**
   * computes row spans for the leading columns; the column immediately preceding the aggregation columns needs none, it is however
   * included to keep the HTML simple
   */
  private computeRowSpans(): void {
    this.rowSpans = this.rowSpanComputer.compute(this.frameData, this.keys.leading);
  }

  formattedValueOf(columnIndex: number, value: string | number | boolean): string | boolean {
    return this.computing ? '' : this.valueFormatter.format(this.context.groupByColumns, columnIndex, value);
  }

  createExportData(): object[] {
    return this.exportDataGenerator.generate(this.context, this.dataFrame, this.overalls);
  }

  /**
   * @returns the columns among the specified ones whose exported values are converted by data type
   */
  createExportColumns(columns: Column[]): Column[] {
    return this.exportDataGenerator.columnsOf(this.context, columns);
  }

  ngOnDestroy(): void {
    this.contextSubscription?.unsubscribe();
  }
}
