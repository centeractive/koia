import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, TemplateRef,
  ViewChild
} from '@angular/core';
import { CanvasPaging } from 'app/shared/model/canvas-paging.enum';
import { pageTopsOf, RowSpan } from './page-breaks';
import { PageFormat } from './page-format';
import { SheetLayout } from './sheet-layout';

/**
 * clip of the content shown on a sheet, starting at `$implicit`
 */
export interface SheetPage {
  $implicit: number;
  height: number;
}

/**
 * shows content on sheets of paper lying on a desk, laid out in printed pixels, so that it prints as shown
 */
@Component({
  selector: 'koia-table-sheets',
  templateUrl: './table-sheets.component.html',
  host: {
    class: 'div_content div_canvas_desk',
    '[style.padding.px]': 'gutterPx'
  },
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TableSheetsComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input() paging: CanvasPaging;
  @Input() title: string;
  @Input() sceneName: string;
  /** rows of the content, breaking it into pages, one page without */
  @Input() rows: RowSpan[];
  @Input() naturalHeight: number;
  /** width of the grid line between rows, shown on both pages of a page break */
  @Input() gridLine: number;
  @Input() pageTemplate: TemplateRef<SheetPage>;

  @ViewChild('pagesElement', { static: true }) pagesRef: ElementRef<HTMLDivElement>;

  readonly gutterPx = PageFormat.DESK_GUTTER_PX;
  layout = new SheetLayout();
  pagesStyle: object;
  pages: SheetPage[] = [];
  pagesWidthPx = 0;
  printedAt = new Date();

  private resizeObserver: ResizeObserver;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnChanges(): void {
    this.layout = new SheetLayout(PageFormat.of(this.paging));
    const { printWidthPx, printContentHeight, printTopPadding } = this.layout.pageFormat;
    this.pagesStyle = { ...this.layout.pagesStyle(), 'max-width': printWidthPx + 'px', '--koia-print-zoom': 1 };
    this.pages = this.pagesOf(printContentHeight - printTopPadding, this.gridLine ?? 0);
  }

  /**
   * every page break widens the clips of both its pages by the grid line, so that both show the line between their rows
   */
  private pagesOf(pageHeight: number, gridLine: number): SheetPage[] {
    const tops = pageTopsOf(this.rows ?? [], pageHeight - 2 * gridLine);
    const last = tops.length - 1;
    return tops.map((top, i) => {
      const start = i > 0 ? top - gridLine : 0;
      const end = i < last ? tops[i + 1] + gridLine : this.naturalHeight ?? top + pageHeight;
      return { $implicit: start, height: end - start };
    });
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.pagesWidthPx = this.pagesRef.nativeElement.clientWidth;
      this.cdr.detectChanges();
    });
    this.resizeObserver.observe(this.pagesRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    this.printedAt = new Date();
    this.cdr.detectChanges();
  }
}
