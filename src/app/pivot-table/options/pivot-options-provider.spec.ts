import { Column, DataType, TimeUnit } from 'app/shared/model';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { ValueGrouping } from 'app/shared/value-range/model/value-grouping.type';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { PivotContext } from '../model';
import { CellClickHandler } from './cell-click-handler';
import { PivotOptionsProvider } from './pivot-options-provider';

describe('PivotOptionsProvider', () => {

   const timeColumn: Column = { name: 'Date/Time', dataType: DataType.TIME, width: 10 };
   let context: PivotContext;
   let cellClickHandler: CellClickHandler;
   let optionsProvider: PivotOptionsProvider;

   beforeEach(() => {
      context = {
         timeColumns: [timeColumn],
         negativeColor: 'red',
         positiveColor: 'green',
         showRowTotals: true,
         showColumnTotals: true,
         valueGroupings: [],
         pivotOptions: null
      };
      cellClickHandler = new CellClickHandler([], null, null);
      optionsProvider = new PivotOptionsProvider(cellClickHandler);
   });

   it('#enrichPivotOptions should return new options when options are missing', () => {

      // given
      const onPivotTableRefreshEnd = () => null;

      // when
      const pivotOptions = optionsProvider.enrichPivotOptions(undefined, context, onPivotTableRefreshEnd);

      // then
      expect(pivotOptions).toBeTruthy();
      expect(pivotOptions['renderers']).toBeDefined();
      expect(pivotOptions['hiddenAttributes']).toEqual([CouchDBConstants._ID]);
      expect(Object.keys(pivotOptions['sorters'])).toEqual([
         'Date/Time',
         'Date/Time (per second)',
         'Date/Time (per minute)',
         'Date/Time (per hour)',
         'Date/Time (per day)',
         'Date/Time (per month)',
         'Date/Time (per year)'
      ]);
      expect(pivotOptions['rendererOptions']).toBeDefined();
      expect(pivotOptions['onRefresh']).toBeDefined();
   });

   it('#enrichPivotOptions should enrich options when options exist', () => {

      // given
      const options = createOptions();
      delete options['hiddenAttributes'];
      delete options['rendererOptions'];
      delete options['onRefresh'];
      const onPivotTableRefreshEnd = () => console.log('onPivotTableRefreshEnd');

      // when
      const pivotOptions = optionsProvider.enrichPivotOptions(options, context, onPivotTableRefreshEnd);

      // then
      expect(pivotOptions).toBeTruthy();
      expect(pivotOptions['renderers']).toBeDefined();
      expect(pivotOptions['hiddenAttributes']).toEqual([CouchDBConstants._ID]);
      expect(Object.keys(pivotOptions['sorters'])).toEqual([
         'Date/Time',
         'Date/Time (per second)',
         'Date/Time (per minute)',
         'Date/Time (per hour)',
         'Date/Time (per day)',
         'Date/Time (per month)',
         'Date/Time (per year)'
      ]);
      expect(pivotOptions['rendererOptions']).toBeDefined();
      expect(pivotOptions['onRefresh']).toBeDefined();
   });

   it('#enrichPivotOptions should return options with sorters', () => {

      // given
      const ranges: ValueRange[] = [{ max: 20, active: true }, { max: 50, active: true }]
      const amountGrouping: ValueGrouping = { columnName: 'Amount', ranges: ranges };
      const percentGrouping: ValueGrouping = { columnName: 'Percent', ranges: ranges };
      context.valueGroupings = [amountGrouping, percentGrouping];
      const onPivotTableRefreshEnd = () => console.log('onPivotTableRefreshEnd');

      // when
      const pivotOptions = optionsProvider.enrichPivotOptions(null, context, onPivotTableRefreshEnd);

      // then
      expect(pivotOptions).toBeTruthy();
      const sorters = pivotOptions['sorters'];
      expect(sorters).toBeTruthy();
      expect(sorters.Amount).toBeTruthy();
      expect(sorters.Percent).toBeTruthy();
      const amountSorter: (v1, v2) => any = sorters.Amount;
      expect(amountSorter('min - 0', '0 - 1')).toBeLessThan(0);
      expect(amountSorter('0 - 1', 'min - 0')).toBeGreaterThan(0);
      const percentSorter: (v1, v2) => any = sorters.Percent;
      expect(percentSorter('min - 0', '0 - 1')).toBeLessThan(0);
      expect(percentSorter('0 - 1', 'min - 0')).toBeGreaterThan(0);
   });

   it('#enrichPivotOptions should return options with renderer options table click callback', () => {

      // given
      const onPivotTableRefreshEnd = () => console.log('onPivotTableRefreshEnd');
      spyOn(cellClickHandler, 'onCellClicked').and.callFake(m => null);

      // when
      const pivotOptions = optionsProvider.enrichPivotOptions(null, context, onPivotTableRefreshEnd);

      // then
      const rendererOptions = pivotOptions['rendererOptions'];
      const clickCallback: Function = rendererOptions['table']['clickCallback'];
      const mouseEvent = {};
      const filters = { x: '100', y: '57' };
      const pivotData = {};
      clickCallback(mouseEvent, '100', filters, pivotData);
      expect(cellClickHandler.onCellClicked).toHaveBeenCalledWith(context.valueGroupings, mouseEvent, filters, [], [], pivotData);
   });

   it('#enrichPivotOptions should take over "show totals" attributes from context (I)', () => {

      // given
      context.showColumnTotals = true;
      context.showRowTotals = false;
      const options = createOptions();
      const onPivotTableRefreshEnd = () => console.log('onPivotTableRefreshEnd');

      // when
      const pivotOptions = optionsProvider.enrichPivotOptions(options, context, onPivotTableRefreshEnd);

      // then
      expect(pivotOptions).toBeTruthy();
      expect(pivotOptions['rendererOptions']).toBeTruthy();
      const renderreOptions = pivotOptions['rendererOptions'];
      expect(renderreOptions.table.rowTotals).toBe(context.showRowTotals);
      expect(renderreOptions.table.colTotals).toBe(context.showColumnTotals);
   });

   it('#enrichPivotOptions should take over "show totals" attributes from context (II)', () => {

      // given
      context.showColumnTotals = false;
      context.showRowTotals = true;
      const options = createOptions();
      const onPivotTableRefreshEnd = () => console.log('onPivotTableRefreshEnd');

      // when
      const pivotOptions = optionsProvider.enrichPivotOptions(options, context, onPivotTableRefreshEnd);

      // then
      expect(pivotOptions).toBeTruthy();
      expect(pivotOptions['rendererOptions']).toBeTruthy();
      const renderreOptions = pivotOptions['rendererOptions'];
      expect(renderreOptions.table.rowTotals).toBe(context.showRowTotals);
      expect(renderreOptions.table.colTotals).toBe(context.showColumnTotals);
   });

   it('#enrichPivotOptions should return options with color scale generator', () => {

      // given
      const options = createOptions();
      const onPivotTableRefreshEnd = () => console.log('onPivotTableRefreshEnd');

      // when
      const pivotOptions = optionsProvider.enrichPivotOptions(options, context, onPivotTableRefreshEnd);

      // then
      const colorScaleGenerator: (values: number[]) => any = pivotOptions['rendererOptions'].heatmap.colorScaleGenerator;
      const scale = colorScaleGenerator.call(context, [-2, -1, 0, 1, 2]);
      expect(scale.range()).toEqual(['red', 'white', 'green']);
      expect(scale.domain()).toEqual([-2, 0, 2]);
   });

   it('#enrichPivotOptions should return options that are linked with on refresh end callback', () => {

      // given
      const onRefreshEndSpy = jasmine.createSpy('onPivotTableRefreshEnd').and.callFake(e => null);

      // when
      const pivotOptions = optionsProvider.enrichPivotOptions(undefined, context, onRefreshEndSpy);

      // then
      const onRefreshCallback: Function = pivotOptions['onRefresh'];
      onRefreshCallback();
      expect(onRefreshEndSpy).toHaveBeenCalled();
   });

   it('#clonedPurgedPivotOptions should clone options', () => {

      // given
      const existinOptions = createOptions();

      // when
      const pivotOptions = optionsProvider.clonedPurgedPivotOptions(existinOptions);

      // then
      expect(pivotOptions).not.toBe(existinOptions);
   });

   it('#clonedPurgedPivotOptions should remove values that are functions or bulky default values', () => {

      // given
      const existinOptions = createOptions();

      // when
      const pivotOptions = optionsProvider.clonedPurgedPivotOptions(existinOptions);

      // then
      expect(pivotOptions['aggregators']).toBeUndefined();
      expect(pivotOptions['renderers']).toBeUndefined();
      expect(pivotOptions['rendererOptions']).toBeUndefined();
      expect(pivotOptions['localeStrings']).toBeUndefined();
   });

   it('#isHeatmapRendererSelected should return false when no heatmap is selected', () => {

      // given
      const options = createOptions();
      options['rendererName'] = 'Table';

      // when
      const isHeatmapSelected = optionsProvider.isHeatmapRendererSelected(options);

      // then
      expect(isHeatmapSelected).toBeFalse();
   });

   it('#isHeatmapRendererSelected should return true when heatmap is selected', () => {

      // given
      const options = createOptions();
      options['rendererName'] = 'Heatmap';

      // when
      const isHeatmapSelected = optionsProvider.isHeatmapRendererSelected(options);

      // then
      expect(isHeatmapSelected).toBeTrue();
   });

   it('#isHeatmapRendererSelected should return true when row heatmap is selected', () => {

      // given
      const options = createOptions();
      options['rendererName'] = 'Row Heatmap';

      // when
      const isHeatmapSelected = optionsProvider.isHeatmapRendererSelected(options);

      // then
      expect(isHeatmapSelected).toBeTrue();
   });

   it('#isHeatmapRendererSelected should return true when column heatmap is selected', () => {

      // given
      const options = createOptions();
      options['rendererName'] = 'Col Heatmap';

      // when
      const isHeatmapSelected = optionsProvider.isHeatmapRendererSelected(options);

      // then
      expect(isHeatmapSelected).toBeTrue();
   });

   it('#replaceTimeColumnsInUse should not replace anything when no time column is in use', () => {

      // given
      const options = createOptions();
      const cols = ['Host', 'Level'];
      const rows = ['Path', 'Amount'];
      options['cols'] = cols;
      options['rows'] = rows;

      // when
      optionsProvider.replaceTimeColumnsInUse(options, timeColumn, TimeUnit.MINUTE, TimeUnit.HOUR);

      // then
      expect(options['cols']).toBe(cols);
      expect(options['rows']).toBe(rows);
   });

   it('#replaceTimeColumnsInUse should replace cols when time column is in use', () => {

      // given
      const options = createOptions();
      const cols = ['Host', 'Date/Time (per minute)', 'Level'];
      const rows = ['Path', 'Amount'];
      options['cols'] = cols;
      options['rows'] = rows;

      // when
      optionsProvider.replaceTimeColumnsInUse(options, timeColumn, TimeUnit.MINUTE, TimeUnit.HOUR);

      // then
      expect(options['cols']).toEqual(['Host', 'Date/Time (per hour)', 'Level']);
      expect(options['rows']).toBe(rows);
   });

   it('#replaceTimeColumnsInUse should replace rows when time column is in use', () => {

      // given
      const options = createOptions();
      const cols = ['Host', 'Level'];
      const rows = ['Path', 'Amount', 'Date/Time (per second)'];
      options['cols'] = cols;
      options['rows'] = rows;

      // when
      optionsProvider.replaceTimeColumnsInUse(options, timeColumn, TimeUnit.SECOND, TimeUnit.MINUTE);

      // then
      expect(options['cols']).toBe(cols);
      expect(options['rows']).toEqual(['Path', 'Amount', 'Date/Time (per minute)']);
   });
})

