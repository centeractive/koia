import { PivotContext } from './pivot-context.type';

export class PivotContextFactory {

   private static readonly LEGACY_COLORS = ['#FF3333', '#FF6633', '#FFFF33', '#0080FF', '#00FF00'];

   readonly colors = ['#E57373', '#FF8A65', '#FFF176', '#64B5F6', '#81C784'];

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

   /**
    * replaces heatmap colors of the former palette by their muted counterparts
    */
   adoptPalette(context: PivotContext): void {
      context.negativeColor = this.mutedColorOf(context.negativeColor);
      context.positiveColor = this.mutedColorOf(context.positiveColor);
   }

   private mutedColorOf(color: string): string {
      return this.colors[PivotContextFactory.LEGACY_COLORS.indexOf(color)] ?? color;
   }
}
