import { Component, OnInit, Input, OnChanges, Inject, ElementRef, SimpleChanges } from '@angular/core';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { ChangeEvent } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AggregationService } from 'app/shared/services';
import { CommonUtils } from 'app/shared/utils';
import { IDataFrame, DataFrame } from 'data-forge';
import { ChartJsUtils } from './chartjs-utils';

@Component({
  selector: 'koia-chartjs',
  templateUrl: './chartjs.component.html',
  styleUrls: ['./chartjs.component.css']
})
export class ChartjsComponent implements OnInit, OnChanges {

  @Input() parentConstraintSize: boolean;
  @Input() context: ChartContext;
  @Input() entries$: Observable<Object[]>;

  computing: boolean;
  chartOptions: ChartOptions;
  chartLabels: Label[];
  chartType: ChartType;
  chartPlugins = [];
  chartData: ChartDataSets[];

  private baseDataFrame: IDataFrame<number, any>;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, private router: Router,
    private aggregationService: AggregationService) { }

  ngOnInit(): void {
    this.computing = true;
    this.context.subscribeToChanges((e: ChangeEvent) => this.contextChanged(e));
    this.entries$.subscribe(entries => this.createBaseDataFrame(entries));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries$']) {
      this.computing = true;
      this.entries$.subscribe(entries => this.createBaseDataFrame(entries));
    }
  }

  private createBaseDataFrame(entries: Object[]): void {
    this.baseDataFrame = new DataFrame(entries);
    this.prepareChart(ChangeEvent.STRUCTURE);
  }

  private contextChanged(changeEvent: ChangeEvent): void {
    this.prepareChartAsync(changeEvent);
  }

  private onEntries(entries: Object[]): void {
    this.computing = true;
    this.context.entries = entries;
  }

  private prepareChartAsync(changeEvent: ChangeEvent): void {
    Promise.resolve().then(() => this.prepareChart(changeEvent));
  }

  private async prepareChart(changeEvent: ChangeEvent): Promise<void> {
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing new title and progress bar
    if (changeEvent === ChangeEvent.SIZE && this.parentConstraintSize && this.context.chart) {
      this.context.chart.update();
    } else {
      if (changeEvent === ChangeEvent.STRUCTURE) {
        this.chartType = <ChartType> ChartJsUtils.extractChartType(this.context);
        this.chartData = this.createData(this.context);
      }
      this.context.legendItems = this.chartData.length;
      this.chartOptions = this.createOptions(this.context, this.parentConstraintSize);
    }
    this.computing = false;
  }

  createOptions(context: ChartContext, parentConstraintSize: boolean): ChartOptions {
    return {
      responsive: true,
    };
  }

  createData(context: ChartContext): ChartDataSets[] {
    const dataFrame = this.aggregationService.compute(this.baseDataFrame, this.context);
    const dataSets: ChartDataSets[] = [];
    for (const columnName of dataFrame.getColumnNames()) {
      const data = [];
      dataFrame.getSeries(columnName).forEach(v => {
        data.push( { x: v, y: v } )
      });
      dataSets.push({ label: columnName, data: data });
    }
    return dataSets;
  }
}
