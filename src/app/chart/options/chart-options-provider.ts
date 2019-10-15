import { DateTimeUtils, ArrayUtils, ColumnNameConverter } from '../../shared/utils';
import { DataType, Column } from '../../shared/model';
import { ChartContext, ChartType } from '../../shared/model/chart';
import { RawDataRevealer } from './raw-data-revealer';
import { RawDataRevealService } from 'app/shared/services';
import { ForceYComputer } from './force-y-computer';
import { ValueFormatter } from 'app/shared/format';

declare var d3: any;

export class ChartOptionsProvider {

   static readonly MAX_LEGEND_ITEMS = 60;

   private rawDataReporter: RawDataRevealer;
   private numberFormat = d3.format('');
   private valueFormatter = new ValueFormatter();
   private forceYComputer = new ForceYComputer();

   constructor(rawDataRevealService: RawDataRevealService) {
      this.rawDataReporter = new RawDataRevealer(rawDataRevealService);
   }

   createOptions(context: ChartContext, gridEnabled: boolean): Object {
      const chartType = ChartType.fromType(context.chartType);
      let chart: Object;
      if (chartType === ChartType.PIE || chartType === ChartType.DONUT) {
         chart = this.pieChartOptions(context);
      } else if (chartType === ChartType.BAR) {
         chart = this.barChartOptions(context);
      } else if (chartType === ChartType.MULTI_BAR) {
         chart = this.multiBarChartOptions(context);
      } else if (chartType === ChartType.MULTI_HORIZONTAL_BAR) {
         chart = this.multiBarHorizontalChartOptions(context);
      } else if (chartType === ChartType.SUNBURST) {
         chart = this.createSunburstOptions();
      } else {
         chart = this.trendChartOptions(context);
      }
      this.defineCommonChartOptions(chart, context, gridEnabled);
      return { chart: chart };
   }

   private pieChartOptions(context: ChartContext): Object {
      return {
         donut: ChartType.fromType(context.chartType) === ChartType.DONUT,
         donutRatio: 0.35,
         labelType: context.valueAsPercent ? 'percent' : 'value',
         valueFormat: this.numberFormat,
         labelSunbeamLayout: true,
         tooltip: {
            valueFormatter: v => this.valueFormatter.formatValue(context.dataColumns[0], v),
            keyFormatter: v => this.valueFormatter.formatValue(context.groupByColumns[0], v),
         },
         pie: {
            dispatch: {
               elementClick: e => this.rawDataReporter.reveal(e, context)
            }
         }
      };
   }

   private barChartOptions(context: ChartContext): Object {
      return {
         preserveAspectRatio: 'xMinYMin meet',
         showValues: false, // show value on top of each bar
         valueFormat: this.numberFormat,
         yAxis: {
            showMaxMin: false,
            axisLabel: context.isAggregationCountSelected() ? 'Count' : context.dataColumns[0].name,
            axisLabelDistance: context.margin.left - 70,
            tickPadding: 8
         },
         forceY: this.forceYComputer.compute(context.valueRange),
         xAxis: {
            showMaxMin: false,
            axisLabel: context.isAggregationCountSelected() ? undefined : context.groupByColumns[0].name,
            axisLabelDistance: context.margin.bottom - 50,
            tickFormat: v => this.barKeyFormat(context, v),
            tickPadding: 8,
         },
         tooltip: {
            keyFormatter: v => this.barKeyFormat(context, v),
            valueFormatter: v => this.valueFormatter.formatValue(context.dataColumns[0], v)
         },
         discretebar: {
            dispatch: {
               elementClick: e => this.rawDataReporter.reveal(e, context)
            }
         }
      };
   }

   private barKeyFormat(context: ChartContext, value: any): any {
      const column = context.isAggregationCountSelected() ? context.dataColumns[0] : context.groupByColumns[0];
      return this.valueFormatter.formatValue(column, value);
   }

