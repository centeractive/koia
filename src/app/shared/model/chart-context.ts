import { ElementContext } from './element-context';
import { Margin } from 'nvd3';
import { Column } from './column.type';
import { ExportFormat } from './export-format.enum';
import { ValueRange } from '../value-range/model/value-range.type';
import { ChartType } from './chart-type';
import { GroupingType } from './grouping-type.enum';

export class ChartContext extends ElementContext {

   private _chartType: string;
   private _margin: Margin;
   private _showLegend: boolean;
   private _legendPosition: string;
   private _valueAsPercent: boolean; // for PIE and DONUT chart only
   private _xLabelRoatation = -12;
   private _stacked: boolean;

   // transient
   private _chart: any;
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
      this.chartType = type; // keep at end, those fireing change event once only
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

   isNonGrouping() {
      return ChartType.fromType(this._chartType).groupingType === GroupingType.NONE;
   }

   isMultipleGrouping() {
      return ChartType.fromType(this._chartType).groupingType === GroupingType.MULTIPLE;
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

   get legendPosition(): string {
      return this._legendPosition;
   }

   isCurrentLegendPosition(legendPosition: string): boolean {
      return this._legendPosition === legendPosition;
   }

   set legendPosition(legendPosition: string) {
      if (this._legendPosition !== legendPosition) {
         this._legendPosition = legendPosition;
         if (this.showLegend) {
            this.fireLookChanged();
         }
      }
   }

   set showLegend(showLegend: boolean) {
      if (this._showLegend !== showLegend) {
         this._showLegend = showLegend;
         this.fireLookChanged();
      }
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

   /**
    * indicates if the chart values are stacked
    *
    * the returned value may be affected by one of the following ways:
    * - by radio buttons on multibar charts that let you change between "Grouped" and "Stacked"
    * - by [[ConfigToModelConverter#toChartContext]] when restoring a saved view
    */
   get stacked(): boolean {
      if (this._chart && this._chart.multibar) {
         return this._chart.multibar.stacked();
      }
      return this._stacked;
   }

   set stacked(stacked: boolean) {
      this._stacked = stacked;
   }

   getContainer(): SVGElement {
      return this.chart ? <SVGElement>this.chart.container : null;
   }

   get chart(): any {
      return this._chart;
   }

   set chart(chart: any) {
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
      if (this.groupByColumns.length > 0 && (!this.isNonGrouping() || !this.isAggregationCountSelected())) {
         title += ' by ' + this.groupByColumns.map(c => c.name).join(', ');
      }
      return this.dataSampledDown ? title + ' (Sample)' : title;
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [ ExportFormat.PNG ];
   }
}
