import { PivotContext, Column, TimeUnit } from 'app/shared/model';
import { CommonUtils, ArrayUtils } from 'app/shared/utils';
import { RawDataRevealService } from 'app/shared/services';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { GroupedValuesComparator } from 'app/shared/value-range';

declare var $: any;

export class PivotOptionsProvider {

   private static readonly DEFAULT_RENDERER = 'Heatmap';

   constructor(private rawDataRevealService: RawDataRevealService) {}

   /**
    * enriches the specified pivot options with relevant elements or cretes new options if the specified [[pivotOptions]] is undefined
    */
   enrichPivotOptions(pivotOptions: Object, context: PivotContext, onPivotTableRefreshEnd: () => any): Object {
      if (!pivotOptions) {
         pivotOptions = { rendererName: PivotOptionsProvider.DEFAULT_RENDERER };
      }
      pivotOptions['renderers'] = $.extend($.pivotUtilities.renderers, $.pivotUtilities.c3_renderers);
      pivotOptions['hiddenAttributes'] = [CouchDBConstants._ID];
      pivotOptions['sorters'] = this.createSorters(context);
      pivotOptions['rendererOptions'] = this.createRendererOptions(context);
      pivotOptions['onRefresh'] = config => onPivotTableRefreshEnd();
      return pivotOptions;
   }

   /**
    * @returns cloned and purged pivot options
    */
   clonedPurgedPivotOptions(pivotOptions: Object): Object {
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
   isHeatmapRendererSelected(pivotOptions: Object) {
      return pivotOptions['rendererName'].includes('Heatmap');
   }

   /**
    * replaces the time columns in case they're currently in use
    */
   replaceTimeColumnsInUse(pivotOptions: Object, timeColumn: Column, oldTimeUnit: TimeUnit, newTimeUnit: TimeUnit): void {
      const oldLabel = CommonUtils.labelOf(timeColumn, oldTimeUnit);
      const newLabel = CommonUtils.labelOf(timeColumn, newTimeUnit);
      ArrayUtils.replaceElement(pivotOptions['cols'], oldLabel, newLabel);
      ArrayUtils.replaceElement(pivotOptions['rows'], oldLabel, newLabel);
   }

   private createSorters(context: PivotContext): Object {
      const sorters = {};
      for (const valueGrouping of context.valueGroupings) {
         sorters[valueGrouping.columnName] = (v1: string, v2: string) => new GroupedValuesComparator().compare(v1, v2);
      }
      return sorters;
   }

   private createRendererOptions(context: PivotContext): Object {
      return {
         heatmap: {
            colorScaleGenerator: values => this.generateColorScale(context, values)
         },
         table: {
            clickCallback: (e, value, filters, pivotData) => this.onCellClicked(filters, pivotData),
            rowTotals: context.showRowTotals,
            colTotals: context.showColumnTotals
         },
         c3: { }
      };
   }

   private generateColorScale(context: PivotContext, values: number[]): d3.scale.Linear<string, string> {
      const min = d3.min(values.filter(v => v !== 0));
      const max = d3.max(values.filter(v => v !== 0));
      return d3.scale.linear<string>()
         .domain([min, 0, max])
         .range([context.negativeColor, 'white', context.positiveColor]);
   }

   private onCellClicked(filters, pivotData) {
      const itemIDs: string[] = [];
      pivotData.forEachMatchingRecord(filters, (item) => itemIDs.push(item[CouchDBConstants._ID]));
      if (itemIDs.length > 0) {
         this.rawDataRevealService.ofIDs(itemIDs);
      }
   }
}