   private multiBarChartOptions(context: ChartContext): Object {
      return {
         stacked: context.stacked,
         preserveAspectRatio: 'xMinYMin meet',
         staggerLabels: true, // Too many bars and not enough room? Try staggering labels
         showYAxis: true,
         yAxis: {
            showMaxMin: false,
            axisLabel: context.isAggregationCountSelected() ? 'Count' : context.dataColumns[0].name,
            axisLabelDistance: context.margin.left - 70,
            tickPadding: 8,
            tickFormat: this.numberFormat
         },
         focus: true,
         showXAxis: true,
         xAxis: {
            showMaxMin: false,
            orient: 'bottom',
            axisLabel: this.xAxisLabel(context),
            axisLabelDistance: context.margin.bottom - 50,
            tickFormat: v => this.formatXAxisTick(v, context)
         },
         forceY: this.forceYComputer.compute(context.valueRange),
         multibar: {
            dispatch: {
               elementClick: e => this.rawDataReporter.reveal(e, context)
            }
         }
      };
   }

   private multiBarHorizontalChartOptions(context: ChartContext): Object {
      return {
         stacked: context.stacked,
         staggerLabels: true, // Too many bars and not enough room? Try staggering labels
         showYAxis: true,
         yAxis: { // X-Axis from user point of view
            showMaxMin: false,
            axisLabel: context.isAggregationCountSelected() ? 'Count' : context.dataColumns[0].name,
            orient: 'bottom',
            tickFormat: this.numberFormat,
            rotateLabels: context.xLabelRotation
         },
         showXAxis: true,
         xAxis: { // Y-Axis from user point of view
            showMaxMin: false,
            orient: 'left',
            axisLabel: this.xAxisLabel(context),
            axisLabelDistance: context.margin.left - 70,
            tickFormat: v => this.formatXAxisTick(v, context)
         },
         forceY: this.forceYComputer.compute(context.valueRange),
         multibar: {
            dispatch: {
               elementClick: e => this.rawDataReporter.reveal(e, context)
            }
         }
      };
   }

   private createSunburstOptions(): Object {
      return {
         groupColorByParent: true,
         mode: 'value',
         labelFormat: n => n['name'] + ' (' + this.numberFormat(n['value']) + ')',
         color: d3.scale.category20c(),
         tooltip: {
            valueFormatter: this.numberFormat
         },
         sunburst: {
            dispatch: {
               elementClick: e => console.warn('elementClick', e)
            }
         }
      };
   }

   private trendChartOptions(context: ChartContext): Object {
      return {
         // interpolate: TODO: let the user choose between 'linear', 'step' etc.
         isArea: context.chartType === ChartType.AREA.type,
         showXAxis: true,
         yAxis: {
            showMaxMin: false,
            axisLabel: context.isAggregationCountSelected() ? 'Count' :
               (context.dataColumns.length === 1 ? context.dataColumns[0].name : 'Value'),
            axisLabelDistance: context.margin.left - 70,
            tickPadding: 8,
            tickFormat: this.numberFormat
         },
         showYAxis: true,
         xAxis: {
            showMaxMin: false,
            orient: 'bottom',
            axisLabel: this.xAxisLabel(context),
            rotateLabels: context.xLabelRotation,
            tickFormat: v => this.formatXAxisTick(v, context)
         },
         focusHeight: 60,
         focusMargin: { top: 0, bottom: 40 },
         x2Axis: {
            tickFormat: v => ''
         },
         tooltip: {
            valueFormatter: this.numberFormat
         },
         lines: {
            dispatch: this.trendChartDispatchOptions(context)
         },
         scatter: {
            dispatch: this.trendChartDispatchOptions(context)
         },
         stacked: {
            dispatch: this.trendChartDispatchOptions(context)
         }
      };
   }

   private trendChartDispatchOptions(context: ChartContext): Object {
      return {
         elementClick: e => this.rawDataReporter.reveal(e, context),
         elementMouseover: e => this.changeCursor('pointer', context),
         elementMouseout: e => this.changeCursor('default', context)
      };
   }

   private defineCommonChartOptions(chart: any, context: ChartContext, gridEnabled: boolean): void {
      chart.type = this.applicableChartType(context);
      chart.width = gridEnabled ? null : context.width;
      chart.height = gridEnabled ? null : context.height;
      chart.margin = context.margin;
      chart.showLabels = true;
      chart.rotateLabels = context.xLabelRotation;
      chart.labelThreshold = 0.01;
      chart.showLegend = this.shallShowLegend(context);
      chart.legendPosition = context.legendPosition;
      this.applyWorkaroundForChartMarginTop(chart, context);
      chart.addLegendNav = true;
      chart.duration = 500;
      chart.callback = c => this.chartCallback(c, context);
      chart.dispatch = {
         renderEnd: c => console.log('chart finished rendering')
      };
   }

