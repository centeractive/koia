import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';
import { ResizableDirective, ResizeEvent, ResizeHandleDirective } from 'angular-resizable-element';
import { ExportDataProvider } from 'app/shared/controller';
import { ChartContext, ChartType, Margin } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService } from 'app/shared/services/chart';
import { CommonUtils } from 'app/shared/utils';
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
export class ChartComponent implements OnInit, OnChanges, ExportDataProvider {

  @Input() gridView: boolean;
  @Input() context: ChartContext;
  @Output() onWarning = new EventEmitter<string>();

  @ViewChild('canvas') canvasRef: ElementRef<HTMLCanvasElement>;

  loading: boolean;
  marginDivStyle: object;
  validateMarginResize: (resizeEvent: ResizeEvent) => boolean;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, private router: Router, private dbService: DBService,
    private chartDataService: ChartDataService, private chartMarginService: ChartMarginService,
    private cdr: ChangeDetectorRef, private rawDataRevealService: RawDataRevealService) {
  }

  ngOnInit(): void {
    if (!this.dbService.getActiveScene()) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.context.subscribeToChanges((e: ChangeEvent) => this.prepareChartAsync(e));
    }
    this.initSize();
  }

  private initSize(): void {
    if (!this.gridView) {
      const parentDivStyle = this.cmpElementRef.nativeElement.parentElement.style;
      parentDivStyle.width = this.context.width + 'px';
      parentDivStyle.height = this.context.height + 'px';
    }
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
      if (changeEvent === ChangeEvent.LOOK || changeEvent === ChangeEvent.STRUCTURE) {
        this.updateChart();
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
