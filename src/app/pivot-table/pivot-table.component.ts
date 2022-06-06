import { Component, OnInit, Inject, ElementRef, ViewChild, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { Query, Route, Column, Scene, DataType, TimeUnit, Document } from '../shared/model';
import {
  NotificationService, ExportService, TimeGroupingService, ViewPersistenceService,
  DialogService, RawDataRevealService
} from '../shared/services';
import { IDataFrame, DataFrame } from 'data-forge';
import { ColumnNameConverter, CommonUtils, DateTimeUtils } from 'app/shared/utils';
import { PivotOptionsProvider } from './options/pivot-options-provider';
import { DBService } from 'app/shared/services/backend';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { ConfigRecord } from 'app/shared/model/view-config';
import { ValueGroupingGenerator, ValueRangeGroupingService } from 'app/shared/value-range';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { CellClickHandler } from './options/cell-click-handler';
import { PivotContextFactory, PivotContext } from './model';
import { QueryProvider } from './options/query-provider';
import { MatSidenav } from '@angular/material/sidenav';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

declare var jQuery: any;

@Component({
  selector: 'koia-pivot-table',
  templateUrl: './pivot-table.component.html',
  styleUrls: ['./pivot-table.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PivotTableComponent extends AbstractComponent implements OnInit, AfterViewInit {

  @ViewChild(MatSidenav) sidenav: MatSidenav;
  @ViewChild('content') divContentRef: ElementRef<HTMLDivElement>;
  @ViewChild('pivot') divPivot: ElementRef<HTMLDivElement>;

  readonly route = Route.PIVOT;
  readonly timeUnits = Object.keys(TimeUnit).map(key => TimeUnit[key]);
  columns: Column[];
  contextFactory = new PivotContextFactory();
  context: PivotContext;
  loading: boolean;
  computing: boolean;
  baseDataFrame: IDataFrame<number, any>;
  dataFrame: IDataFrame<number, any>;
  allowsForValueGrouping: boolean;
  private scene: Scene;
  private entriesSubscription: Subscription;
  private query: Query;
  private valueGroupingGenerator = new ValueGroupingGenerator();
  private pivotOptionsProvider: PivotOptionsProvider;
  private stringifiedValueGroupings: string;

  constructor(@Inject(ElementRef) private cmpElementRef: ElementRef, bottomSheet: MatBottomSheet, private router: Router,
    private dbService: DBService, private dialogService: DialogService, private viewPersistenceService: ViewPersistenceService,
    private timeGroupingService: TimeGroupingService, private valueGroupingService: ValueRangeGroupingService,
    notificationService: NotificationService, private exportService: ExportService, private rawDataRevealService: RawDataRevealService) {
    super(bottomSheet, notificationService);
  }

  ngOnInit(): void {
    this.context = this.contextFactory.create();
    this.scene = this.dbService.getActiveScene();
    if (!this.scene) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.columns = this.scene.columns
        .filter(c => c.indexed)
        .map(c => <Column>CommonUtils.clone(c));
      const baseQueryProvider: QueryProvider = { provide: () => this.query };
      const cellClickCallback = new CellClickHandler(this.columns, baseQueryProvider, this.rawDataRevealService);
      this.pivotOptionsProvider = new PivotOptionsProvider(cellClickCallback);
      this.fetchData(new Query());
    }
  }

  ngAfterViewInit(): void {
    this.sidenav.openedStart.subscribe(() => this.stringifiedValueGroupings = JSON.stringify(this.context.valueGroupings));
    this.sidenav.closedStart.subscribe(() => this.onSidenavClosing());
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

  private onData(entries: Document[]) {
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

  private async refreshDataFrame(config?: Object): Promise<void> {
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    this.dataFrame = this.baseDataFrame;
    this.context.timeColumns
      .forEach(c => this.dataFrame = this.timeGroupingService.groupByFormattedTimeUnit(this.dataFrame, c));
    if (this.context.valueGroupings.length > 0) {
      this.dataFrame.toArray(); // TODO: get rid of this -> solves TypeError: Cannot read properties of null (reading 'values')
      this.dataFrame = this.valueGroupingService.compute(this.dataFrame, this.context.valueGroupings);
    }
    this.renderPivotTable(config);
  }

  printView(): void {
    window.print();
  }

  findConfigRecords(): ConfigRecord[] {
    return this.viewPersistenceService.findRecords(this.scene, this.route);
  }

  loadConfig(configRecord: ConfigRecord): void {
    this.context = configRecord.data;
    const pivotOptions = this.pivotOptionsProvider
      .enrichPivotOptions(this.context.pivotOptions, this.context, () => this.onPivotTableRefreshEnd());
    this.refreshDataFrame(pivotOptions);
  }

  saveConfig(): void {
    const data = new InputDialogData('Save View', 'View Name', '', 20);
    const dialogRef = this.dialogService.showInputDialog(data);
    firstValueFrom(dialogRef.afterClosed()).then(r => {
      if (data.closedWithOK) {
        this.context.pivotOptions = this.pivotOptionsProvider.clonedPurgedPivotOptions(this.getPivotOptions());
        const context = <PivotContext>CommonUtils.clone(this.context);
        context.valueGroupings.forEach(vg => vg.minMaxValues = null);
        this.viewPersistenceService.saveRecord(this.scene, Route.PIVOT, data.input, context)
          .then(s => this.showStatus(s));
      }
    });
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

  getPivotOptions(): Object {
    return this.getTargetElement().data('pivotUIOptions');
  }

  private renderPivotTableAsync(): void {
    this.computing = true;
    Promise.resolve().then(() => this.renderPivotTable());
  }

  private async renderPivotTable(pivotOptions?: Object): Promise<void> {
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

  private getTargetElement(): any {
    return jQuery(this.cmpElementRef.nativeElement).find('#pivot');
  }

  private onPivotTableRefreshEnd(): void {
    this.computing = false;
    this.observePivotTableRefreshStart();
  }

  private observePivotTableRefreshStart(): void {
    const pivotRendererArea = <HTMLTableElement>this.divPivot.nativeElement.getElementsByClassName('pvtRendererArea')[0];
    const mutationObserver = new MutationObserver(() => {
      if (pivotRendererArea.style.opacity !== '1') {
        this.computing = true; // refresh started
      }
    });
    mutationObserver.observe(pivotRendererArea, { attributeFilter: ['style'], attributes: true });
  }

  exportToExcel(): void {
    const table = <HTMLTableElement>this.divPivot.nativeElement.getElementsByClassName('pvtTable')[0];
    this.exportService.exportTableAsExcel(table, 'PivotTable');
  }
}
