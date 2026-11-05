import { Aggregation, Column, DataType, Route } from 'app/shared/model';
import { ConfigRecord, ElementType, TabDef, View, ViewElement, ViewType } from 'app/shared/model/view-config';
import { savedViewOf } from 'app/shared/test';
import { ValueGrouping } from 'app/shared/value-range/model/value-grouping.type';
import { Chart } from '../chart.type';
import { ColumnReferenceUpdater } from './column-reference-updater';

describe('ColumnReferenceUpdater', () => {

   const renaming = new ColumnReferenceUpdater({ name: 'Ratio', previousName: 'Share' });
   const removing = new ColumnReferenceUpdater({ name: undefined, previousName: 'Share' });
   const creating = new ColumnReferenceUpdater({ name: 'Share', previousName: 'Share' });

   it('should classify rename', () => {
      expect(renaming.isRename()).toBe(true);
      expect(renaming.isRemoval()).toBe(false);
      expect(renaming.affectsReferences()).toBe(true);
   });

   it('should classify removal', () => {
      expect(removing.isRename()).toBe(false);
      expect(removing.isRemoval()).toBe(true);
      expect(removing.affectsReferences()).toBe(true);
   });

   it('should classify creation or formula change as not affecting references', () => {
      expect(creating.isRename()).toBe(false);
      expect(creating.isRemoval()).toBe(false);
      expect(creating.affectsReferences()).toBe(false);
   });

   it('#renamedFrom should map new name to previous name on rename', () => {
      expect(renaming.renamedFrom()).toEqual(new Map([['Ratio', 'Share']]));
   });

   it('#renamedFrom should be empty on removal, creation and formula change', () => {
      expect(removing.renamedFrom().size).toBe(0);
      expect(creating.renamedFrom().size).toBe(0);
   });

   it('#inView should rename data, split and group-by columns, value scales and value groupings', () => {

      // given
      const chart = chartOf([column('Share'), column('Amount')], [column('Share')], [column('Share')], ['Share', 'Amount', undefined]);
      chart.valueGroupings = [valueGrouping('Share'), valueGrouping('Amount')];
      const view = viewOf(chart, summaryOf(column('Share')));

      // when
      renaming.inView(view);

      // then
      expect(chart.dataColumns.map(c => c.name)).toEqual(['Ratio', 'Amount']);
      expect(chart.splitColumns.map(c => c.name)).toEqual(['Ratio']);
      expect(chart.groupByColumns.map(c => c.name)).toEqual(['Ratio']);
      expect(chart.valueScales.map(s => s.columnName)).toEqual(['Ratio', 'Amount', undefined]);
      expect(chart.valueGroupings.map(g => g.columnName)).toEqual(['Ratio', 'Amount']);
      expect(view.elements[1].dataColumns.map(c => c.name)).toEqual(['Ratio']);
   });

   it('#inView should remove data, split and group-by columns, value scales and value groupings', () => {

      // given
      const chart = chartOf([column('Share'), column('Amount')], [column('Share')], [column('Share')], ['Share', 'Amount']);
      chart.valueGroupings = [valueGrouping('Share'), valueGrouping('Amount')];
      const view = viewOf(chart);

      // when
      removing.inView(view);

      // then
      expect(chart.dataColumns.map(c => c.name)).toEqual(['Amount']);
      expect(chart.splitColumns).toEqual([]);
      expect(chart.groupByColumns).toEqual([]);
      expect(chart.valueScales.map(s => s.columnName)).toEqual(['Amount']);
      expect(chart.valueGroupings.map(g => g.columnName)).toEqual(['Amount']);
   });

   it('#inView should leave other columns untouched', () => {

      // given
      const chart = chartOf([column('Amount')], [column('Level')], [column('Time')], ['Amount']);
      chart.valueGroupings = [valueGrouping('Amount')];
      const view = viewOf(chart);
      const expected = structuredClone(view);

      // when
      renaming.inView(view);
      removing.inView(view);

      // then
      expect(view).toEqual(expected);
   });

   it('#inView should ignore elements without value scales and value groupings', () => {

      // given
      const summary = summaryOf(column('Share'));
      delete summary.valueGroupings;
      const view = viewOf(summary);

      // when
      renaming.inView(view);

      // then
      expect(summary.dataColumns.map(c => c.name)).toEqual(['Ratio']);
      expect(Object.hasOwn(summary, 'valueScales')).toBe(false);
      expect(Object.hasOwn(summary, 'valueGroupings')).toBe(false);
   });

   it('#inRecord should rename value groupings and pivot fields, exclusions and inclusions', () => {

      // given
      const record = pivotRecordOf();

      // when
      renaming.inRecord(record);

      // then
      expect(record.data).toEqual({
         valueGroupings: [valueGrouping('Ratio'), valueGrouping('Amount')],
         pivotOptions: {
            rows: ['Ratio', 'Level'], cols: ['Ratio'], vals: ['Ratio'], rendererName: 'Table',
            exclusions: { Ratio: ['1'], Level: ['2'] }, inclusions: { Ratio: ['3'] }, inclusionsInfo: { Ratio: ['4'] }
         }
      });
   });

   it('#inRecord should remove value groupings and pivot fields, exclusions and inclusions', () => {

      // given
      const record = pivotRecordOf();

      // when
      removing.inRecord(record);

      // then
      expect(record.data).toEqual({
         valueGroupings: [valueGrouping('Amount')],
         pivotOptions: {
            rows: ['Level'], cols: [], vals: [], rendererName: 'Table',
            exclusions: { Level: ['2'] }, inclusions: {}, inclusionsInfo: {}
         }
      });
   });

   it('#inRecord should rename value groupings of record without pivot options', () => {

      // given
      const record = recordOf({ valueGroupings: [valueGrouping('Share')] });

      // when
      renaming.inRecord(record);

      // then
      expect(record.data).toEqual({ valueGroupings: [valueGrouping('Ratio')] });
   });

   it('#inSavedViews should update dashboard tabs, pivot tabs and raw data column widths', () => {

      // given
      const chart = chartOf([column('Share')], [], [], ['Share']);
      const view = viewOf(chart);
      const record = pivotRecordOf();
      const savedView = savedViewOf('all', [dashboardTabOf(view), pivotTabOf(record)]);
      savedView.rawData.data.columnWidths = { Share: 50, Amount: 20 };

      // when
      renaming.inSavedViews([savedView]);

      // then
      expect(savedView.tabs[0].view).toBe(view);
      expect(chart.dataColumns[0].name).toBe('Ratio');
      expect(chart.valueScales[0].columnName).toBe('Ratio');
      expect(record.data['pivotOptions'].rows).toEqual(['Ratio', 'Level']);
      expect(record.data['valueGroupings'][0].columnName).toBe('Ratio');
      expect(savedView.rawData.data.columnWidths).toEqual({ Amount: 20, Ratio: 50 });
   });

   it('#inSavedViews should remove column from dashboard tabs, pivot tabs and raw data column widths', () => {

      // given
      const chart = chartOf([column('Share'), column('Amount')], [], [], ['Share', 'Amount']);
      const record = pivotRecordOf();
      const savedView = savedViewOf('all', [dashboardTabOf(viewOf(chart)), pivotTabOf(record)]);
      savedView.rawData.data.columnWidths = { Share: 50, Amount: 20 };

      // when
      removing.inSavedViews([savedView]);

      // then
      expect(chart.dataColumns.map(c => c.name)).toEqual(['Amount']);
      expect(record.data['pivotOptions'].rows).toEqual(['Level']);
      expect(savedView.rawData.data.columnWidths).toEqual({ Amount: 20 });
   });

   it('#inSavedViews should ignore raw data state without column widths', () => {

      // given
      const savedView = savedViewOf('all');
      delete savedView.rawData.data.columnWidths;
      const expected = structuredClone(savedView);

      // when
      renaming.inSavedViews([savedView]);

      // then
      expect(savedView).toEqual(expected);
   });

   it('#inSavedViews should return undo restoring the renamed values', () => {

      // given
      const chart = chartOf([column('Share')], [column('Share')], [column('Share')], ['Share']);
      const savedView = savedViewOf('all', [dashboardTabOf(viewOf(chart)), pivotTabOf(pivotRecordOf())]);
      savedView.rawData.data.columnWidths = { Share: 50 };
      const expected = structuredClone(savedView);
      const undo = renaming.inSavedViews([savedView]);

      // when
      undo();

      // then
      expect(savedView).toEqual(expected);
      expect(Object.keys(savedView.rawData.data.columnWidths)).toEqual(['Share']);
   });

   it('#inSavedViews should return undo leaving references that already had the new name untouched', () => {

      // given
      const chart = chartOf([column('Share'), column('Ratio')], [], [], ['Share', 'Ratio']);
      const savedView = savedViewOf('all', [dashboardTabOf(viewOf(chart))]);
      savedView.rawData.data.columnWidths = { Share: 50, Ratio: 30 };
      const undo = renaming.inSavedViews([savedView]);

      // when
      undo();

      // then
      expect(chart.dataColumns.map(c => c.name)).toEqual(['Share', 'Ratio']);
      expect(chart.valueScales.map(s => s.columnName)).toEqual(['Share', 'Ratio']);
      expect(savedView.rawData.data.columnWidths).toEqual({ Share: 50, Ratio: 30 });
   });

   it('#inSavedViews should return undo restoring the removed references', () => {

      // given
      const chart = chartOf([column('Share'), column('Amount')], [column('Share')], [], ['Share', 'Amount']);
      const savedView = savedViewOf('all', [dashboardTabOf(viewOf(chart)), pivotTabOf(pivotRecordOf())]);
      savedView.rawData.data.columnWidths = { Share: 50, Amount: 20 };
      const expected = structuredClone(savedView);
      const undo = removing.inSavedViews([savedView]);

      // when
      undo();

      // then
      expect(savedView).toEqual(expected);
   });

   it('#inTabs should update views of dashboard tabs and records of pivot tabs', () => {

      // given
      const chart = chartOf([column('Share')], [], [], ['Share']);
      const record = pivotRecordOf();

      // when
      renaming.inTabs([dashboardTabOf(viewOf(chart)), pivotTabOf(record)]);

      // then
      expect(chart.dataColumns[0].name).toBe('Ratio');
      expect(record.data['pivotOptions'].cols).toEqual(['Ratio']);
   });

   it('#inWidths should move width', () => {

      // given
      const widths = { Share: 50, Amount: 20 };

      // when
      renaming.inWidths(widths);

      // then
      expect(widths).toEqual({ Ratio: 50, Amount: 20 });
   });

   it('#inWidths should delete width on removal', () => {

      // given
      const widths = { Share: 50, Amount: 20 };

      // when
      removing.inWidths(widths);

      // then
      expect(widths).toEqual({ Amount: 20 });
   });

   it('#inWidths should ignore undefined widths', () => {

      // when
      const inWidths = () => renaming.inWidths(undefined);

      // then
      expect(inWidths).not.toThrow();
   });

   it('should leave all references untouched on creation or formula change', () => {

      // given
      const chart = chartOf([column('Share')], [column('Share')], [column('Share')], ['Share']);
      const view = viewOf(chart);
      const record = pivotRecordOf();
      const savedView = savedViewOf('all', [dashboardTabOf(viewOf(structuredClone(chart))), pivotTabOf(pivotRecordOf())]);
      savedView.rawData.data.columnWidths = { Share: 50 };
      const widths = { Share: 50 };
      const expected = structuredClone({ view, record, savedView, widths });

      // when
      creating.inView(view);
      creating.inRecord(record);
      creating.inTabs(savedView.tabs);
      creating.inSavedViews([savedView])();
      creating.inWidths(widths);

      // then
      expect({ view, record, savedView, widths }).toEqual(expected);
   });

   function column(name: string): Column {
      return { name, dataType: DataType.NUMBER, width: 10 };
   }

   function valueGrouping(columnName: string): ValueGrouping {
      return { columnName, ranges: [{ min: 0, max: 10, active: true }] };
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

   function pivotTabOf(record: ConfigRecord): TabDef {
      return { id: 'tab2', type: ViewType.PIVOT, title: 'Pivot', record };
   }

   function pivotRecordOf(): ConfigRecord {
      return recordOf({
         valueGroupings: [valueGrouping('Share'), valueGrouping('Amount')],
         pivotOptions: {
            rows: ['Share', 'Level'], cols: ['Share'], vals: ['Share'], rendererName: 'Table',
            exclusions: { Share: ['1'], Level: ['2'] }, inclusions: { Share: ['3'] }, inclusionsInfo: { Share: ['4'] }
         }
      });
   }

   function recordOf(data: object): ConfigRecord {
      return { route: Route.PIVOT, name: 'Pivot', modifiedTime: 1, query: undefined, data };
   }
});
