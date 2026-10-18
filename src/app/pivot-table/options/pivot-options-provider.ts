import { Column, TimeUnit } from 'app/shared/model';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { LanguageService } from 'app/shared/services/language';
import { ArrayUtils, ColumnNameConverter, CommonUtils, DateTimeUtils } from 'app/shared/utils';
import { compareFormattedTime } from 'app/shared/utils/comparator/formatted-time-comparator';
import { ValueRangeLabelComparator } from 'app/shared/value-range';
import { ScaleLinear, scaleLinear } from 'd3';
import { PivotContext } from '../model';
import { CellClickHandler } from './cell-click-handler';

declare let $: { pivotUtilities: { renderers: object } };

export class PivotOptionsProvider {

   private static readonly DEFAULT_RENDERER = 'Heatmap';

   private static readonly LOCALE_STRING_KEYS = ['renderError', 'computeError', 'uiRenderError', 'selectAll', 'selectNone', 'tooMany',
      'filterResults', 'apply', 'cancel', 'totals', 'vs', 'by'];

   /**
    * translation keys of the renderer names, the names themselves are persisted and must not be translated
    */
   private static readonly RENDERER_KEYS: Record<string, string> = {
      'Table': 'table',
      'Table Barchart': 'tableBarchart',
      'Heatmap': 'heatmap',
      'Row Heatmap': 'rowHeatmap',
      'Col Heatmap': 'colHeatmap'
   };

   /**
    * translation keys of the aggregator names, the names themselves are persisted and must not be translated
    */
   private static readonly AGGREGATOR_KEYS: Record<string, string> = {
      'Count': 'count',
      'Count Unique Values': 'countUnique',
      'List Unique Values': 'listUnique',
      'Sum': 'sum',
      'Integer Sum': 'integerSum',
      'Average': 'average',
      'Median': 'median',
      'Sample Variance': 'sampleVariance',
      'Sample Standard Deviation': 'sampleStdDev',
      'Minimum': 'minimum',
      'Maximum': 'maximum',
      'First': 'first',
      'Last': 'last',
      'Sum over Sum': 'sumOverSum',
      '80% Upper Bound': 'upperBound80',
      '80% Lower Bound': 'lowerBound80',
      'Sum as Fraction of Total': 'sumFractionTotal',
      'Sum as Fraction of Rows': 'sumFractionRows',
      'Sum as Fraction of Columns': 'sumFractionColumns',
      'Count as Fraction of Total': 'countFractionTotal',
      'Count as Fraction of Rows': 'countFractionRows',
      'Count as Fraction of Columns': 'countFractionColumns'
   };

   private currConfig: object = { exclusions: [], inclusions: [] };

   constructor(private cellClickHandler: CellClickHandler) { }

   /**
    * enriches the specified pivot options with relevant elements or cretes new options if the specified [[pivotOptions]] is undefined
    */
   enrichPivotOptions(pivotOptions: object, context: PivotContext, onPivotTableRefreshEnd: (config: object) => void): object {
      if (!pivotOptions) {
         pivotOptions = { rendererName: PivotOptionsProvider.DEFAULT_RENDERER };
      }
      pivotOptions['renderers'] = $.pivotUtilities.renderers;
      pivotOptions['hiddenAttributes'] = [CouchDBConstants._ID];
      pivotOptions['sorters'] = this.createSorters(context);
      const localeStrings = this.createLocaleStrings();
      pivotOptions['localeStrings'] = localeStrings;
      pivotOptions['rendererOptions'] = { ...this.createRendererOptions(context), localeStrings };
      pivotOptions['onRefresh'] = (config: object) => {
         this.currConfig = config;
         onPivotTableRefreshEnd(config);
      };
      return pivotOptions;
   }

   /**
    * translates the displayed names of the renderers and aggregators in the selections of the specified pivot table element,
    * the option values (names) are persisted and remain unchanged
    */
   localizeSelections(pivotElement: HTMLElement): void {
      this.localizeOptions(pivotElement, 'select.pvtRenderer option', PivotOptionsProvider.RENDERER_KEYS, 'pivot.renderer.');
      this.localizeOptions(pivotElement, 'select.pvtAggregator option', PivotOptionsProvider.AGGREGATOR_KEYS, 'pivot.aggregator.');
   }

