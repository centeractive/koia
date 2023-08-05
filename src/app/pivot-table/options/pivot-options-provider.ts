import { Column, TimeUnit } from 'app/shared/model';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { ArrayUtils, ColumnNameConverter, CommonUtils, DateTimeUtils } from 'app/shared/utils';
import { ValueRangeLabelComparator } from 'app/shared/value-range';
import { ScaleLinear, scaleLinear } from 'd3';
import { PivotContext } from '../model';
import { CellClickHandler } from './cell-click-handler';
import { compareFormattedTime } from 'app/shared/utils/comparator/formatted-time-comparator';
declare let $: any;

export class PivotOptionsProvider {

   private static readonly DEFAULT_RENDERER = 'Heatmap';

   private currConfig: object = { exclusions: [], inclusions: [] };

   constructor(private cellClickHandler: CellClickHandler) { }

   /**
    * enriches the specified pivot options with relevant elements or cretes new options if the specified [[pivotOptions]] is undefined
    */
   enrichPivotOptions(pivotOptions: object, context: PivotContext, onPivotTableRefreshEnd: (config: object) => any): object {
      if (!pivotOptions) {
         pivotOptions = { rendererName: PivotOptionsProvider.DEFAULT_RENDERER };
      }
      pivotOptions['renderers'] = $.pivotUtilities.renderers;
      pivotOptions['hiddenAttributes'] = [CouchDBConstants._ID];
      pivotOptions['sorters'] = this.createSorters(context);
      pivotOptions['rendererOptions'] = this.createRendererOptions(context);
      pivotOptions['onRefresh'] = (config: object) => {
         this.currConfig = config;
         onPivotTableRefreshEnd(config);
      };
      return pivotOptions;
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

   private onCellClicked(context: PivotContext, mouseEvent: any, filters: object, pivotData: object): void {
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
