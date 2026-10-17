import { Component, ElementRef, Inject, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { ExportDataProvider } from 'app/shared/controller';
import { DBService } from 'app/shared/services/backend';
import { ColumnNameConverter, CommonUtils } from 'app/shared/utils';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { DataFrame, IDataFrame } from 'data-forge';
import { ChangeEvent, DataType, Route, SummaryContext } from '../shared/model';
import { AggregationService, RawDataRevealService } from '../shared/services';
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
export class SummaryTableComponent implements OnInit, ExportDataProvider {

  @Input() gridView: boolean;
  @Input() context: SummaryContext;

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

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, private router: Router, private dbService: DBService,
    aggregationService: AggregationService, valueRangeGroupingService: ValueRangeGroupingService,
    private rawDataRevealService: RawDataRevealService) {
    this.dataComputer = new SummaryDataComputer(aggregationService, valueRangeGroupingService);
  }

  ngOnInit(): void {
    if (!this.dbService.getActiveScene()) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.initSize();
      this.rowSpanComputer = new RowSpanComputer();
      this.initSort();
      this.context.subscribeToChanges((e: ChangeEvent) => this.contextChanged(e));
      this.createBaseDataFrame();
    }
  }

  private initSize(): void {
    if (!this.gridView) {
      const parentDivStyle = this.cmpElementRef.nativeElement.parentElement.style;
      parentDivStyle.width = this.context.width + 'px';
      parentDivStyle.height = this.context.height + 'px';
    }
  }

  private createBaseDataFrame(): void {
    this.baseDataFrame = new DataFrame(this.context.entries || []);
    if (this.context.hasDataColumn()) {
      this.refreshDataFrameAsync(ChangeEvent.STRUCTURE);
    }
  }

  private contextChanged(e: ChangeEvent): void {
    if (e === ChangeEvent.STRUCTURE) {
      this.createBaseDataFrame()
    } else {
      this.refreshDataFrameAsync(e)
    }
  }

  onAggregationCellClick(entry: object): void {
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
      return;
    }
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    this.dataFrame = this.dataComputer.aggregate(this.baseDataFrame, this.context);
    this.frameColumns = this.dataFrame.getColumnNames();
    this.sortDataFrame();
    this.overalls = this.dataComputer.overallsOf(this.dataFrame, this.context);
    this.computing = false;
  }

  async sort(sort: Sort): Promise<void> {
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    this.currentSort = sort;
    this.sortDataFrame();
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
   * computes row spans for the leading columns, no row spans are needed for the aggregation columns and the column that immediatly
   * preceds them. To keep the HTML simple, we however also include latter in row span comuting.
   */
  private computeRowSpans(): void {
    const columnNames = this.dataFrame.getColumnNames().slice(0, -1);
    this.rowSpans = this.rowSpanComputer.compute(this.frameData, columnNames);
  }

  formattedValueOf(columnIndex: number, value: string | number | boolean): string | boolean {
    return this.computing ? '' : this.valueFormatter.format(this.context.groupByColumns, columnIndex, value);
  }

  createExportData(): object[] {
    return this.exportDataGenerator.generate(this.context, this.dataFrame, this.overalls);
  }
}
