import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { Sort } from '@angular/material';
import { Observable } from 'rxjs';
import { AggregationService, RawDataRevealService } from '../shared/services';
import { ChangeEvent, Aggregation, SummaryContext, Column, Route, DataType } from '../shared/model';
import { IDataFrame, DataFrame } from 'data-forge';
import { DateTimeUtils, CommonUtils, ColumnNameConverter } from 'app/shared/utils';
import { RowSpanComputer, Span } from './row-span-computer';
import { DatePipe } from '@angular/common';
import { DataFrameSorter } from './data-frame-sorter';
import { Router } from '@angular/router';
import { DBService } from 'app/shared/services/backend';
import { ExportDataProvider } from 'app/shared/controller';
import { ExportDataGenerator } from './export-data-generator';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { NumberFormatter } from 'app/shared/format';

@Component({
  selector: 'koia-summary-table',
  templateUrl: './summary-table.component.html',
  styleUrls: ['./summary-table.component.css']
})
export class SummaryTableComponent implements OnInit, OnChanges, ExportDataProvider {

  @Input() context: SummaryContext;
  @Input() entries$: Observable<Object[]>;
  @Input() gridView: boolean;

  @ViewChild('content', undefined) divContentRef: ElementRef<HTMLDivElement>;

  frameColumns: string[];
  frameData: Object[];
  overalls: number[];
  currentSort: Sort;
  rowSpans: Array<Span[]>;
  computing: boolean;

  private rowSpanComputer: RowSpanComputer;
  private baseDataFrame: IDataFrame<number, any>;
  private dataFrame: IDataFrame<number, any>;
  private dataFrameSorter = new DataFrameSorter();
  private numberFormatter = new NumberFormatter();
  private datePipe = new DatePipe('en-US');
  private exportDataGenerator = new ExportDataGenerator();

  constructor(private router: Router, private dbService: DBService, private aggregationService: AggregationService,
    private valueRangeGroupingService: ValueRangeGroupingService, private rawDataRevealService: RawDataRevealService) { }

  ngOnInit() {
    if (!this.dbService.getActiveScene()) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.rowSpanComputer = new RowSpanComputer();
      this.initSort();
      this.context.subscribeToChanges((e: ChangeEvent) => this.refreshDataFrameAsync(e));
      this.entries$.subscribe(entries => this.createBaseDataFrame(entries));
      this.adjustSize();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries$']) {
      this.entries$.subscribe(entries => this.createBaseDataFrame(entries));
    }
  }

  private createBaseDataFrame(entries: Object[]): void {
    this.baseDataFrame = new DataFrame(entries);
    if (this.context.hasDataColumn()) {
      this.refreshDataFrame(ChangeEvent.STRUCTURE);
    }
  }

  onAggregationCellClick(entry: Object): void {
    const columns = this.context.groupByColumns //
      .filter(c => c.dataType !== DataType.TIME) //
      .concat(this.context.dataColumns[0])
    const columnValues = columns.map(c => entry[c.name]);
    if (this.context.groupByColumns.find(c => c.dataType === DataType.TIME) !== undefined) {
      const timeColumns = this.context.groupByColumns.filter(c => c.dataType === DataType.TIME);
      const startTimes = timeColumns.map(c => entry[ColumnNameConverter.toLabel(c, c.groupingTimeUnit)]);
      this.rawDataRevealService.ofTimeUnit(this.context.query, timeColumns, startTimes, columns.map(c => c.name), columnValues,
        this.context);
    } else {
      this.rawDataRevealService.ofQuery(this.context.query, columns.map(c => c.name), columnValues, this.context);
    }
  }

  private initSort(): void {
    const active = this.context.hasDataColumn() ? this.context.dataColumns[0].name : undefined;
    this.currentSort = { active: active, direction: 'asc' };
  }

  refreshDataFrameAsync(changeEvent: ChangeEvent): void {
    Promise.resolve().then(() => this.refreshDataFrame(changeEvent));
  }

  private async refreshDataFrame(changeEvent: ChangeEvent): Promise<void> {
    if (changeEvent === ChangeEvent.SIZE) {
      this.adjustSize();
      return;
    }
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    const data = this.valueRangeGroupingService.compute(this.baseDataFrame, this.context.valueGroupings);
    this.dataFrame = this.aggregationService.compute(data, this.context);
    this.frameColumns = this.dataFrame.getColumnNames();
    this.sortDataFrame();
    this.overalls = this.computeOveralls();
    this.computing = false;
  }

  async sort(sort: Sort): Promise<void> {
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    this.currentSort = sort;
    this.sortDataFrame();
    this.computing = false;
  }

  private sortDataFrame() {
    this.dataFrame = this.dataFrameSorter.sort(this.dataFrame, this.currentSort, this.context);
    this.frameData = this.dataFrame.toArray();
    if (this.frameData.length > 0) {
      this.computeRowSpans();
    }
  }

  /**
   * computes row spans for the leading columns, no row spans are needed for the aggregation columns and the column that immediatly
   * preceds them. To keep the HTML simple, we however also include latter in row span comuting.
   */
  private computeRowSpans(): void {
    const columnNames = this.dataFrame.getColumnNames().slice(0, -1);
    this.rowSpans = this.rowSpanComputer.compute(this.frameData, columnNames);
  }

  private computeOveralls(): number[] {
    return this.context.aggregations.map(a => {
      const series = this.dataFrame.getSeries(a);
      const aggregation = a === Aggregation.COUNT ? Aggregation.SUM : a;
      return this.aggregationService.aggregateValue(series, aggregation);
    });
  }

  formattedValueOf(columnIndex: number, value: any): any {
    if (this.computing) {
      return '';
    } else if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean') {
      return value;
    }
    let column: Column;
    if (this.context.groupByColumns.length > 0 && columnIndex < this.context.groupByColumns.length) {
      column = this.context.groupByColumns[columnIndex];
      if (column.dataType === DataType.TIME && column.groupingTimeUnit) {
        return this.datePipe.transform(value, DateTimeUtils.ngFormatOf(column.groupingTimeUnit));
      }
    }
    return this.numberFormatter.format(value);
  }

  private adjustSize() {
    if (!this.gridView) {
      const style = this.divContentRef.nativeElement.style;
      if (!this.context.hasUnlimitedWidth()) {
        style.maxWidth = this.context.width + 'px';
      }
      style.maxHeight = this.context.height + 'px';
    }
  }

  createExportData(): Object[] {
    return this.exportDataGenerator.generate(this.context, this.dataFrame, this.overalls);
  }
}
