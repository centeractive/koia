import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit,
  Output, QueryList, SimpleChanges, TemplateRef, ViewChild, ViewChildren
} from '@angular/core';
import { elementScroll, observeElementOffset, observeElementRect, VirtualItem, Virtualizer } from '@tanstack/virtual-core';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ValueFormatter } from 'app/shared/format';
import { Column, DataType } from 'app/shared/model';
import { DialogService } from 'app/shared/services/dialog.service';
import * as _ from 'lodash';
import { DomMetrics } from '../table-fit/dom-metrics';
import { TableFitter } from '../table-fit/table-fitter';
import { ColumnAutoSizer } from './column-auto-sizer';
import { ColumnWidthResolver } from './column-width-resolver';
import { ColumnResize, VirtualTableSource } from './virtual-table-source';

@Component({
  selector: 'koia-virtual-table',
  templateUrl: './virtual-table.component.html',
  styleUrls: ['./virtual-table.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class VirtualTableComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {

  static readonly ROW_HEIGHT = 22;
  static readonly HEADER_HEIGHT = 24;
  static readonly BORDER = 2;
  static readonly FONT = ColumnWidthResolver.FONT;

  @Input() columns: Column[];
  @Input() widths: number[] = [];
  @Input() source: VirtualTableSource;
  @Input() multiLine = false;
  @Input() showNestedObjects = false;
  @Input() dialogStyle = false;
  @Input() sortable = false;
  @Input() sortIndicatorOf: (column: Column) => string = () => '';
  @Input() rowStyleOf: (entry: object) => object | null = () => null;
  @Input() rowMarker: TemplateRef<{ $implicit: number }>;
  @Output() sort = new EventEmitter<Column>();
  @Output() columnResize = new EventEmitter<ColumnResize>();

  @ViewChild('content', { static: true }) divContentRef: ElementRef<HTMLDivElement>;
  @ViewChild('scroller', { static: true }) scrollerRef: ElementRef<HTMLDivElement>;
  @ViewChildren('row') rows: QueryList<ElementRef<HTMLDivElement>>;

  readonly headerHeight = VirtualTableComponent.HEADER_HEIGHT;
  readonly font = VirtualTableComponent.FONT;

  columnsWidth = 0;
  templateColumns = '';
  selectedIndex: number | undefined;
  gridHeight = 0;
  gridWidth = 0;
  totalSize = 0;
  virtualItems: VirtualItem[] = [];

  private virtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>;
  private cleanup: () => void;
  private contentObserver: ResizeObserver;
  private refitFrame: number | undefined;
  private measurePending = false;
  private readonly scrollbarWidth = DomMetrics.scrollbarWidth();
  private rendering = false;
  private renderPending = false;
  private destroyed = false;
  private hScroll = 0;
  private resizeStartWidth: number | undefined;
  private resizeStartColumnsWidth: number | undefined;
  private readonly valueFormatter = new ValueFormatter();

  constructor(private dialogService: DialogService, private zone: NgZone, private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] || changes['widths']) {
      this.applyTemplate();
    }
    if (!this.virtualizer) {
      return;
    }
    if (changes['source']) {
      this.syncRowCount();
      this.virtualItems = this.virtualizer.getVirtualItems();
      this.totalSize = this.virtualizer.getTotalSize();
    }
    this.scheduleRefit(!!(changes['multiLine'] || changes['source']));
  }

  ngOnInit(): void {
    this.virtualizer = new Virtualizer({
      count: this.source.rowCount() ?? 0,
      getScrollElement: () => this.scrollerRef.nativeElement,
      estimateSize: () => VirtualTableComponent.ROW_HEIGHT,
      overscan: 10,
      scrollMargin: VirtualTableComponent.HEADER_HEIGHT,
      scrollToFn: elementScroll,
      observeElementRect,
      observeElementOffset,
      useAnimationFrameWithResizeObserver: true,
      onChange: () => this.zone.run(() => this.onVirtualizerChange())
    });
  }

  ngAfterViewInit(): void {
    this.cleanup = this.virtualizer._didMount();
    this.virtualizer._willUpdate();
    this.contentObserver = new ResizeObserver(() => this.scheduleRefit(false));
    this.contentObserver.observe(this.divContentRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cleanup?.();
    this.contentObserver?.disconnect();
    cancelAnimationFrame(this.refitFrame);
  }

  refresh(): void {
    this.syncRowCount();
    this.onVirtualizerChange();
  }

  reset(): void {
    this.selectedIndex = undefined;
    this.virtualizer.scrollToOffset(0);
    this.virtualizer.scrollOffset = 0;
    this.virtualizer.setOptions({ ...this.virtualizer.options, count: 0 });
    this.virtualizer.measure();
  }

  get contentWidth(): number {
    return Math.max(this.columnsWidth, this.resizeStartColumnsWidth ?? 0);
  }

  rowStyle(index: number): object | null {
    const entry = this.source.rowAt(index);
    return entry ? this.rowStyleOf(entry) : null;
  }

  // eslint-disable-next-line
  formattedValueOf(column: Column, entry: object): any {
    return this.valueFormatter.formatCell(column, entry, this.showNestedObjects);
  }

  displayValue(column: Column, entry: object): void {
    if (column.dataType === DataType.OBJECT) {
      const data = new ConfirmDialogData('Column ' + column.name, '<pre>' + entry[column.name] + '</pre>', ['CLose']);
      this.dialogService.showConfirmDialog(data);
    }
  }

  onHeaderClick(column: Column): void {
    if (this.sortable && column.indexed) {
      this.sort.emit(column);
    }
  }

  onResizing(index: number, delta: number): void {
    this.resizeStartWidth ??= this.widths[index];
    this.resizeStartColumnsWidth ??= this.columnsWidth;
    this.columnResize.emit({ index, width: Math.max(ColumnAutoSizer.MIN, this.resizeStartWidth + delta) });
  }

  onResized(): void {
    this.resizeStartWidth = undefined;
    this.resizeStartColumnsWidth = undefined;
  }

  private scheduleRefit(measure: boolean): void {
    this.measurePending ||= measure;
    if (this.refitFrame !== undefined) {
      return;
    }
    this.refitFrame = requestAnimationFrame(() => {
      this.refitFrame = undefined;
      this.zone.run(() => {
        this.syncRowCount();
        if (this.measurePending) {
          this.measurePending = false;
          this.virtualizer.measure();
        } else {
          this.onVirtualizerChange();
        }
      });
    });
  }

  private syncRowCount(): void {
    const count = this.source.rowCount() ?? 0;
    if (count !== this.virtualizer.options.count) {
      this.virtualizer.setOptions({ ...this.virtualizer.options, count });
    }
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
      this.source.requestRange(this.virtualItems[0].index, this.virtualItems[this.virtualItems.length - 1].index);
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
    this.gridWidth = TableFitter.contentWidth(this.scrollbarWidth + VirtualTableComponent.BORDER, this.widths);
    this.gridHeight = TableFitter.contentHeight(VirtualTableComponent.HEADER_HEIGHT + VirtualTableComponent.BORDER, this.totalSize, this.hScroll);
  }

  private applyTemplate(): void {
    this.columnsWidth = _.sum(this.widths);
    this.templateColumns = this.widths.map(width => width + 'px').join(' ');
    this.refit();
  }
}