   /**
    * reveals that a click on a non-empty pivot table cell shows its raw data, the table is re-rendered on each refresh
    */
   addCellTooltips(pivotElement: HTMLElement): void {
      const title = LanguageService.instant('pivot.showData');
      pivotElement.querySelectorAll<HTMLTableCellElement>('table.pvtTable td:not(:empty)').forEach(cell => cell.title = title);
   }

   private localizeOptions(pivotElement: HTMLElement, selector: string, keys: Record<string, string>, keyPrefix: string): void {
      pivotElement.querySelectorAll<HTMLOptionElement>(selector).forEach(option => {
         const key = keys[option.value];
         if (key) {
            option.textContent = LanguageService.instant(keyPrefix + key);
         }
      });
   }

   /**
    * @returns cloned and purged pivot options
    */
   clonedPurgedPivotOptions(pivotOptions: object): object {
      const optionsClone = CommonUtils.clone(pivotOptions);

      // remove values that are functions or bulky default values
      delete optionsClone['aggregators'];
      delete optionsClone['renderers'];
      delete optionsClone['rendererOptions'];
      delete optionsClone['localeStrings'];

      return optionsClone;
   }

   /**
    * indicates if one of the heatmap renderers is currently selected
    */
   isHeatmapRendererSelected(pivotOptions: object): boolean {
      return pivotOptions['rendererName'].includes('Heatmap');
   }

   /**
    * replaces the time columns in case they're currently in use
    */
   replaceTimeColumnsInUse(pivotOptions: object, timeColumn: Column, oldTimeUnit: TimeUnit, newTimeUnit: TimeUnit): void {
      const oldLabel = ColumnNameConverter.toLabel(timeColumn, oldTimeUnit);
      const newLabel = ColumnNameConverter.toLabel(timeColumn, newTimeUnit);
      ArrayUtils.replaceElement(pivotOptions['cols'], oldLabel, newLabel);
      ArrayUtils.replaceElement(pivotOptions['rows'], oldLabel, newLabel);
   }

   private createSorters(context: PivotContext): object {
      const sorters = {};
      for (const valueGrouping of context.valueGroupings) {
         sorters[valueGrouping.columnName] = (v1: string, v2: string) => new ValueRangeLabelComparator().compare(v1, v2);
      }
      for (const timeColumn of context.timeColumns) {
         DateTimeUtils.allTimeUnits('asc').forEach(timeUnit => {
            sorters[ColumnNameConverter.toLabel(timeColumn, timeUnit)] = (v1: string, v2: string) => compareFormattedTime(v1, v2, timeUnit);
         });
      }
      return sorters;
   }

   private createLocaleStrings(): object {
      const localeStrings = {};
      PivotOptionsProvider.LOCALE_STRING_KEYS.forEach(k => localeStrings[k] = LanguageService.instant('pivot.locale.' + k));
      return localeStrings;
   }

   private createRendererOptions(context: PivotContext): object {
      return {
         heatmap: {
            colorScaleGenerator: values => this.generateColorScale(context, values)
         },
         table: {
            clickCallback: (e, value, filters, pivotData) => this.onCellClicked(context, e, filters, pivotData),
            rowTotals: context.showRowTotals,
            colTotals: context.showColumnTotals
         }
      };
   }

   private onCellClicked(context: PivotContext, mouseEvent: MouseEvent, filters: object, pivotData: object): void {
      const exclusions = this.currConfig['exclusions'];
      const inclusions = this.currConfig['inclusions'];
      this.cellClickHandler.onCellClicked(context.valueGroupings, mouseEvent, filters, exclusions, inclusions, pivotData);
   }

   private generateColorScale(context: PivotContext, values: number[]): ScaleLinear<string, string> {
      const min = Math.min(...values.filter(v => v !== 0));
      const max = Math.max(...values.filter(v => v !== 0));
      return scaleLinear<string>()
         .domain([min, 0, max])
         .range([context.negativeColor, 'white', context.positiveColor]);
   }
}
