import { Query, Aggregation, DataType, Column, TimeUnit, PropertyFilter, Operator } from 'app/shared/model';
import { ChartType, ChartContext } from 'app/shared/model/chart';
import { ChartOptionsProvider } from './chart-options-provider';
import { DatePipe } from '@angular/common';
import { DateTimeUtils } from 'app/shared/utils';
import { RawDataRevealService } from 'app/shared/services';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb';
import { ValueRangeFilter } from 'app/shared/value-range/model';

describe('ChartOptionsProvider', () => {

   const datePipe = new DatePipe('en-US');
   const sec = 1000;
   const min = 60 * sec;

   let timeColumn: Column;
   let levelColumn: Column;
   let hostColumn: Column;
   let pathColumn: Column;
   let amountColumn: Column;
   let yearColumn: Column;
   let roomNoColumn: Column;

   let now: number;
   let entries: Object[];

   let dialogService: MatDialog;
   let dialogServiceOpenSpy: jasmine.Spy;
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
      timeColumn = createColumn('Time', DataType.TIME, TimeUnit.MINUTE);
      levelColumn = createColumn('Level', DataType.TEXT);
      hostColumn = createColumn('Host', DataType.TEXT);
      pathColumn = createColumn('Path', DataType.TEXT);
      amountColumn = createColumn('Amount', DataType.NUMBER);
      yearColumn = createColumn('Year', DataType.NUMBER);
      roomNoColumn = createColumn('Room-Number', DataType.NUMBER);

      context = new ChartContext([timeColumn, levelColumn, hostColumn, pathColumn, amountColumn, yearColumn, roomNoColumn],
         ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.dataColumns = [levelColumn];
      context.groupByColumns = [timeColumn];
      context.entries = entries;
      context.legendItems = 1;
      context.query = new Query();
   });

   beforeEach(() => {
      TestBed.configureTestingModule({
         imports: [MatDialogModule, BrowserAnimationsModule],
         providers: [MatDialog]
      });
      dialogService = TestBed.get(MatDialog);
      dialogServiceOpenSpy = spyOn(dialogService, 'open').and.returnValue(null);
      const rawDataRevealService = new RawDataRevealService(dialogService);
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
         context.legendPosition = 'top';

         // when
         const options = optionsProvider.createOptions(context, true);

         // then
         const chart = options['chart'];
         const messageOnFail = '(' + chartType.type + ')';
         expect(chart.type).toBe(expectedTargetChartTypeOf(context.chartType));
         expect(chart.rotateLabels).toBe(-50, messageOnFail);
         expect(chart.showLegend).toBeFalsy(messageOnFail);
         expect(chart.legendPosition).toBe('top', messageOnFail);
      }
   });

   it('#createOptions should adjust legend margins when legend position is bottom and no-scatter chart', () => {
      const chartsThatCanHaveLegend = ChartType.ALL.filter(ct => ct !== ChartType.BAR && ct !== ChartType.SUNBURST);
      for (const chartType of chartsThatCanHaveLegend) {

         // given
         context.chartType = chartType.type;
         context.showLegend = true;
         context.legendPosition = 'bottom';
         context.margin = { bottom: 100 };

         // when
         const options = optionsProvider.createOptions(context, true);

         // then
         if (chartType === ChartType.SCATTER) {
            expect(options['chart'].legend).toBeUndefined();
         } else {
            expect(options['chart'].legend).toEqual({ margin: { top: 50, bottom: 50 } });
         }
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

   it('#createOptions should return options with tooltip formatters for pie chart', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.groupByColumns = [createColumn('y', DataType.TEXT)];
      context.valueAsPercent = false;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const tooltipValueFormatter: Function = options['chart'].tooltip.valueFormatter;
      const tooltipKeyFormatter: Function = options['chart'].tooltip.keyFormatter;
      expect(tooltipValueFormatter(1_000)).toEqual(Number(1_000).toLocaleString());
      expect(tooltipKeyFormatter('abc')).toEqual('abc');
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

   it('#createOptions should return options with X-axis tick formatters for bar chart (named unique values)', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.groupByColumns = [createColumn('y', DataType.NUMBER)];
      context.aggregations = [];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const chart = options['chart'];
      const xAxisTickFormatter: Function = chart.xAxis.tickFormat
      expect(xAxisTickFormatter(1_000)).toEqual(Number(1_000).toLocaleString());
   });

   it('#createOptions should return options with X-axis tick formatters for bar chart (count distinct values)', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [createColumn('x', DataType.NUMBER)];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const chart = options['chart'];
      const xAxisTickFormatter: Function = chart.xAxis.tickFormat
      expect(xAxisTickFormatter(1_000)).toEqual(Number(1_000).toLocaleString());
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
      context.dataColumns = [pathColumn];
      context.valueRange = { min: -1000, max: -980 };
      context.groupByColumns = [timeColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart']['forceY']).toEqual([undefined, -960]);
   });

   it('#createOptions multi bar chart Y-axis should be adjusted when chart contains big integer values of little difference each', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [amountColumn];
      context.valueRange = { min: 980, max: 1000 };
      context.groupByColumns = [timeColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart']['forceY']).toEqual([960, undefined]);
   });

   it('#createOptions multi bar chart Y-axis should not be adjusted when all values are same', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [pathColumn];
      context.valueRange = { min: 1000, max: 1000 };
      context.groupByColumns = [timeColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart']['forceY']).toBeUndefined();
   });

   it('#createOptions multi bar chart x-axis tick formatter should return non-formatted value when not grouped by time', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [pathColumn];
      context.groupByColumns = [hostColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatXAxisTick: Function = options['chart'].xAxis.tickFormat;
      expect(formatXAxisTick('server001')).toEqual('server001');
   });

   it('#createOptions horizontal multi bar chart Y-axis label should be "Count" when count distinct values', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      context.dataColumns = [levelColumn];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].yAxis.axisLabel).toEqual('Count');
   });

   it('#createOptions horizontal multi bar chart Y-axis label should be data column name when individual values', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      context.dataColumns = [amountColumn];
      context.aggregations = [];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].yAxis.axisLabel).toEqual('Amount');
   });

   it('#createOptions trend chart Y-axis label should be data column name when count distinct values', () => {

      // given
      context.chartType = ChartType.LINE_WITH_FOCUS.type;
      context.dataColumns = [levelColumn];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].yAxis.axisLabel).toEqual('Count');
   });

   it('#createOptions trend chart Y-axis label should be data column name when individual values from single data column', () => {

      // given
      context.chartType = ChartType.SCATTER.type;
      context.dataColumns = [amountColumn];
      context.aggregations = [];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].yAxis.axisLabel).toEqual('Amount');
   });

   it('#createOptions trend chart Y-axis label should be "Value" when individual values from multiple data columns', () => {

      // given
      context.chartType = ChartType.SCATTER.type;
      context.dataColumns = [amountColumn, yearColumn];
      context.aggregations = [];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      expect(options['chart'].yAxis.axisLabel).toEqual('Value');
   });

   it('#createOptions multi bar chart x-axis tick formatter should return formatted time when grouped by time', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [pathColumn];
      timeColumn.groupingTimeUnit = TimeUnit.HOUR;
      context.groupByColumns = [timeColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatXAxisTick: Function = options['chart'].xAxis.tickFormat;
      expect(formatXAxisTick(now)).toEqual(datePipe.transform(now, DateTimeUtils.ngFormatOf(TimeUnit.HOUR)));
   });

   it('#createOptions horizontal multi bar chart x-axis tick formatter should return formatted time when grouped by time', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      context.dataColumns = [pathColumn];
      timeColumn.groupingTimeUnit = TimeUnit.YEAR;
      context.groupByColumns = [timeColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatXAxisTick: Function = options['chart'].xAxis.tickFormat;
      expect(formatXAxisTick(now)).toEqual(datePipe.transform(now, DateTimeUtils.ngFormatOf(TimeUnit.YEAR)));
   });

   it('#createOptions horizontal multi bar chart x-axis tick formatter should return non-formatted value when not grouped by time', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      context.dataColumns = [pathColumn];
      context.groupByColumns = [hostColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const formatXAxisTick: Function = options['chart'].xAxis.tickFormat;
      expect(formatXAxisTick('server001')).toEqual('server001');
   });

   it('#createOptions line chart x-axis tick formatter should return formatted time when grouped by time', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [pathColumn];
      timeColumn.groupingTimeUnit = TimeUnit.HOUR;
      context.groupByColumns = [timeColumn];

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

   it('#createOptions area chart dispatch options elementMouseover should be ignored when context does not know its contaienr', () => {

      // given
      context.chartType = ChartType.AREA.type;

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const elementMouseover: (e: MouseEvent) => any = options['chart'].scatter.dispatch.elementMouseover;
      elementMouseover(<MouseEvent>{});
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

   it('#createOptions pie chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.PIE.type;
      context.dataColumns = [pathColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].pie.dispatch.elementClick;
      const event = { data: { x: '/log/var/messages' } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Path', Operator.EQUAL, '/log/var/messages')]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#createOptions multi bar chart element click handler should open raw data dialog (split columns)', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [levelColumn];
      context.splitColumns = [hostColumn, pathColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { x: now, y: 2, series: 1, key: 'Docker⯈/eager_keldysh⯈INFO' } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Host', Operator.EQUAL, 'Docker'),
         new PropertyFilter('Path', Operator.EQUAL, '/eager_keldysh'),
         new PropertyFilter('Level', Operator.EQUAL, 'INFO')
      ]);
      expect(query.getValueRangeFilters()).toEqual([
         new ValueRangeFilter('Time', { min: now, max: now + 60_000, maxExcluding: undefined })
      ]);
   });

   it('#createOptions bar chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [hostColumn];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].discretebar.dispatch.elementClick;
      const event = { data: { x: 'server001' } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.EQUAL, 'server001')]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#createOptions bar chart element click handler should open raw data dialog when filter exists', () => {

      // given
      context.query.addPropertyFilter(new PropertyFilter('Year', Operator.LESS_THAN, 2000));
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [amountColumn];
      context.groupByColumns = [yearColumn];
      context.aggregations = [];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].discretebar.dispatch.elementClick;
      const event = { data: { x: 1980, y: 598 } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Year', Operator.LESS_THAN, 2000),
         new PropertyFilter('Year', Operator.EQUAL, 1980)
      ]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#createOptions grouped multi bar chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [levelColumn];
      context.groupByColumns = [pathColumn];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { x: '/var/log/messages', key: 'WARN' } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Level', Operator.EQUAL, 'WARN'),
         new PropertyFilter('Path', Operator.EQUAL, '/var/log/messages')
      ]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#createOptions individual values multi bar chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      context.dataColumns = [amountColumn];
      context.groupByColumns = [timeColumn];
      context.aggregations = [];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { id: 515 } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, 515, DataType.TEXT)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#createOptions time grouped multi bar chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.MULTI_BAR.type;
      timeColumn.groupingTimeUnit = TimeUnit.MINUTE;
      context.dataColumns = [levelColumn];
      context.groupByColumns = [timeColumn];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { x: now, key: 'ERROR' } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'ERROR')]);
      expect(query.getValueRangeFilters()).toEqual([
         new ValueRangeFilter('Time', { min: now, max: now + 60_000, maxExcluding: undefined })
      ]);
   });

   it('#createOptions grouped horizontal multi bar chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.MULTI_HORIZONTAL_BAR.type;
      context.dataColumns = [levelColumn];
      context.groupByColumns = [pathColumn];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].multibar.dispatch.elementClick;
      const event = { data: { x: '/var/log/messages', key: 'WARN' } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Level', Operator.EQUAL, 'WARN'),
         new PropertyFilter('Path', Operator.EQUAL, '/var/log/messages')
      ]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#createOptions individual value trend chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [amountColumn];
      context.groupByColumns = [roomNoColumn];
      context.aggregations = [];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].lines.dispatch.elementClick;
      const event = { point: { x: 2, y: '2155' }, series: { key: 'Amount' } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Amount', Operator.EQUAL, 2155),
         new PropertyFilter('Room-Number', Operator.EQUAL, 2)
      ]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#createOptions aggregated value timeline chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [levelColumn];
      timeColumn.groupingTimeUnit = TimeUnit.SECOND;
      context.groupByColumns = [timeColumn];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].lines.dispatch.elementClick;
      const event = { point: { x: now }, series: { key: 'WARN' } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EQUAL, 'WARN')]);
      expect(query.getValueRangeFilters()).toEqual([new ValueRangeFilter('Time', { min: now, max: now + 1_000, maxExcluding: undefined })]);
   });

   it('#createOptions individual value timeline chart element click handler should open raw data dialog', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [amountColumn];
      context.groupByColumns = [timeColumn];
      context.aggregations = [];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].lines.dispatch.elementClick;
      const event = { point: { id: '100', x: now, y: 27 } };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, '100', DataType.TEXT)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#createOptions scatter chart element click handler should open raw data dialog (split columns)', () => {

      // given
      context.chartType = ChartType.SCATTER.type;
      context.dataColumns = [amountColumn];
      context.splitColumns = [pathColumn, levelColumn];
      context.groupByColumns = [timeColumn];
      context.aggregations = [Aggregation.COUNT];

      // when
      const options = optionsProvider.createOptions(context, true);

      // then
      const onElementClick: Function = options['chart'].scatter.dispatch.elementClick;
      const event = {
         point: { x: now - 60_000, y: 120 },
         series: { key: '/eager_keldysh⯈INFO⯈6' }
      };
      onElementClick(event, context);

      expect(dialogServiceOpenSpy).toHaveBeenCalled();
      const query: Query = dialogServiceOpenSpy.calls.argsFor(0)[1].data;
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Path', Operator.EQUAL, '/eager_keldysh'),
         new PropertyFilter('Level', Operator.EQUAL, 'INFO'),
         new PropertyFilter('Amount', Operator.EQUAL, 6)
      ]);
      expect(query.getValueRangeFilters()).toEqual([
         new ValueRangeFilter('Time', { min: now - 60_000, max: now, maxExcluding: undefined })
      ]);
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
