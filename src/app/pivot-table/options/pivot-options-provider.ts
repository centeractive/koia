import { Column, TimeUnit } from 'app/shared/model';
import { CommonUtils, ArrayUtils, ColumnNameConverter } from 'app/shared/utils';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { ValueRangeLabelComparator } from 'app/shared/value-range';
import { CellClickHandler } from './cell-click-handler';
import { PivotContext } from '../model';
declare var $: any;

export class PivotOptionsProvider {

   private static readonly DEFAULT_RENDERER = 'Heatmap';

   constructor(private cellClickHandler: CellClickHandler) { }

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
      const oldLabel = ColumnNameConverter.toLabel(timeColumn, oldTimeUnit);
      const newLabel = ColumnNameConverter.toLabel(timeColumn, newTimeUnit);
      ArrayUtils.replaceElement(pivotOptions['cols'], oldLabel, newLabel);
      ArrayUtils.replaceElement(pivotOptions['rows'], oldLabel, newLabel);
   }

   private createSorters(context: PivotContext): Object {
      const sorters = {};
      for (const valueGrouping of context.valueGroupings) {
         sorters[valueGrouping.columnName] = (v1: string, v2: string) => new ValueRangeLabelComparator().compare(v1, v2);
      }
      return sorters;
   }

   private createRendererOptions(context: PivotContext): Object {
      return {
         heatmap: {
            colorScaleGenerator: values => this.generateColorScale(context, values)
         },
         table: {
            clickCallback: (e, value, filters, pivotData) =>
               this.cellClickHandler.onCellClicked(context.valueGroupings, e, filters, pivotData),
            rowTotals: context.showRowTotals,
            colTotals: context.showColumnTotals
         },
         c3: {}
      };
   }

   private generateColorScale(context: PivotContext, values: number[]): d3.scale.Linear<string, string> {
      const min = d3.min(values.filter(v => v !== 0));
      const max = d3.max(values.filter(v => v !== 0));
      return d3.scale.linear<string>()
         .domain([min, 0, max])
         .range([context.negativeColor, 'white', context.positiveColor]);
   }
}
