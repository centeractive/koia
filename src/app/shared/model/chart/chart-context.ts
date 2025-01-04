import { SeriesNameConverter } from 'app/shared/services/chart';
import { ChartUtils } from 'app/shared/utils';
import { containsNumberOnly, isAnyNonNumeric } from 'app/shared/utils/column-utils';
import { ValueRange } from 'app/shared/value-range/model';
import { Chart, ChartData } from 'chart.js';
import * as _ from 'lodash';
import { ChartType, Margin, ScaleConfig, ScaleRestorer } from '.';
import { Aggregation } from '../aggregation.enum';
import { Column } from '../column.type';
import { ElementContext } from '../element-context';
import { ExportFormat } from '../export-format.enum';

export class ChartContext extends ElementContext {

   private _chartType: string;
   private _margin: Margin;
   private _showLegend: boolean;
   private _legendPosition: string;
   private _valueAsPercent: boolean; // for PIE and DOUGHNUT chart only
   private _baseScale: ScaleConfig;
   private _valueScales: ScaleConfig[];
   private _stacked: boolean;
   private _multiValueAxes: boolean;

   // transient   
   private readonly _baseScaleRestorer: ScaleRestorer;
   private readonly _valueScaleRestorer: ScaleRestorer;
   private _data: ChartData;
   private _chart: Chart;
   private showResizableMargin: boolean;
   private _valueRange: ValueRange;
   private _dataSampledDown: boolean;

   constructor(columns: Column[], chartType: string, margin: Margin) {
      super(columns);
      this._baseScaleRestorer = new ScaleRestorer(() => this.fireLookChanged());
      this._valueScaleRestorer = new ScaleRestorer(() => this.fireLookChanged());
      this._chartType = chartType;
      this._margin = margin;
      this._showLegend = true;
      this._valueAsPercent = true;
      this._legendPosition = 'top';
      this._baseScale = this._baseScaleRestorer.scaleConfig();
      this._stacked = false;
      this._multiValueAxes = false;
   }

   get baseScaleStore(): ScaleRestorer {
      return this._baseScaleRestorer;
   }

   get valueScaleStore(): ScaleRestorer {
      return this._valueScaleRestorer;
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

   isHorizontalChart(): boolean {
      return ChartType.isHorizontalChart(ChartType.fromType(this._chartType));
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

   /**
    * @see https://stackoverflow.com/a/28951055/2358409
    */
   override get dataColumns(): Column[] {
      return super.dataColumns;
   }

   override set dataColumns(columns: Column[]) {
      if (isAnyNonNumeric(columns)) {
         this._aggregations = [Aggregation.COUNT];
         this._groupByColumns = [];
      } else if (containsNumberOnly(columns)) {
         this._groupByColumns = ChartUtils.identifyGroupByColumns(this);
         if (this._groupByColumns?.length) {
            this._aggregations = [];
         }
      }
      this._valueScaleRestorer.store(this._valueScales);
      if (this._multiValueAxes || columns.length == 1) {
         this._valueScales = columns.map(c => this._valueScaleRestorer.scaleConfig(c));
      } else {
         this._valueScales = [this._valueScaleRestorer.scaleConfig()];
      }
      super.dataColumns = columns;
   }

   override addDataColumn(dataColumn: Column): void {
      if (this.multiValueAxes) {
         this._valueScales.push(this._valueScaleRestorer.scaleConfig(dataColumn));
      } else if (this.dataColumns.length == 1) {
         this._valueScaleRestorer.set(this._valueScales[0]);
         this._valueScales = [this._valueScaleRestorer.scaleConfig()];
      } else {
         this._valueScales = [this._valueScaleRestorer.scaleConfig(dataColumn)];
      }
      super.addDataColumn(dataColumn);
   }

   override removeDataColumn(dataColumn: Column): void {
      if (this._multiValueAxes) {
         const scaleConfig = this._valueScales.find(s => s.columnName != dataColumn.name);
         if (scaleConfig) {
            this._valueScaleRestorer.set(scaleConfig.toScale());
         }
         this._valueScales = this._valueScales.filter(s => s.columnName != dataColumn.name);
         if (this.dataColumns.length <= 2) {
            this._multiValueAxes = false;
         }
      }
      super.removeDataColumn(dataColumn);
      if (!this._multiValueAxes && this.dataColumns.length == 1) {
         this._valueScales = this._valueScaleRestorer.scaleConfigs(this.dataColumns);
      }
   }

   /**
    * @see https://stackoverflow.com/a/28951055/2358409
    */
   override get groupByColumns(): Column[] {
      return super.groupByColumns;
   }

   override set groupByColumns(columns: Column[]) {
      this._baseScaleRestorer.set(this.baseScale);
      if (columns.length) {
         this.baseScale = this._baseScaleRestorer.scaleConfig(columns[0]);
      }
      super.groupByColumns = columns;
   }

   /**
    * @see https://stackoverflow.com/a/28951055/2358409
    */
   override get splitColumns(): Column[] {
      return super.splitColumns;
   }

   override set splitColumns(splitColumns: Column[]) {
      if (!!splitColumns.length) {
         this._multiValueAxes = false;
      }
      super.splitColumns = splitColumns;
   }

   /**
    * @see https://stackoverflow.com/a/28951055/2358409
    */
   override get aggregations(): Aggregation[] {
      return super.aggregations;
   }

   override set aggregations(aggregations: Aggregation[]) {
      if (aggregations?.length) {
         this._groupByColumns = [];
      } else {
         this._groupByColumns = ChartUtils.identifyGroupByColumns(this);
      }
      super.aggregations = aggregations;
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

   get baseScale(): ScaleConfig {
      return this._baseScale;
   }

   set baseScale(baseScale: ScaleConfig) {
      if (!_.isEqual(this._baseScale.toScale(), baseScale.toScale())) {
         this._baseScale = baseScale;
         this.fireLookChanged();
      }
   }

   get valueScales(): ScaleConfig[] {
      return this._valueScales;
   }

   set valueScales(scales: ScaleConfig[]) {
      if (!_.isEqual(ScaleConfig.toScales(this._valueScales), ScaleConfig.toScales(scales))) {
         this._valueScales = scales;
         this.fireLookChanged();
      }
   }

   get stacked(): boolean {
      return this._stacked;
   }

   set stacked(stacked: boolean) {
      if (this._stacked !== stacked) {
         this._stacked = stacked;
         if (stacked) {
            this._multiValueAxes = false;
         }
         this.fireStructureChanged();
      }
   }

   get multiValueAxes(): boolean {
      return this._multiValueAxes;
   }

   set multiValueAxes(multiValueAxes: boolean) {
      if (this._multiValueAxes !== multiValueAxes) {
         this._multiValueAxes = multiValueAxes;
         this._valueScaleRestorer.store(this._valueScales);
         if (this._multiValueAxes) {
            this._stacked = false;
            this._valueScales = this._valueScaleRestorer.scaleConfigs(this.dataColumns);
         } else {
            this._valueScales = [this._valueScaleRestorer.scaleConfig()];
         }
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
