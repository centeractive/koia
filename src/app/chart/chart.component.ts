import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Router } from '@angular/router';
import { ResizeEvent } from 'angular-resizable-element';
import { ExportDataProvider } from 'app/shared/controller';
import { ChartContext, ChartType, Margin } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService } from 'app/shared/services/chart';
import { LanguageService } from 'app/shared/services/language';
import { listenToDocumentOutsideAngular } from 'app/shared/ui/document-listener';
import { CommonUtils } from 'app/shared/utils';
import { Subscription } from 'rxjs';
import { ChangeEvent, Route } from '../shared/model';
import { ChartJs } from './chartjs/chartjs';

@Component({
  selector: 'koia-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ChartComponent implements OnInit, OnChanges, DoCheck, OnDestroy, ExportDataProvider {

  @Input() context: ChartContext;
  @Output() onWarning = new EventEmitter<string>();

  @ViewChild('canvas') canvasRef: ElementRef<HTMLCanvasElement>;

  loading: boolean;
  marginDivStyle: object;
  validateMarginResize: (resizeEvent: ResizeEvent) => boolean;

  private destroyed = false;
  private outdated = false;
  private contextSubscription: Subscription;
  private languageSubscription: Subscription;
  private removePointerDownListener: () => void;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, private router: Router, private dbService: DBService,
    private chartDataService: ChartDataService, private chartMarginService: ChartMarginService,
    private cdr: ChangeDetectorRef, private rawDataRevealService: RawDataRevealService, private languageService: LanguageService,
    private zone: NgZone, private renderer: Renderer2) {
  }

  ngOnInit(): void {
    this.removePointerDownListener = listenToDocumentOutsideAngular(this.zone, this.renderer, 'pointerdown',
      event => this.hideResizableMarginWhenPressedElsewhere(event.target as Node));
    if (!this.dbService.getActiveScene()) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.contextSubscription = this.context.subscribeToChanges((e: ChangeEvent) => this.prepareChartAsync(e));
      this.languageSubscription = this.languageService.changed$.subscribe(() => this.onLanguageChanged());
    }
  }

  /**
   * re-creates an existing chart in order to show its texts in the new language; the context is not changed, hence no change
   * event is fired and nothing gets persisted. A chart that is not visible (e.g. its view is detached) is re-created once it becomes
   * visible again, Chart.js would otherwise render it with zero size; the same applies to context changes of a rendered chart.
   */
  private onLanguageChanged(): void {
    if (this.context.chart) {
      this.outdated = true;
      this.refreshOutdated();
    }
  }

  ngDoCheck(): void {
    this.refreshOutdated();
  }

  private refreshOutdated(): void {
    if (this.outdated && !this.destroyed && this.isVisible()) {
      this.outdated = false;
      this.prepareChartAsync(ChangeEvent.LOOK);
    }
  }

  private isVisible(): boolean {
    const canvas = this.canvasRef?.nativeElement;
    return !!canvas?.isConnected && canvas.getClientRects().length > 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['context']) {
      this.validateMarginResize = (event: ResizeEvent) => {
        const margin = this.chartMarginService.computeMargin(this.context.margin, event);
        return margin.top >= 0 && margin.right >= 0 && margin.bottom >= 0 && margin.left >= 0;
      };
    }
  }

  private prepareChartAsync(changeEvent: ChangeEvent): void {
    Promise.resolve().then(() => this.prepareChart(changeEvent));
  }

  private async prepareChart(changeEvent: ChangeEvent): Promise<void> {
    this.loading = true;
    await CommonUtils.sleep(100); // releases UI thread for showing new title and progress bar
    try {
      if (!this.destroyed && (changeEvent === ChangeEvent.LOOK || changeEvent === ChangeEvent.STRUCTURE)) {
        if (this.context.chart && !this.isVisible()) {
          this.outdated = true;
        } else {
          this.updateChart();
        }
      }
    } finally {
      this.loading = false;
    }
  }

  private updateChart(): void {
    this.marginDivStyle = this.marginToStyle(this.context.margin);

    // data is re-created on LOOK changes too: ChartDataService embeds colors into the datasets and ChartJs#create modifies context.data in place
    const chartDataResult = this.chartDataService.createData(this.context);
    if (chartDataResult.error) {
      this.onWarning.emit(chartDataResult.error);
      return;
    }
    this.context.data = chartDataResult.data;
    this.cdr.detectChanges();

    new ChartJs(this.rawDataRevealService).create(this.canvasRef.nativeElement, this.context);
  }

  ngOnDestroy(): void {
    this.removePointerDownListener();
    this.destroyed = true;
    this.contextSubscription?.unsubscribe();
    this.languageSubscription?.unsubscribe();
    this.context.chart?.destroy();
  }

  private hideResizableMarginWhenPressedElsewhere(target: Node): void {
    if (this.context.isShowResizableMargin() && !this.isResizableMarginControl(target)) {
      this.zone.run(() => this.context.toggleShowResizableMargin());
    }
  }

  private isResizableMarginControl(target: Node): boolean {
    const tile: HTMLElement = this.cmpElementRef.nativeElement.parentElement;
    return Array.from(tile.querySelectorAll('.but_element_margin, .div_margins > [mwlResizeHandle]'))
      .some(control => control.contains(target));
  }

  onMarginResizeEnd(event: ResizeEvent): void {
    const margin = this.chartMarginService.computeMargin(this.context.margin, event);
    this.marginDivStyle = this.marginToStyle(margin);
    this.chartMarginService.remember(ChartType.fromType(this.context.chartType), margin);
    this.context.margin = margin;
  }

  private marginToStyle(margin: Margin): object {
    const cmpElement = this.cmpElementRef.nativeElement;
    const headerHeight = cmpElement.getBoundingClientRect().top - cmpElement.parentElement.parentElement.getBoundingClientRect().top;
    return this.chartMarginService.marginToStyle(margin, headerHeight);
  }

  createExportData(): object[] {
    throw new Error('Method not implemented.');
  }
}
