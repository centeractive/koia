import { ChartContext, ChartType, Query, Route, Aggregation, DataType, Column, TimeUnit, PropertyFilter, Operator } from 'app/shared/model';
import { ChartOptionsProvider } from './chart-options-provider';
import { DatePipe } from '@angular/common';
import { DateTimeUtils } from 'app/shared/utils';
import { Router } from '@angular/router';
import { RawDataRevealService } from 'app/shared/services';
import { MatDialog } from '@angular/material';

describe('ChartOptionsProvider', () => {

   const datePipe = new DatePipe('en-US');
   const sec = 1000;
   const min = 60 * sec;

   let now: number;
   let entries: Object[];

   let router: Router;
   let dialogService: MatDialog;
   let context: ChartContext;
   let optionsProvider: ChartOptionsProvider;

   beforeAll(() => {
      const date = new Date();
      date.setMilliseconds(0);
      date.setSeconds(0);
      now = date.getTime();
      entries = [
         { Time: now, /*                 */ c1: 'a', c2: null },
         { Time: now + 30 * sec, /*      */ c1: 'b', c2: 2 },
         { Time: now + min + sec, /*     */ c1: 'b', c2: 3 },
         { Time: now + min + 30 * sec, /**/ c1: 'b', c2: 3 },
      ];
   });

   beforeEach(() => {
      context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.dataColumns = [createColumn('c1', DataType.TEXT)];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];
      context.entries = entries;
      context.legendItems = 1;
      context.query = new Query();
      router = <Router>{ navigateByUrl: (url: string) => null };
      dialogService = <MatDialog> {};
      const rawDataRevealService = new RawDataRevealService(router, dialogService);
      rawDataRevealService.setUseDialog(false);
      optionsProvider = new ChartOptionsProvider(rawDataRevealService);
   });

   it('#createOptions should not define chart size when parent constraint size', () => {
      for (const chartType of ChartType.ALL) {

         // given
         context.chartType = chartType.type;

         // when
         const options = optionsProvider.createOptions(context, true);

         // then
         const chart = options['chart'];
         const messageOnFail = '(' + chartType.type + ')';
         expect(chart.width).toBeNull(messageOnFail);
         expect(chart.height).toBeNull(messageOnFail);
      }
   });

   it('#createOptions should adopt chart size from context when not parent constraint size', () => {
      for (const chartType of ChartType.ALL) {

         // given
         context.chartType = chartType.type;

         // when
         const options = optionsProvider.createOptions(context, false);

         // then
         const chart = options['chart'];
         const messageOnFail = '(' + chartType.type + ')';
         expect(chart.width).toBe(context.width, messageOnFail);
         expect(chart.height).toBe(context.height, messageOnFail);
      }
   });

   it('#createOptions should adopt common options from chart context', () => {
      for (const chartType of ChartType.ALL) {

         // given
         context.chartType = chartType.type;
         context.xLabelRotation = -50;
         context.showLegend = false;
         context.legendPosition = 'bottom';

         // when
         const options = optionsProvider.createOptions(context, true);

         // then
         const chart = options['chart'];
         const messageOnFail = '(' + chartType.type + ')';
         expect(chart.type).toBe(expectedTargetChartTypeOf(context.chartType));
         expect(chart.rotateLabels).toBe(-50, messageOnFail);
         expect(chart.showLegend).toBeFalsy(messageOnFail);
         expect(chart.legendPosition).toBe('bottom', messageOnFail);
      }
   });

   function expectedTargetChartTypeOf(chartType: string): string {
      if (context.chartType === ChartType.DONUT.type) {
         return ChartType.PIE.type;
      } else if (context.chartType === ChartType.AREA.type) {
         return ChartType.LINE.type;
      } else {
         return chartType;
      }
   }

   it('#createOptions for pie chart with value labels', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.valueAsPercent = false;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const chart = options['chart'];
      expect(chart.donut).toBeFalsy();
      expect(chart.labelType).toBe('value');
   });

   it('#createOptions for pie chart with percent labels', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.valueAsPercent = true;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const chart = options['chart'];
      expect(chart.donut).toBeFalsy();
      expect(chart.labelType).toBe('percent');
   });

   it('#createOptions should return options with tooltip value formatter for pie chart', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.valueAsPercent = false;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const tooltipValueFormatter: Function = options['chart'].tooltip.valueFormatter
      expect(tooltipValueFormatter(1_000)).toEqual(Number(1_000).toLocaleString());
   });

   it('#createOptions for donut chart', () => {

      // given
      context.chartType = ChartType.DONUT.type;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const chart = options['chart'];
      expect(chart.donut).toBeTruthy();
   });

   it('#createOptions chart callback should store chart reference in chart context', () => {

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const chart = { data: 'whatever' };
      const chartCallback: Function = options['chart'].callback;
      chartCallback(chart);
      expect(context.chart).toBe(chart);
   });

   it('#createOptions should inactivate legend when context requests so', () => {

      // given
      context.showLegend = false;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].showLegend).toBeFalsy();
   });

   it('#createOptions should inactivate legend when bar chart', () => {

      // given
      context.showLegend = true;
      context.chartType = ChartType.BAR.type;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].showLegend).toBeFalsy();
   });

   it('#createOptions should return options with tooltip formatters for bar chart when count distince values', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const chart = options['chart'];
      const tooltipKeyFormatter: Function = chart.tooltip.keyFormatter
      const tooltipValueFormatter: Function = chart.tooltip.valueFormatter
      expect(tooltipKeyFormatter(1_000)).toEqual(Number(1_000).toLocaleString());
      expect(tooltipValueFormatter(1_000)).toEqual(Number(1_000).toLocaleString());
   });

   it('#createOptions should inactivate legend when sunburst chart', () => {

      // given
      context.showLegend = true;
      context.chartType = ChartType.SUNBURST.type;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].showLegend).toBeFalsy();
   });

   it('#createOptions should activate legend when number of item does not exceed limit', () => {

      // given
      context.showLegend = true;
      context.legendItems = 10;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].showLegend).toBeTruthy();
   });

   it('#createOptions should inactivate legend when number of item exceeds limit', () => {

      // given
      context.showLegend = true;
      context.legendItems = ChartOptionsProvider.MAX_LEGEND_ITEMS + 1;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].showLegend).toBeFalsy();
   });

   it('#createOptions bar chart Y-axis should be adjusted when chart contains big negative values of little difference each', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('Path', DataType.TEXT)];
      context.valueRange = { min: -1000, max: -980 };
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.HOUR)];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart']['forceY']).toEqual([undefined, -960]);
   });

   it('#createOptions multi bar chart Y-axis should be adjusted when chart contains big integer values of little difference each', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('Amount', DataType.TEXT)];
      context.valueRange = { min: 980, max: 1000 };
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.HOUR)];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart']['forceY']).toEqual([960, undefined]);
   });

   it('#createOptions multi bar chart Y-axis should not be adjusted when all values are same', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('Path', DataType.TEXT)];
      context.valueRange = { min: 1000, max: 1000 };
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.HOUR)];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart']['forceY']).toBeUndefined();
   });

   it('#createOptions multi bar chart x-axis tick formatter should return non-formatted value when not grouped by time', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('Path', DataType.TEXT)];
      context.groupByColumns = [createColumn('Host', DataType.TEXT)];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatXAxisTick: Function = options['chart'].xAxis.tickFormat;
      expect(formatXAxisTick('server001')).toEqual('server001');
   });

   it('#createOptions horizontal multi bar chart x-axis tick formatter should return formatted time when grouped by time', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      context.dataColumns = [createColumn('Path', DataType.TEXT)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.HOUR)];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatXAxisTick: Function = options['chart'].xAxis.tickFormat;
      expect(formatXAxisTick(now)).toEqual(datePipe.transform(now, DateTimeUtils.ngFormatOf(TimeUnit.HOUR)));
   });

   it('#createOptions horizontal multi bar chart x-axis tick formatter should return non-formatted value when not grouped by time', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      context.dataColumns = [createColumn('Path', DataType.TEXT)];
      context.groupByColumns = [createColumn('Host', DataType.TEXT)];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatXAxisTick: Function = options['chart'].xAxis.tickFormat;
      expect(formatXAxisTick('server001')).toEqual('server001');
   });

   it('#createOptions line chart x-axis tick formatter should return formatted time when grouped by time', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('Path', DataType.TEXT)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.HOUR)];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatXAxisTick: Function = options['chart'].xAxis.tickFormat;
      expect(formatXAxisTick(now)).toEqual(datePipe.transform(now, DateTimeUtils.ngFormatOf(TimeUnit.HOUR)));
   });

   it('#createOptions line chart focus x-axis tick formatter should return empty string', () => {

      // given
      context.chartType = ChartType.LINE.type;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatX2AxisTick: Function = options['chart'].x2Axis.tickFormat;
      expect(formatX2AxisTick(now)).toBe('');
   });

   it('#createOptions should change line with focus chart type when down-sampled data', () => {

      // given
      context.chartType = ChartType.LINE_WITH_FOCUS.type;
      context.dataSampledDown = true;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].type).toBe(ChartType.LINE.type);
   });

   it('#createOptions should create label formatter when sunburst chart', () => {

      // given
      context.chartType = ChartType.SUNBURST.type;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const labelFormatter: (n: any) => any = options['chart'].labelFormat;
      const label = labelFormatter({ name: 'abc', value: 5 });
      expect(label).toBe('abc (5)');
   });

   it('#createOptions should create element click dispatcher when sunburst chart', () => {

      // given
      context.chartType = ChartType.SUNBURST.type;
      spyOn(console, 'warn').and.stub();

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const dispatch = options['chart'].sunburst.dispatch;
      const event = <MouseEvent>{};
      dispatch.elementClick(event);
      expect(console.warn).toHaveBeenCalledWith('elementClick', event);
   });

   it('#createOptions should create render end dispatcher', () => {

      // given
      spyOn(console, 'log').and.stub();

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      options['chart'].dispatch.renderEnd(<MouseEvent>{});
      expect(console.log).toHaveBeenCalledWith('chart finished rendering');
   });

   it('#createOptions scatter chart dispatch options elementMouseover should set "pointer" cursor', () => {

      // given
      context.chartType = ChartType.SCATTER.type;
      const chartContainer: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      context.chart = { container: chartContainer };

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const elementMouseover: (e: MouseEvent) => any = options['chart'].scatter.dispatch.elementMouseover;
      elementMouseover(<MouseEvent>{});
      expect(chartContainer.style.cursor).toBe('pointer');
   });

   it('#createOptions scatter chart dispatch options elementMouseout should set "default" cursor', () => {

      // given
      context.chartType = ChartType.SCATTER.type;
      const chartContainer: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      context.chart = { container: chartContainer };

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const elementMouseout: (e: MouseEvent) => any = options['chart'].scatter.dispatch.elementMouseout;
      elementMouseout(<MouseEvent>{});
      expect(chartContainer.style.cursor).toBe('default');
   });

   it('#createOptions pie chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.dataColumns = [createColumn('Path', DataType.TEXT)];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].pie.dispatch.elementClick;
      const event = { data: { x: '/log/var/messages' } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?Path=/log/var/messages');
   });

   it('#createOptions bar chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [createColumn('Host', DataType.TEXT)];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].discretebar.dispatch.elementClick;
      const event = { data: { x: 'server001' } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?Host=server001');
   });

   it('#createOptions bar chart element click handler should open raw data page when filter exists', () => {

      // given
      context.query.addPropertyFilter(new PropertyFilter('Year', Operator.LESS_THAN, 2000));
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [createColumn('Amount', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Year', DataType.NUMBER)];
      context.aggregations = [];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].discretebar.dispatch.elementClick;
      const event = { data: { x: '1980', y: 598 } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?Year_lt=2000&Year=1980');
   });

   it('#createOptions grouped multi bar chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('Level', DataType.TEXT)];
      context.groupByColumns = [createColumn('Path', DataType.TEXT)];
      context.aggregations = [Aggregation.COUNT];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { x: '/var/log/messages', key: 'WARN' } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?Level=WARN&Path=/var/log/messages');
   });

   it('#createOptions individual values multi bar chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('c2', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.MINUTE)];
      context.aggregations = [];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { id: 515 } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?_id=515');
   });

   it('#createOptions time grouped multi bar chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [createColumn('Level', DataType.TEXT)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.MINUTE)];
      context.aggregations = [Aggregation.COUNT];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { x: now, key: 'ERROR' } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith(
         '/' + Route.RAWDATA + '?Level=ERROR&Time_gte=' + now + '&Time_lte=' + (now + 60_000));
   });

   it('#createOptions grouped horizontal multi bar chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      context.dataColumns = [createColumn('Level', DataType.TEXT)];
      context.groupByColumns = [createColumn('Path', DataType.TEXT)];
      context.aggregations = [Aggregation.COUNT];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { x: '/var/log/messages', key: 'WARN' } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?Level=WARN&Path=/var/log/messages');
   });

   it('#createOptions individual value trend chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('Amount', DataType.NUMBER)];
      context.groupByColumns = [createColumn('Room-Number', DataType.NUMBER)];
      context.aggregations = [];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].lines.dispatch.elementClick;
      const event = { point: { x: 2, y: 2155 }, series: { key: 'Amount' } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?Amount=2155&Room-Number=2');
   });

   it('#createOptions aggregated value timeline chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('Level', DataType.TEXT)];
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.SECOND)];
      context.aggregations = [Aggregation.COUNT];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].lines.dispatch.elementClick;
      const event = { point: { x: now }, series: { key: 'WARN' } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith(
         '/' + Route.RAWDATA + '?Level=WARN&Time_gte=' + now + '&Time_lte=' + (now + 1_000));
   });

   it('#createOptions individual value timeline chart element click handler should open raw data page', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [createColumn('Amount', DataType.TEXT)];
      context.groupByColumns = [createColumn('Time', DataType.TIME)];
      context.aggregations = [];
      spyOn(router, 'navigateByUrl');

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].lines.dispatch.elementClick;
      const event = { point: { id: 100, x: now, y: 27 } };
      onElementClick(event, context);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA + '?_id=100');
   });

   function createColumn(name: string, dataType: DataType, timeUnit?: TimeUnit): Column {
      return {
         name: name,
         dataType: dataType,
         width: 10,
         groupingTimeUnit: timeUnit
      };
   }
});
