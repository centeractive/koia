import { PivotContext } from './pivot-context.type';

export class PivotContextFactory {

   readonly colors = ['#FF3333', '#FF6633', '#FFFF33', '#0080FF', '#00FF00'];

   create(): PivotContext {
      return {
         timeColumns: [],
         negativeColor: this.colors[0],
         positiveColor: this.colors[this.colors.length - 1],
         showRowTotals: true,
         showColumnTotals: true,
         valueGroupings: [],
         pivotOptions: null
      };
   }
}
