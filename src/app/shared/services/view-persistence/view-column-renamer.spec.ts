import { Aggregation, Column, DataType, Route } from 'app/shared/model';
import { Config, ConfigRecord, ElementType, View, ViewElement } from 'app/shared/model/view-config';
import { Chart } from './chart.type';
import { ViewColumnRenamer } from './view-column-renamer';

describe('ViewColumnRenamer', () => {

   const renamer = new ViewColumnRenamer('Share', 'Ratio');

   it('#renameInView should rename data, split and group-by columns and value scales', () => {

      // given
      const chart = chartOf([column('Share'), column('Amount')], [column('Share')], [column('Share')], ['Share', 'Amount', undefined]);
      const view = viewOf(chart, summaryOf(column('Share')));

      // when
      renamer.renameInView(view);

      // then
      expect(chart.dataColumns.map(c => c.name)).toEqual(['Ratio', 'Amount']);
      expect(chart.splitColumns.map(c => c.name)).toEqual(['Ratio']);
      expect(chart.groupByColumns.map(c => c.name)).toEqual(['Ratio']);
      expect(chart.valueScales.map(s => s.columnName)).toEqual(['Ratio', 'Amount', undefined]);
      expect(view.elements[1].dataColumns.map(c => c.name)).toEqual(['Ratio']);
   });

   it('#renameInView should leave other columns untouched', () => {

      // given
      const chart = chartOf([column('Amount')], [column('Level')], [column('Time')], ['Amount']);
      const view = viewOf(chart);
      const expected = structuredClone(view);

      // when
      renamer.renameInView(view);

      // then
      expect(view).toEqual(expected);
   });

   it('#renameInConfig should rename views and raw data column widths but not pivot records', () => {

      // given
      const chart = chartOf([column('Share')], [], [], ['Share']);
      const view = viewOf(chart);
      const rawDataRecord = recordOf(Route.RAWDATA, { columnWidths: { Share: 50, Amount: 20 } });
      const pivotRecord = recordOf(Route.PIVOT, { Share: 10 });
      const config: Config = { views: [view], records: [rawDataRecord, pivotRecord] };

      // when
      renamer.renameInConfig(config);

      // then
      expect(config.views[0]).toBe(view);
      expect(chart.dataColumns[0].name).toBe('Ratio');
      expect(chart.valueScales[0].columnName).toBe('Ratio');
      expect(rawDataRecord.data).toEqual({ columnWidths: { Amount: 20, Ratio: 50 } });
      expect(pivotRecord.data).toEqual({ Share: 10 });
   });

   it('#renameInConfig should ignore raw data records without column widths', () => {

      // given
      const record = recordOf(Route.RAWDATA, { highlight: true });
      const config: Config = { views: [], records: [record] };

      // when
      renamer.renameInConfig(config);

      // then
      expect(record.data).toEqual({ highlight: true });
   });

   it('#renameInConfig should return undo restoring the changed values', () => {

      // given
      const chart = chartOf([column('Share')], [column('Share')], [column('Share')], ['Share']);
      const config: Config = { views: [viewOf(chart)], records: [recordOf(Route.RAWDATA, { columnWidths: { Share: 50 } })] };
      const expected = structuredClone(config);
      const undo = renamer.renameInConfig(config);

      // when
      undo();

      // then
      expect(config).toEqual(expected);
      expect(Object.keys(config.records[0].data['columnWidths'])).toEqual(['Share']);
   });

   it('#renameInConfig should return undo leaving references that already had the new name untouched', () => {

      // given
      const chart = chartOf([column('Share'), column('Ratio')], [], [], ['Share', 'Ratio']);
      const config: Config = {
         views: [viewOf(chart)],
         records: [recordOf(Route.RAWDATA, { columnWidths: { Share: 50, Ratio: 30 } })]
      };
      const undo = renamer.renameInConfig(config);

      // when
      undo();

      // then
      expect(chart.dataColumns.map(c => c.name)).toEqual(['Share', 'Ratio']);
      expect(chart.valueScales.map(s => s.columnName)).toEqual(['Share', 'Ratio']);
      expect(config.records[0].data).toEqual({ columnWidths: { Share: 50, Ratio: 30 } });
   });

   it('#renameKey should move key', () => {

      // given
      const record = { Share: 50, Amount: 20 };

      // when
      renamer.renameKey(record);

      // then
      expect(record).toEqual({ Ratio: 50, Amount: 20 });
   });

   it('#renameKey should ignore missing key', () => {

      // given
      const record = { Amount: 20 };

      // when
      renamer.renameKey(record);

      // then
      expect(record).toEqual({ Amount: 20 });
   });

   it('#renameKey should ignore undefined record', () => {

      // when
      const renameKey = () => renamer.renameKey(undefined);

      // then
      expect(renameKey).not.toThrow();
   });

   function column(name: string): Column {
      return { name, dataType: DataType.NUMBER, width: 10 };
   }

   function chartOf(dataColumns: Column[], splitColumns: Column[], groupByColumns: Column[], scaleColumnNames: string[]): Chart {
      return {
         elementType: ElementType.CHART, title: 'Chart', gridColumnSpan: 1, gridRowSpan: 1, width: 600, height: 600,
         dataColumns, splitColumns, groupByColumns, aggregations: [Aggregation.COUNT], valueGroupings: [],
         colorOptions: undefined, chartType: 'barChart', margin: { top: 1, right: 2, bottom: 3, left: 4 }, showLegend: true,
         legendPosition: 'top', baseScale: { ticks: { stepSize: undefined, rotation: undefined } },
         valueScales: scaleColumnNames.map(columnName => ({ columnName, ticks: { stepSize: undefined, rotation: undefined } })),
         stacked: false, multiValueAxes: false
      };
   }

   function summaryOf(dataColumn: Column): ViewElement {
      return {
         elementType: ElementType.SUMMARY, title: 'Summary', gridColumnSpan: 1, gridRowSpan: 1, width: 300, height: 300,
         dataColumns: [dataColumn], splitColumns: [], groupByColumns: [], aggregations: [Aggregation.AVG], valueGroupings: [],
         colorOptions: undefined
      };
   }

   function viewOf(...elements: ViewElement[]): View {
      return { route: Route.GRID, name: 'View', modifiedTime: 1, query: undefined, gridColumns: 2, gridCellRatio: '1:1', elements };
   }

   function recordOf(route: Route, data: object): ConfigRecord {
      return { route, name: 'Record', modifiedTime: 1, query: undefined, data };
   }
});
