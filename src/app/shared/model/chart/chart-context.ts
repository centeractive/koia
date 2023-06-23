import { Chart, ChartData } from 'chart.js';
import { Margin } from '.';
import { SeriesNameConverter } from '../../services/chart/series-name-converter';
import { ValueRange } from '../../value-range/model/value-range.type';
import { Column } from '../column.type';
import { ElementContext } from '../element-context';
import { ExportFormat } from '../export-format.enum';
import { ChartType } from './chart-type';

export class ChartContext extends ElementContext {

   private _chartType: string;
   private _margin: Margin;
   private _showLegend: boolean;
   private _legendPosition: string;
   private _valueAsPercent: boolean; // for PIE and DOUGHNUT chart only
   private _xLabelRoatation: number;
   private _stacked: boolean;

   // transient
   private _data: ChartData;
   private _chart: Chart;
   private _legendItems: number;
   private showResizableMargin: boolean;
   private _valueRange: ValueRange;
   private _dataSampledDown: boolean;

   constructor(columns: Column[], chartType: string, margin: Margin) {
      super(columns);
      this._chartType = chartType;
      this._margin = margin;
      this._showLegend = true;
      this._valueAsPercent = true;
      this._legendPosition = 'top';
      this._stacked = false;
   }

   switchChartType(type: string, margin: Margin) {
      this._margin = margin;
      this.chartType = type; // keep at end, those fireing change event only once
   }

   get chartType(): string {
      return this._chartType;
   }

   set chartType(type: string) {
      if (this._chartType !== type) {
         this._chartType = type;
         this.fireStructureChanged();
      }
   }

   isCategoryChart(): boolean {
      return ChartType.isCategoryChart(ChartType.fromType(this._chartType));
   }

   isCircularChart(): boolean {
      return ChartType.isCircularChart(ChartType.fromType(this._chartType));
   }

   get margin(): Margin {
      return this._margin;
   }

   set margin(margin: Margin) {
      this._margin = margin;
      this.fireLookChanged();
   }

   isShowResizableMargin(): boolean {
      return this.showResizableMargin;
   }

   toggleShowResizableMargin(): void {
      this.showResizableMargin = !this.showResizableMargin;
   }

   get showLegend(): boolean {
      return this._showLegend;
   }

   set showLegend(showLegend: boolean) {
      if (this._showLegend !== showLegend) {
         this._showLegend = showLegend;
         this.fireLookChanged();
      }
   }

   get legendPosition(): string {
      return this._legendPosition;
   }

   set legendPosition(legendPosition: string) {
      if (this._legendPosition !== legendPosition) {
         this._legendPosition = legendPosition;
         if (this.showLegend) {
            this.fireLookChanged();
         }
      }
   }

   isCurrentLegendPosition(legendPosition: string): boolean {
      return this._legendPosition === legendPosition;
   }

   get valueAsPercent(): boolean {
      return this._valueAsPercent;
   }

   set valueAsPercent(valueAsPercent: boolean) {
      if (this._valueAsPercent !== valueAsPercent) {
         this._valueAsPercent = valueAsPercent;
         this.fireLookChanged();
      }
   }

   get xLabelRotation(): number {
      return this._xLabelRoatation;
   }

   set xLabelRotation(rotation: number) {
      if (this._xLabelRoatation !== rotation) {
         this._xLabelRoatation = rotation;
         this.fireLookChanged();
      }
   }

   get stacked(): boolean {
      return this._stacked;
   }

   set stacked(stacked: boolean) {
      if (this._stacked !== stacked) {
         this._stacked = stacked;
         this.fireStructureChanged();
      }
   }

   get data(): ChartData {
      return this._data;
   }

   set data(data: ChartData) {
      this._data = data;
   }

   get chart(): Chart {
      return this._chart;
   }

   set chart(chart: Chart) {
      this._chart = chart;
   }

   get legendItems(): number {
      return this._legendItems;
   }

   set legendItems(legendItems: number) {
      this._legendItems = legendItems;
   }

   get dataSampledDown(): boolean {
      return this._dataSampledDown;
   }

   set dataSampledDown(value: boolean) {
      this._dataSampledDown = value;
   }

   /**
    * @returns the overall value range of the generated chart data
    */
   get valueRange(): ValueRange {
      return this._valueRange;
   }

   /**
    * sets the overall value range of the generated chart data
    */
   set valueRange(valueRange: ValueRange) {
      this._valueRange = valueRange;
   }

   getTitle(): string {
      if (this.title) {
         return this.title;
      }
      let title: string;
      if (this.dataColumns.length === 0) {
         return 'Data: to be defined';
      }
      title = this.isAggregationCountSelected() ? 'Count distinct values of ' : '';
      title += this.dataColumns.map(c => c.name).join(', ');
      if (this.groupByColumns.length > 0 && (!this.isCategoryChart() || !this.isAggregationCountSelected())) {
         title += ' by ' + this.groupByColumns.map(c => c.name).join(', ');
      }
      if (this.dataSampledDown) {
         title += ' (Sample)';
      }
      if (!this.isCategoryChart() && this.splitColumns.length > 0) {
         title += '\nsplit by ' + this.splitColumns.map(c => c.name).join(SeriesNameConverter.SEPARATOR);
      }
      return title;
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [ExportFormat.PNG];
   }
}
