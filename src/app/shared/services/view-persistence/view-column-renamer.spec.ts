import { Aggregation, Column, DataType, Route } from 'app/shared/model';
import { ConfigRecord, ElementType, TabDef, View, ViewElement, ViewType } from 'app/shared/model/view-config';
import { savedViewOf } from 'app/shared/test';
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

   it('#renameInSavedViews should rename dashboard tabs and raw data column widths but not pivot tabs', () => {

      // given
      const chart = chartOf([column('Share')], [], [], ['Share']);
      const view = viewOf(chart);
      const record = pivotRecordOf({ Share: 10 });
      const savedView = savedViewOf('all', [dashboardTabOf(view), { id: 'tab2', type: ViewType.PIVOT, title: 'Pivot', record }]);
      savedView.rawData.data.columnWidths = { Share: 50, Amount: 20 };

      // when
      renamer.renameInSavedViews([savedView]);

      // then
      expect(savedView.tabs[0].view).toBe(view);
      expect(chart.dataColumns[0].name).toBe('Ratio');
      expect(chart.valueScales[0].columnName).toBe('Ratio');
      expect(savedView.rawData.data.columnWidths).toEqual({ Amount: 20, Ratio: 50 });
      expect(record.data).toEqual({ Share: 10 });
   });

   it('#renameInSavedViews should ignore raw data state without column widths', () => {

      // given
      const savedView = savedViewOf('all');
      delete savedView.rawData.data.columnWidths;
      const expected = structuredClone(savedView);

      // when
      renamer.renameInSavedViews([savedView]);

      // then
      expect(savedView).toEqual(expected);
   });

   it('#renameInSavedViews should return undo restoring the changed values', () => {

      // given
      const chart = chartOf([column('Share')], [column('Share')], [column('Share')], ['Share']);
      const savedView = savedViewOf('all', [dashboardTabOf(viewOf(chart))]);
      savedView.rawData.data.columnWidths = { Share: 50 };
      const expected = structuredClone(savedView);
      const undo = renamer.renameInSavedViews([savedView]);

      // when
      undo();

      // then
      expect(savedView).toEqual(expected);
      expect(Object.keys(savedView.rawData.data.columnWidths)).toEqual(['Share']);
   });

   it('#renameInSavedViews should return undo leaving references that already had the new name untouched', () => {

      // given
      const chart = chartOf([column('Share'), column('Ratio')], [], [], ['Share', 'Ratio']);
      const savedView = savedViewOf('all', [dashboardTabOf(viewOf(chart))]);
      savedView.rawData.data.columnWidths = { Share: 50, Ratio: 30 };
      const undo = renamer.renameInSavedViews([savedView]);

      // when
      undo();

      // then
      expect(chart.dataColumns.map(c => c.name)).toEqual(['Share', 'Ratio']);
      expect(chart.valueScales.map(s => s.columnName)).toEqual(['Share', 'Ratio']);
      expect(savedView.rawData.data.columnWidths).toEqual({ Share: 50, Ratio: 30 });
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

   function dashboardTabOf(view: View): TabDef {
      return { id: 'tab1', type: ViewType.DASHBOARD, title: 'Dashboard', view };
   }

   function pivotRecordOf(data: object): ConfigRecord {
      return { route: Route.PIVOT, name: 'Pivot', modifiedTime: 1, query: undefined, data };
   }
});
