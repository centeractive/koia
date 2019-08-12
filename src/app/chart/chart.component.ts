import {
  Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation, Inject, ElementRef,
  ViewChild, Output, EventEmitter
} from '@angular/core';
import { Observable } from 'rxjs';
import { ChangeEvent, ChartContext, ChartType, Route } from '../shared/model';
import { ChartOptionsProvider } from './options/chart-options-provider';
import { ChartDataService } from '../shared/services/chart-data.service';
import { CommonUtils } from 'app/shared/utils';
import { ResizeEvent } from 'angular-resizable-element';
import { Margin } from 'nvd3';
import { ChartMarginService, RawDataRevealService } from 'app/shared/services';
import { Router } from '@angular/router';
import { NvD3Component } from 'ng2-nvd3';
import { DBService } from 'app/shared/services/backend';
import { ExportDataProvider } from 'app/shared/controller';

@Component({
  selector: 'koia-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css',
    '../../../node_modules/nvd3/build/nv.d3.css'],
  encapsulation: ViewEncapsulation.None
})
export class ChartComponent implements OnInit, OnChanges, ExportDataProvider {

  @Input() parentConstraintSize: boolean;
  @Input() context: ChartContext;
  @Input() entries$: Observable<Object[]>;

  @ViewChild(NvD3Component, undefined) nvD3Component: NvD3Component;

  @Output() onWarning: EventEmitter<string> = new EventEmitter();

  chartOptions: Object;
  chartData: Object[];
  loading: boolean;
  marginDivStyle: Object;
  validateMarginResize: Function;

  private optionsProvider: ChartOptionsProvider;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, private router: Router, private dbService: DBService,
    private chartDataService: ChartDataService, private chartMarginService: ChartMarginService,
    rawDataRevealService: RawDataRevealService) {
    this.optionsProvider = new ChartOptionsProvider(rawDataRevealService);
  }

  ngOnInit(): void {
    if (!this.dbService.getActiveScene()) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.context.subscribeToChanges((e: ChangeEvent) => this.contextChanged(e));
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['context']) {
      this.validateMarginResize = (event: ResizeEvent) => {
        const margin = this.chartMarginService.computeMargin(this.context.margin, event);
        return margin.top >= 0 && margin.right >= 0 && margin.bottom >= 0 && margin.left >= 0;
      }
    }
    if (changes['entries$']) {
      this.fetchEntries();
    }
  }

  private contextChanged(changeEvent: ChangeEvent): void {
    this.prepareChartAsync(changeEvent);
  }

  private fetchEntries(): void {
    this.entries$.toPromise().then(entries => this.onEntries(entries));
  }

  private onEntries(entries: Object[]): void {
    this.context.entries = entries;
  }

  private prepareChartAsync(changeEvent: ChangeEvent): void {
    Promise.resolve().then(() => this.prepareChart(changeEvent));
  }

  private async prepareChart(changeEvent: ChangeEvent): Promise<void> {
    if (this.context.dataColumns.length > 0 && this.context.entries) {
      this.loading = true;
      await CommonUtils.sleep(100); // releases UI thread for showing new title and progress bar
      try {
        if (changeEvent === ChangeEvent.SIZE && this.parentConstraintSize && this.context.chart) {
          this.context.chart.update();
        } else {
          this.clearChartWorkaround();
          this.marginDivStyle = this.marginToStyle(this.context.margin);
          if (changeEvent === ChangeEvent.STRUCTURE) {
            const chartDataResult = this.chartDataService.createData(this.context);
            if (chartDataResult.error) {
              this.onWarning.emit(chartDataResult.error);
            }
            this.chartData = chartDataResult.data;
          }
          this.context.legendItems = this.chartData ? this.chartData.length : 0;
          this.chartOptions = this.optionsProvider.createOptions(this.context, this.parentConstraintSize);
        }
      } finally {
        this.loading = false;
      }
    }
  }

  /**
   * this workaround needs to be applied for the following reasons: 
   * - when adding data column to grouped bar chart, [[undefined]] forceY was not considered
   * - direct switch from AREA to LINE chart didn't work (AREA chart staid visible)
   * - when changing source data or resizing SCATTER charts, the data points were not properly laid out
   */
  private clearChartWorkaround(): void {
    if (this.nvD3Component) {
      this.nvD3Component.clearElement();
    }
  }

  onMarginResizeEnd(event: ResizeEvent): void {
    const margin = this.chartMarginService.computeMargin(this.context.margin, event);
    this.marginDivStyle = this.marginToStyle(margin);
    this.chartMarginService.remember(ChartType.fromType(this.context.chartType), margin);
    this.context.margin = margin;
  }

  private marginToStyle(margin: Margin): Object {
    const cmpElement = this.cmpElementRef.nativeElement;
    const headerHeight = cmpElement.getBoundingClientRect().top - cmpElement.parentElement.parentElement.getBoundingClientRect().top;
    return this.chartMarginService.marginToStyle(margin, headerHeight);
  }

  createExportData(): Object[] {
    throw new Error('Method not implemented.');
  }
}
