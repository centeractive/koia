import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, QueryList,
  ViewChild, ViewChildren
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { elementScroll, observeElementOffset, observeElementRect, VirtualItem, Virtualizer } from '@tanstack/virtual-core';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ConfigController } from 'app/shared/controller/config.controller';
import { ValueFormatter } from 'app/shared/format';
import { ConfigRecord } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from 'app/shared/services';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { queryDefToQuery } from 'app/shared/services/view-persistence/filter/filter-to-query-converter';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { TableFitter } from 'app/shared/ui/table-fit/table-fitter';
import { TextMeasurer } from 'app/shared/ui/table-fit/text-measurer';
import { colWidthMeasurementOf } from 'app/shared/utils/source-system';
import * as _ from 'lodash';
import { lastValueFrom } from 'rxjs';
import { Column, DataType, ExportFormat, Page, Query, Route } from '../shared/model';
import { DBService } from '../shared/services/backend';
import { ColumnAutoSizer } from './column-auto-sizer';
import { RawDataBlockCache } from './raw-data-block-cache';

@Component({
  selector: 'koia-raw-data',
  templateUrl: './raw-data.component.html',
  styleUrls: ['./raw-data.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class RawDataComponent extends ConfigController implements OnInit, AfterViewInit, OnDestroy {

  static readonly ROW_HEIGHT = 22;
  static readonly HEADER_HEIGHT = 24;
  static readonly BORDER = 2;
  static readonly SORT_WIDTH = 12;
  static readonly EM_PX = 14;
  static readonly FONT = '12px "Segoe UI", system-ui, -apple-system, sans-serif';

  @Input() dialogStyle: boolean;
  @Input() query: Query;
  @Input() hideToolbar: boolean;

  @ViewChild('content', { static: true }) divContentRef: ElementRef<HTMLDivElement>;
  @ViewChild('scroller', { static: true }) scrollerRef: ElementRef<HTMLDivElement>;
  @ViewChildren('row') rows: QueryList<ElementRef<HTMLDivElement>>;

  override readonly route = Route.RAWDATA;
  readonly headerHeight = RawDataComponent.HEADER_HEIGHT;
  readonly font = RawDataComponent.FONT;

  columns: Column[];
  hasObjectDataTypeColumns: boolean;
  totalRowCount: number;
  loading: boolean;
  considerColumnWidths: boolean;
  showNestedObjects: boolean;
  highlight: boolean;
  multiLine = false;
  exportFormats: ExportFormat[] = [ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.JSON];

  colWidthMeasurement: 'em' | 'px';
  restoredQuery: Query;
  widths: number[] = [];
  customWidths: Record<string, number> = {};
  columnsWidth = 0;
  templateColumns = '';
  selectedIndex: number | undefined;
  gridHeight = 0;
  gridWidth = 0;
  totalSize = 0;
  virtualItems: VirtualItem[] = [];

  private cache: RawDataBlockCache;
  private virtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>;
  private cleanup: () => void;
  private contentObserver: ResizeObserver;
  private contentFrame: number | undefined;
  private measurer: TextMeasurer;
  private scrollbarWidth: number;
  private rendering = false;
  private renderPending = false;
  private destroyed = false;
  private hScroll = 0;
  private resizeStartWidth: number | undefined;
  private valueFormatter = new ValueFormatter();

  constructor(bottomSheet: MatBottomSheet, router: Router, public override dbService: DBService, public override viewPersistenceService: ViewPersistenceService,
    public override dialogService: DialogService, notificationService: NotificationService, private exportService: ExportService, public snackBar: MatSnackBar,
    private zone: NgZone, private cdr: ChangeDetectorRef) {
    super(Route.RAWDATA, router, bottomSheet, dbService, dialogService, viewPersistenceService, notificationService);
    this.considerColumnWidths = true;
    this.showNestedObjects = false;
    this.highlight = true;
  }

  init(): void {
    if (!this.query) {
      this.query = new Query();
    }
    this.columns = this.scene.columns;
    this.colWidthMeasurement = colWidthMeasurementOf(this.scene);
    this.hasObjectDataTypeColumns = this.columns.find(c => c.dataType === DataType.OBJECT) !== undefined;
    this.scrollbarWidth = DomMetrics.scrollbarWidth();
    this.measurer = new TextMeasurer(RawDataComponent.FONT);
    this.virtualizer = new Virtualizer({
      count: 0,
      getScrollElement: () => this.scrollerRef.nativeElement,
      estimateSize: () => RawDataComponent.ROW_HEIGHT,
      overscan: 10,
      scrollMargin: RawDataComponent.HEADER_HEIGHT,
      scrollToFn: elementScroll,
      observeElementRect,
      observeElementOffset,
      useAnimationFrameWithResizeObserver: true,
      onChange: () => this.zone.run(() => this.onVirtualizerChange())
    });
    this.cache = new RawDataBlockCache(this.dbService, () => this.query, {
      onLoading: loading => this.loading = loading,
      onBlockLoaded: (page, firstBlock) => this.onBlockLoaded(page, firstBlock),
      onError: error => this.notifyError(error)
    });
    this.applyWidths();
    this.cache.reset();
  }

  ngAfterViewInit(): void {
    this.cleanup = this.virtualizer._didMount();
    this.virtualizer._willUpdate();
    this.contentObserver = new ResizeObserver(() => this.scheduleContentRefit());
    this.contentObserver.observe(this.divContentRef.nativeElement);
    if (!this.dialogStyle && this.scene.config.records.filter(r => r.route === this.route).length) {
      this.selectConfig();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cache?.cancel();
    this.cleanup?.();
    this.contentObserver?.disconnect();
    cancelAnimationFrame(this.contentFrame);
  }

  onFilterChanged(query: Query): void {
    query.setSort(this.query.getSort());
    this.query = query;
    this.reload();
  }

  sortBy(column: Column): void {
    if (!column.indexed) {
      return;
    }
    const sort = this.query.getSort();
    if (sort?.active === column.name && sort.direction === 'asc') {
      this.query.setSort({ active: column.name, direction: 'desc' });
    } else if (sort?.active === column.name && sort.direction === 'desc') {
      this.query.clearSort();
    } else {
      this.query.setSort({ active: column.name, direction: 'asc' });
    }
    this.reload();
  }

  sortIndicator(column: Column): string {
    const sort = this.query.getSort();
    if (sort?.active !== column.name) {
      return '';
    }
    return sort.direction === 'asc' ? '▲' : sort.direction === 'desc' ? '▼' : '';
  }

  rowAt(index: number): object | undefined {
    return this.cache.rowAt(index);
  }

  rowStyle(index: number): object | null {
    const entry = this.rowAt(index);
    return this.highlight && entry ? { background: entry['bgcolor'], color: entry['fgcolor'] } : null;
  }

  // eslint-disable-next-line
  formattedValueOf(column: Column, entry: object): any {
    if (!this.showNestedObjects && column.dataType === DataType.OBJECT) {
      return entry[column.name] ? '...' : '';
    }
    return this.valueFormatter.formatValue(column, entry[column.name]);
  }

  displayValue(column: Column, entry: object): void {
    if (column.dataType === DataType.OBJECT) {
      const data = new ConfirmDialogData('Column ' + column.name, '<pre>' + entry[column.name] + '</pre>', ['CLose']);
      this.dialogService.showConfirmDialog(data);
    }
  }

  resizeColumn(index: number, delta: number): void {
    this.resizeStartWidth ??= this.widths[index];
    this.widths[index] = Math.max(ColumnAutoSizer.MIN, this.resizeStartWidth + delta);
    this.customWidths[this.columns[index].name] = this.widths[index];
    this.applyTemplate();
    this.onVirtualizerChange();
  }

  endResize(): void {
    this.resizeStartWidth = undefined;
  }

  toggleMultiLine(): void {
    this.multiLine = !this.multiLine;
    this.virtualizer.measure();
  }

  toggleConsiderColumnWidths(): void {
    this.considerColumnWidths = !this.considerColumnWidths;
    this.customWidths = {};
    this.applyWidths();
    this.onVirtualizerChange();
  }

  toggleHighlight(): void {
    this.highlight = !this.highlight;
  }

  saveAs(exportFormat: ExportFormat): void {
    const query = this.query.clone();
    const message = (query.hasFilter() ? 'filtered' : 'complete') + ' data is collected and saves as ' + exportFormat + ' in the background';
    this.snackBar.open(message, undefined, { duration: 4000 });
    query.clearPageDefinition();
    lastValueFrom(this.dbService.findEntries(query, false))
      .then(entries => this.exportService.exportData(entries, this.columns, exportFormat, 'Raw-Data'))
      .catch(error => this.notifyError(error));
  }

  printView(): void {
    window.print();
  }

  configToBeSaved(): { query: Query, data: ConfigRecordData } {
    return {
      query: this.query,
      data: {
        considerColumnWidths: this.considerColumnWidths,
        highlight: this.highlight,
        multiLine: this.multiLine,
        columnWidths: { ...this.customWidths }
      }
    };
  }

  loadConfig(configRecord: ConfigRecord): void {
    this.currentViewName = configRecord.name;
    this.query = queryDefToQuery(configRecord.query);
    this.restoredQuery = this.query;
    const configRecordData: ConfigRecordData = configRecord.data;
    this.considerColumnWidths = configRecordData.considerColumnWidths;
    this.highlight = configRecordData.highlight;
    this.multiLine = configRecordData.multiLine ?? false;
    this.customWidths = { ...(configRecordData.columnWidths ?? {}) };
    this.applyWidths();
    this.reload();
  }

  private reload(): void {
    this.selectedIndex = undefined;
    this.totalRowCount = undefined;
    this.virtualizer.scrollToOffset(0);
    this.virtualizer.scrollOffset = 0;
    this.virtualizer.setOptions({ ...this.virtualizer.options, count: 0 });
    this.virtualizer.measure();
    this.cache.reset();
  }

  private onBlockLoaded(page: Page, firstBlock: boolean): void {
    if (page.totalRowCount !== this.totalRowCount) {
      this.totalRowCount = page.totalRowCount;
      this.virtualizer.setOptions({ ...this.virtualizer.options, count: this.totalRowCount });
    }
    if (firstBlock) {
      SortLimitationWorkaround.showInfoDialog(this.dbService, this.dialogService, this.query);
      this.applyWidths();
    }
    this.onVirtualizerChange();
  }

  private scheduleContentRefit(): void {
    if (this.contentFrame !== undefined) {
      return;
    }
    this.contentFrame = requestAnimationFrame(() => {
      this.contentFrame = undefined;
      this.zone.run(() => this.onVirtualizerChange());
    });
  }

  private onVirtualizerChange(): void {
    if (this.destroyed) {
      return;
    }
    if (this.rendering) {
      this.renderPending = true;
      return;
    }
    this.rendering = true;
    try {
      do {
        this.renderPass();
      } while (this.renderPending);
    } finally {
      this.rendering = false;
    }
  }

  private renderPass(): void {
    this.renderPending = false;
    this.virtualItems = this.virtualizer.getVirtualItems();
    this.totalSize = this.virtualizer.getTotalSize();
    if (this.virtualItems.length) {
      this.cache.requestRange(this.virtualItems[0].index, this.virtualItems[this.virtualItems.length - 1].index);
    }
    this.refit();
    this.cdr.detectChanges();
    if (this.multiLine) {
      this.rows.forEach(row => this.virtualizer.measureElement(row.nativeElement));
    }
    const scroller = this.scrollerRef.nativeElement;
    const hScroll = TableFitter.hasHorizontalOverflow(scroller.scrollWidth, scroller.clientWidth) ? this.scrollbarWidth : 0;
    if (hScroll !== this.hScroll) {
      this.hScroll = hScroll;
      this.renderPending = true;
    }
  }

  private refit(): void {
    this.gridWidth = TableFitter.contentWidth(this.scrollbarWidth + RawDataComponent.BORDER, this.widths);
    this.gridHeight = TableFitter.contentHeight(RawDataComponent.HEADER_HEIGHT + RawDataComponent.BORDER, this.totalSize, this.hScroll);
  }

  private applyWidths(): void {
    this.widths = this.columns.map(column => this.customWidths[column.name] ?? this.baseWidth(column));
    this.applyTemplate();
  }

  private baseWidth(column: Column): number {
    if (this.considerColumnWidths && column.width > 0) {
      return column.width * (this.colWidthMeasurement === 'em' ? RawDataComponent.EM_PX : 1);
    }
    return this.autoWidth(column);
  }

  private autoWidth(column: Column): number {
    const measure = (text: string) => this.measurer.width(text);
    const cellTexts = this.cache.loadedRows().map(entry => String(this.formattedValueOf(column, entry)));
    const headerWidth = ColumnAutoSizer.width([column.name], measure) + RawDataComponent.SORT_WIDTH;
    return Math.min(ColumnAutoSizer.MAX, Math.max(ColumnAutoSizer.width(cellTexts, measure), headerWidth));
  }

  private applyTemplate(): void {
    this.columnsWidth = _.sum(this.widths);
    this.templateColumns = this.widths.map(width => width + 'px').join(' ');
    this.refit();
  }
}

interface ConfigRecordData {
  considerColumnWidths: boolean,
  highlight: boolean,
  multiLine?: boolean,
  columnWidths?: Record<string, number>
}