   private applicableChartType(context: ChartContext): string {
      let chartType = ChartType.fromType(context.chartType);
      if (chartType === ChartType.DONUT) {
         chartType = ChartType.PIE;

         // chartType === ChartType.AREA: https://stackoverflow.com/questions/35794817/angular-nvd3-set-a-ydomain-in-stackedareachart
      } else if (chartType === ChartType.AREA || (chartType === ChartType.LINE_WITH_FOCUS && context.dataSampledDown)) {
         chartType = ChartType.LINE;
      }
      return chartType.type;
   }

   private shallShowLegend(context: ChartContext): boolean {
      const chartType = ChartType.fromType(context.chartType);
      return context.showLegend &&
         context.legendItems <= ChartOptionsProvider.MAX_LEGEND_ITEMS &&
         chartType !== ChartType.BAR &&
         chartType !== ChartType.SUNBURST;
   }

   /**
    * in certain cases, nvd3 lineChart.js overwrites margin top or bottom with legend height, therefore we temporary need to
    * apply a workaround
    */
   private applyWorkaroundForChartMarginTop(chart: any, context: ChartContext): void {
      if (chart.showLegend) {
         const chartType = ChartType.fromType(context.chartType);
         const lineOrAreaChart = chartType === ChartType.LINE || chartType === ChartType.LINE_WITH_FOCUS ||
            chartType === ChartType.AREA;
         if (context.legendPosition === 'top' && lineOrAreaChart) {
            chart.legend = { margin: { bottom: context.margin.top } };
         } else if (context.legendPosition === 'bottom' && chartType !== ChartType.SCATTER) {
            const scaling = context.margin.bottom / 2;
            chart.legend = { margin: { top: scaling, bottom: scaling } };
         }
      }
   }

   private xAxisLabel(context: ChartContext): string {
      if (!context.isAggregationCountSelected()) {
         return context.groupByColumns[0].name;
      }
      return ColumnNameConverter.toLabel(context.groupByColumns[0], context.groupByColumns[0].groupingTimeUnit);
   }

   private formatXAxisTick(value: any, context: ChartContext): any {
      const column = context.groupByColumns[0];
      if (column.dataType === DataType.TIME) {
         return d3.time.format(this.xAxisTimeFormatOf(column, context))(new Date(value));
      }
      return value;
   }

   private xAxisTimeFormatOf(timeColumn: Column, context: ChartContext): string {
      const valueRange = ArrayUtils.numberValueRange(context.entries, timeColumn.name);
      let timeUnit = DateTimeUtils.largestMatchingTimeUnit(valueRange.max - valueRange.min, 10);
      if (DateTimeUtils.isOfFixedDuration(timeColumn.groupingTimeUnit) &&
         DateTimeUtils.toMilliseconds(1, timeColumn.groupingTimeUnit) > DateTimeUtils.toMilliseconds(1, timeUnit)) {
         timeUnit = timeColumn.groupingTimeUnit;
      }
      const groupingTimeUnit = context.groupByColumns[0].groupingTimeUnit;
      return DateTimeUtils.d3FormatOf(DateTimeUtils.maxTimeUnit(groupingTimeUnit, timeUnit));
   }

   /**
    * while a CSS solution was found to change the cursor to 'pointer' when hovering over pie and bar chart elements,
    * I couldn't make it work for other chart types (line, scatter etc.). Therefore, the following workaround was implemented:
    *
    *    1. the chart is stored in the ChartContext by this callback (the chart has a reference to its container)
    *    2. the cursor is changed on the chart container when the mouse hovers over a chart element
    *
    * @see method changeCursor
    */
   private chartCallback(chart: any, context: ChartContext): void {
      context.chart = chart;
   }

   private changeCursor(cursor: string, context: ChartContext): void {
      const container = context.getContainer();
      if (container) {
         container.style.cursor = cursor;
      }
   }
}