function createOptions(): object {
   return {
      'rendererOptions': {
         'localeStrings': {
            'renderError': 'An error occurred rendering the PivotTable results.',
            'computeError': 'An error occurred computing the PivotTable results.',
            'uiRenderError': 'An error occurred rendering the PivotTable UI.',
            'selectAll': 'Select All',
            'selectNone': 'Select None',
            'tooMany': '(too many to list)',
            'filterResults': 'Filter values',
            'apply': 'Apply',
            'cancel': 'Cancel',
            'totals': 'Totals',
            'vs': 'vs',
            'by': 'by'
         },
         'heatmap': {
         },
         'table': {
            'rowTotals': true,
            'colTotals': true
         }
      },
      'localeStrings': {
         'renderError': 'An error occurred rendering the PivotTable results.',
         'computeError': 'An error occurred computing the PivotTable results.',
         'uiRenderError': 'An error occurred rendering the PivotTable UI.',
         'selectAll': 'Select All',
         'selectNone': 'Select None',
         'tooMany': '(too many to list)',
         'filterResults': 'Filter values',
         'apply': 'Apply',
         'cancel': 'Cancel',
         'totals': 'Totals',
         'vs': 'vs',
         'by': 'by'
      },
      'derivedAttributes': {},
      'aggregators': {},
      'renderers': {},
      'hiddenAttributes': [
         'ID'
      ],
      'hiddenFromAggregators': [],
      'hiddenFromDragDrop': [],
      'menuLimit': 500,
      'cols': [],
      'rows': [],
      'vals': [],
      'rowOrder': 'key_a_to_z',
      'colOrder': 'key_a_to_z',
      'exclusions': {},
      'inclusions': {},
      'unusedAttrsVertical': 85,
      'autoSortUnusedAttrs': false,
      'showUI': true,
      'sorters': {},
      'inclusionsInfo': {},
      'aggregatorName': 'Count',
      'rendererName': 'Table'
   }
}
