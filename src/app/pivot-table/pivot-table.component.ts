import { AfterViewInit, Component, ElementRef, Inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ConfigController } from 'app/shared/controller/config.controller';
import { ConfigRecord } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { queryDefToQuery } from 'app/shared/services/view-persistence/filter/filter-to-query-converter';
import { ColumnNameConverter, CommonUtils, DateTimeUtils } from 'app/shared/utils';
import { ValueGroupingGenerator, ValueRangeGroupingService } from 'app/shared/value-range';
import { DataFrame, IDataFrame } from 'data-forge';
import { Subscription } from 'rxjs';
import { Column, DataType, Document, Query, Route, TimeUnit } from '../shared/model';
import {
  DialogService,
  ExportService,
  NotificationService,
  RawDataRevealService,
  TimeGroupingService, ViewPersistenceService
} from '../shared/services';
import { PivotContext, PivotContextFactory } from './model';
import { CellClickHandler } from './options/cell-click-handler';
import { PivotOptionsProvider } from './options/pivot-options-provider';
import { QueryProvider } from './options/query-provider';

// eslint-disable-next-line
declare let jQuery: any;

@Component({
  selector: 'koia-pivot-table',
  templateUrl: './pivot-table.component.html',
  styleUrls: ['./pivot-table.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PivotTableComponent extends ConfigController implements AfterViewInit {

  @ViewChild(MatSidenav) sidenav: MatSidenav;
  @ViewChild('content') divContentRef: ElementRef<HTMLDivElement>;
  @ViewChild('pivot') divPivot: ElementRef<HTMLDivElement>;

  readonly route = Route.PIVOT;
  readonly timeUnits = Object.keys(TimeUnit).map(key => TimeUnit[key]);
  columns: Column[];
  timeColumns: Column[];
  contextFactory = new PivotContextFactory();
  context: PivotContext;
  loading: boolean;
  computing: boolean;
  // eslint-disable-next-line
  baseDataFrame: IDataFrame<number, any>;
  // eslint-disable-next-line
  dataFrame: IDataFrame<number, any>;
  allowsForValueGrouping: boolean;
  restoredQuery: Query;

  private query: Query;
  private entriesSubscription: Subscription;
  private valueGroupingGenerator = new ValueGroupingGenerator();
  private pivotOptionsProvider: PivotOptionsProvider;
  private stringifiedValueGroupings: string;

  constructor(@Inject(ElementRef) private cmpElementRef: ElementRef, bottomSheet: MatBottomSheet, router: Router,
    public dbService: DBService, public dialogService: DialogService, public viewPersistenceService: ViewPersistenceService,
    private timeGroupingService: TimeGroupingService, private valueGroupingService: ValueRangeGroupingService,
    notificationService: NotificationService, private exportService: ExportService, private rawDataRevealService: RawDataRevealService) {
    super(Route.PIVOT, router, bottomSheet, dbService, dialogService, viewPersistenceService, notificationService);
  }

  init(): void {
    this.context = this.contextFactory.create();
    this.columns = this.scene.columns
      .filter(c => c.indexed)
      .map(c => <Column>CommonUtils.clone(c));
    this.timeColumns = this.columns
      .filter(c => c.dataType == DataType.TIME);
    const baseQueryProvider: QueryProvider = { provide: () => this.query };
    const cellClickCallback = new CellClickHandler(this.columns, baseQueryProvider, this.rawDataRevealService);
    this.pivotOptionsProvider = new PivotOptionsProvider(cellClickCallback);
    this.fetchData(new Query());
  }

  ngAfterViewInit(): void {
    this.sidenav.openedStart.subscribe(() => this.stringifiedValueGroupings = JSON.stringify(this.context.valueGroupings));
    this.sidenav.closedStart.subscribe(() => this.onSidenavClosing());
    if (this.scene.config.records.filter(r => r.route === this.route).length) {
      this.selectConfig();
    }
  }

  private onSidenavClosing(): void {
    if (this.stringifiedValueGroupings !== JSON.stringify(this.context.valueGroupings)) {
      this.refreshOptions();
      this.refreshDataFrameAsync();
    }
  }

  fetchData(query: Query): void {
    this.loading = true;
    this.query = query;
    this.allowsForValueGrouping = this.columns.find(c => c.dataType === DataType.NUMBER) !== undefined;
    this.context.timeColumns = this.columns.filter(c => c.dataType === DataType.TIME);
    if (this.entriesSubscription) {
      this.entriesSubscription.unsubscribe();
    }
    this.entriesSubscription = this.dbService.findEntries(query, true)
      .subscribe(entries => this.onData(entries));
  }

  private onData(entries: Document[]): void {
    this.loading = false;
    this.computing = true;
    this.defineGroupingTimeUnits(entries);
    const firstTimeInvoked = !this.baseDataFrame;
    this.baseDataFrame = new DataFrame(entries);
    if (firstTimeInvoked && this.allowsForValueGrouping) {
      this.context.valueGroupings = this.valueGroupingGenerator.generate(this.baseDataFrame, this.columns);
    }
    this.refreshDataFrameAsync();
  }

  private defineGroupingTimeUnits(entries: Document[]): void {
    const options = this.getPivotOptions();
    let nonSelectedTimeColumns = this.context.timeColumns;
    if (options) {
      const selColNames = [...options['cols'], ...options['rows']];
      nonSelectedTimeColumns = this.context.timeColumns
        .filter(c => !selColNames.includes(ColumnNameConverter.toLabel(c, c.groupingTimeUnit)));
    }
    DateTimeUtils.defineTimeUnits(nonSelectedTimeColumns, entries);
  }

  onTimeUnitChanged(column: Column, timeUnit: TimeUnit): void {
    this.pivotOptionsProvider.replaceTimeColumnsInUse(this.getPivotOptions(), column, column.groupingTimeUnit, timeUnit);
    column.groupingTimeUnit = timeUnit;
    this.refreshDataFrameAsync();
  }

  private refreshDataFrameAsync(): void {
    Promise.resolve().then(() => this.refreshDataFrame());
  }

  private async refreshDataFrame(config?: object): Promise<void> {
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    this.dataFrame = this.baseDataFrame;
    this.context.timeColumns
      .forEach(c => this.dataFrame = this.timeGroupingService.groupByFormattedTimeUnit(this.dataFrame, c));
    if (this.context.valueGroupings.length > 0) {
      this.dataFrame.bake();
      this.dataFrame = this.valueGroupingService.compute(this.dataFrame, this.context.valueGroupings);
    }
    this.renderPivotTable(config);
  }

  printView(): void {
    window.print();
  }

  configToBeSaved(): { query: Query, data: PivotContext } {
    this.context.pivotOptions = this.pivotOptionsProvider.clonedPurgedPivotOptions(this.getPivotOptions());
    const context = CommonUtils.clone(this.context) as PivotContext;
    context.valueGroupings.forEach(vg => vg.minMaxValues = null);
    return { query: this.query, data: context };
  }

  loadConfig(configRecord: ConfigRecord): void {
    this.currentViewName = configRecord.name;
    this.context = configRecord.data;
    if (configRecord.query) {
      this.restoredQuery = queryDefToQuery(configRecord.query);
      this.query = this.restoredQuery;
    }
    const pivotOptions = this.pivotOptionsProvider
      .enrichPivotOptions(this.context.pivotOptions, this.context, () => this.onPivotTableRefreshEnd());
    this.refreshDataFrame(pivotOptions);
  }

  onNegativeColorChanged(color: string): void {
    this.context.negativeColor = color;
    this.onColorChanged();
  }

  onPositiveColorChanged(color: string): void {
    this.context.positiveColor = color;
    this.onColorChanged();
  }

  private onColorChanged(): void {
    this.refreshOptions();
    if (this.pivotOptionsProvider.isHeatmapRendererSelected(this.getPivotOptions())) {
      this.renderPivotTableAsync();
    }
  }

  onShowRowTotalsChanged(): void {
    this.context.showRowTotals = !this.context.showRowTotals;
    this.refreshOptions();
    this.renderPivotTableAsync();
  }

  onShowColumnTotalsChanged(): void {
    this.context.showColumnTotals = !this.context.showColumnTotals;
    this.refreshOptions();
    this.renderPivotTableAsync();
  }

  private refreshOptions(): void {
    this.pivotOptionsProvider.enrichPivotOptions(this.getPivotOptions(), this.context, () => this.onPivotTableRefreshEnd());
  }

  getPivotOptions(): object {
    return this.getTargetElement().data('pivotUIOptions');
  }

  private renderPivotTableAsync(): void {
    this.computing = true;
    Promise.resolve().then(() => this.renderPivotTable());
  }

  private async renderPivotTable(pivotOptions?: object): Promise<void> {
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    const targetElement = this.getTargetElement();
    while (targetElement.firstChild) {
      targetElement.removeChild(targetElement.firstChild);
    }
    if (pivotOptions) {
      targetElement.pivotUI(this.dataFrame.toArray(), pivotOptions, true);
    } else {
      targetElement.pivotUI(this.dataFrame.toArray(),
        this.pivotOptionsProvider.enrichPivotOptions(undefined, this.context, () => this.onPivotTableRefreshEnd()));
    }
  }

  // eslint-disable-next-line
  private getTargetElement(): any {
    return jQuery(this.cmpElementRef.nativeElement).find('#pivot');
  }

  private onPivotTableRefreshEnd(): void {
    this.computing = false;
    this.observePivotTableRefreshStart();
  }

  private observePivotTableRefreshStart(): void {
    const pivotRendererArea = this.divPivot.nativeElement.getElementsByClassName('pvtRendererArea')[0] as HTMLTableElement;
    const mutationObserver = new MutationObserver(() => {
      if (pivotRendererArea.style.opacity !== '1') {
        this.computing = true; // refresh started
      }
    });
    mutationObserver.observe(pivotRendererArea, { attributeFilter: ['style'], attributes: true });
  }

  exportToExcel(): void {
    const table = this.divPivot.nativeElement.getElementsByClassName('pvtTable')[0] as HTMLTableElement;
    this.exportService.exportTableAsExcel(table, 'PivotTable');
  }

}
