import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, ElementRef, Inject, Input, OnDestroy, ViewChild, ViewEncapsulation
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ConfigController } from 'app/shared/controller/config.controller';
import { ConfigRecord, TabContent, TabDef } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { PIVOT_TABLE_FILE_BASE_NAME } from 'app/shared/services/export/export-file';
import { createConfigRecord } from 'app/shared/services/view-persistence/config-record-factory';
import { queryDefToQuery } from 'app/shared/services/view-persistence/filter/filter-to-query-converter';
import { LanguageService } from 'app/shared/services/language';
import { TabContentProvider, ViewTabsService } from 'app/shared/services/view-tabs';
import { MeasuredTable, measureTable } from 'app/shared/ui/sheets/measured-table';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { ColumnNameConverter, CommonUtils, DateTimeUtils } from 'app/shared/utils';
import { ValueGroupingGenerator, ValueRangeGroupingService } from 'app/shared/value-range';
import { DataFrame, IDataFrame } from 'data-forge';
import { Subscription } from 'rxjs';
import { CanvasPaging, Column, DataType, Document, Query, Route, TimeUnit } from '../shared/model';
import {
  ExportService,
  NotificationService,
  RawDataRevealService,
  TimeGroupingService
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class PivotTableComponent extends ConfigController implements DoCheck, AfterViewInit, OnDestroy, TabContentProvider {

  @Input() tab: TabDef;

  @ViewChild(MatSidenav) sidenav: MatSidenav;
  @ViewChild('content') divContentRef: ElementRef<HTMLDivElement>;
  @ViewChild('pivot') divPivot: ElementRef<HTMLDivElement>;

  override  readonly route = Route.PIVOT;
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
  pivotSheetTable: MeasuredTable;

  private query: Query;
  private entriesSubscription: Subscription;
  private languageSubscription: Subscription;
  private languageChanged = false;
  private languageRefresh = false;
  private valueGroupingGenerator = new ValueGroupingGenerator();
  private pivotOptionsProvider: PivotOptionsProvider;
  private stringifiedValueGroupings: string;
  private pendingRecord: ConfigRecord;
  private destroyed = false;
  private mutationObserver: MutationObserver;
  private resizeObserver: ResizeObserver;

  constructor(@Inject(ElementRef) private cmpElementRef: ElementRef, bottomSheet: MatBottomSheet, router: Router,
    public override dbService: DBService, private timeGroupingService: TimeGroupingService, private valueGroupingService: ValueRangeGroupingService,
    notificationService: NotificationService, private exportService: ExportService, private rawDataRevealService: RawDataRevealService,
    private viewTabsService: ViewTabsService, private languageService: LanguageService, private cdr: ChangeDetectorRef) {
    super(Route.PIVOT, router, bottomSheet, dbService, notificationService);
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
    this.pendingRecord = this.tab?.record;
    this.restoredQuery = this.pendingRecord?.query ? queryDefToQuery(this.pendingRecord.query) : undefined;
    this.fetchData(this.restoredQuery ?? new Query());
    if (this.tab) {
      this.viewTabsService.register(this.tab.id, this);
    }
    this.languageSubscription = this.languageService.changed$.subscribe(() => this.languageChanged = true);
  }

  /**
   * re-measures the pivot table when its size changes, e.g. when the route of a pivot table measured while detached is attached again
   */
  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.measurePivotTable());
    this.resizeObserver.observe(this.divPivot.nativeElement);
  }

  /**
   * re-renders the pivot table in the new language once it is shown and not busy, the pivot table of a cached route is
   * re-rendered when it is attached again
   */
  ngDoCheck(): void {
    if (!this.languageChanged || !this.divPivot?.nativeElement.isConnected || this.loading || this.computing || this.pendingRecord) {
      return;
    }
    this.languageChanged = false;
    if (this.getPivotOptions()) {
      this.languageRefresh = true;
      this.refreshOptions();
      this.renderPivotTableAsync();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.languageSubscription?.unsubscribe();
    if (this.tab) {
      this.viewTabsService.unregister(this.tab.id, this);
    }
    this.entriesSubscription?.unsubscribe();
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  get paging(): CanvasPaging {
    return this.context.paging ?? CanvasPaging.NONE;
  }

  isPaged(): boolean {
    return PageFormat.isPaged(this.paging);
  }

  /**
   * shows the pivot table on pages measured once it is laid out unconstrained offstage
   */
  onPagingChange(paging: CanvasPaging): void {
    this.context.paging = paging;
    this.cdr.detectChanges();
    this.measurePivotTable();
    this.requestPersist();
  }

  /**
   * a pivot table not displayed, e.g. while printed or detached, keeps its measures
   */
  private measurePivotTable(): void {
    const table = this.divPivot.nativeElement.querySelector<HTMLTableElement>('table.pvtTable');
    if (this.isPaged() && !this.destroyed && table?.getClientRects().length !== 0) {
      this.pivotSheetTable = table ? measureTable(table) : undefined;
      this.cdr.detectChanges();
    }
  }

  onSidenavOpening(): void {
    this.stringifiedValueGroupings = JSON.stringify(this.context.valueGroupings);
  }

  onSidenavClosing(): void {
    if (this.stringifiedValueGroupings !== JSON.stringify(this.context.valueGroupings)) {
      this.refreshOptions();
      this.refreshDataFrameAsync();
    }
    this.requestPersist();
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
      .subscribe({
        next: entries => this.onData(entries),
        error: err => {
          this.loading = false;
          this.notifyError(err);
        }
      });
    this.requestPersist();
  }

  private onData(entries: Document[]): void {
    this.loading = false;
    this.computing = true;
    this.defineGroupingTimeUnits(entries);
    const firstTimeInvoked = !this.baseDataFrame;
    this.baseDataFrame = new DataFrame(entries);
    if (this.pendingRecord) {
      const record = this.pendingRecord;
      this.pendingRecord = undefined;
      this.applyConfig(record);
      return;
    }
    if (firstTimeInvoked && this.allowsForValueGrouping) {
      this.context.valueGroupings = this.valueGroupingGenerator.generate(this.baseDataFrame, this.columns);
    }
    this.refreshDataFrameAsync();
  }

  private defineGroupingTimeUnits(entries: Document[]): void {
    const options = this.getPivotOptions();
    const selColNames = [options, this.context.pivotOptions]
      .filter(o => o)
      .flatMap(o => [...(o['cols'] ?? []), ...(o['rows'] ?? [])]);
    const nonSelectedTimeColumns = this.context.timeColumns
      .filter(c => !selColNames.includes(ColumnNameConverter.toLabel(c, c.groupingTimeUnit)));
    DateTimeUtils.defineTimeUnits(nonSelectedTimeColumns, entries);
  }

  onTimeUnitChanged(column: Column, timeUnit: TimeUnit): void {
    const pivotOptions = this.getPivotOptions();
    if (pivotOptions) {
      this.pivotOptionsProvider.replaceTimeColumnsInUse(pivotOptions, column, column.groupingTimeUnit, timeUnit);
    }
    column.groupingTimeUnit = timeUnit;
    if (this.baseDataFrame) {
      this.refreshDataFrameAsync();
    }
  }

  private refreshDataFrameAsync(): void {
    Promise.resolve().then(() => this.refreshDataFrame());
  }

  private async refreshDataFrame(config?: object): Promise<void> {
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    if (this.destroyed) {
      return;
    }
    this.dataFrame = this.baseDataFrame;
    this.context.timeColumns
      .forEach(c => this.dataFrame = this.timeGroupingService.groupByFormattedTimeUnit(this.dataFrame, c));
    if (this.context.valueGroupings.length > 0) {
      this.dataFrame.bake();
      this.dataFrame = this.valueGroupingService.compute(this.dataFrame, this.context.valueGroupings);
    }
    this.renderPivotTable(config);
  }

  configToBeSaved(): { query: Query, data: PivotContext } {
    this.context.pivotOptions = this.pivotOptionsProvider.clonedPurgedPivotOptions(this.getPivotOptions());
    const context = CommonUtils.clone(this.context) as PivotContext;
    context.valueGroupings.forEach(vg => vg.minMaxValues = null);
    return { query: this.query, data: context };
  }

  private applyConfig(configRecord: ConfigRecord): void {
    this.context = CommonUtils.clone(configRecord.data as PivotContext);
    this.contextFactory.adoptPalette(this.context);
    this.adoptRestoredTimeUnits();
    const pivotOptions = this.pivotOptionsProvider
      .enrichPivotOptions(this.context.pivotOptions, this.context, () => this.onPivotTableRefreshEnd());
    this.refreshDataFrame(pivotOptions);
  }

  /**
   * takes over the time units of the restored context and lets the context share the time columns of this component, so that
   * grouping, the time unit menu and revealing raw data of a clicked cell all use the same time units
   */
  private adoptRestoredTimeUnits(): void {
    this.timeColumns.forEach(c => {
      const restored = this.context.timeColumns?.find(rc => rc.name === c.name);
      if (restored?.groupingTimeUnit) {
        c.groupingTimeUnit = restored.groupingTimeUnit;
      }
    });
    this.context.timeColumns = this.timeColumns;
  }

  tabContent(): TabContent {
    if (this.pendingRecord || !this.getPivotOptions()) {
      return { record: this.tab.record };
    }
    const config = this.configToBeSaved();
    return { record: createConfigRecord(Route.PIVOT, this.tab.title, config.query, config.data, 0) };
  }

  layout(): Route {
    return Route.PIVOT;
  }

  private requestPersist(): void {
    if (this.tab && !this.destroyed) {
      this.viewTabsService.requestPersist();
    }
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
    this.requestPersist();
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
    if (this.destroyed) {
      return;
    }
    const targetElement = this.getTargetElement();
    if (pivotOptions) {
      targetElement.pivotUI(this.dataFrame.toArray(), pivotOptions, true);
    } else {
      targetElement.pivotUI(this.dataFrame.toArray(),
        this.pivotOptionsProvider.enrichPivotOptions(undefined, this.context, () => this.onPivotTableRefreshEnd()));
    }
    this.pivotOptionsProvider.localizeSelections(this.divPivot.nativeElement);
  }

  // eslint-disable-next-line
  private getTargetElement(): any {
    return jQuery(this.cmpElementRef.nativeElement).find('#pivot');
  }

  /**
   * requests persisting unless the pivot table was only re-rendered in another language, which does not change its configuration
   */
  private onPivotTableRefreshEnd(): void {
    this.computing = false;
    this.pivotOptionsProvider.addCellTooltips(this.divPivot.nativeElement);
    this.observePivotTableRefreshStart();
    this.measurePivotTable();
    if (this.languageRefresh) {
      this.languageRefresh = false;
    } else {
      this.requestPersist();
    }
  }

  private observePivotTableRefreshStart(): void {
    const pivotRendererArea = this.divPivot.nativeElement.getElementsByClassName('pvtRendererArea')[0] as HTMLTableElement;
    this.mutationObserver?.disconnect();
    this.mutationObserver = new MutationObserver(() => {
      if (pivotRendererArea.style.opacity !== '1') {
        this.computing = true; // refresh started
      }
    });
    this.mutationObserver.observe(pivotRendererArea, { attributeFilter: ['style'], attributes: true });
  }

  exportToExcel(): void {
    const table = this.divPivot.nativeElement.getElementsByClassName('pvtTable')[0] as HTMLTableElement;
    this.exportService.exportTableAsExcel(table, PIVOT_TABLE_FILE_BASE_NAME);
  }

}
