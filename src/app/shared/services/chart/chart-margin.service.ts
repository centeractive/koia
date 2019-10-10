import { ChartType } from '../../model/chart';
import { Margin } from 'nvd3';
import { Injectable } from '@angular/core';
import { ResizeEvent } from 'angular-resizable-element';
import { CommonUtils } from '../../utils';

@Injectable({
   providedIn: 'root'
})
export class ChartMarginService {

   private static readonly ZERO_MARGIN: Margin = { top: 0, right: 0, bottom: 0, left: 0 };

   private margins: Map<ChartType, Margin>;

   constructor() {
      this.init();
   }

   private init() {
      this.margins = new Map();
      this.margins.set(ChartType.PIE, ChartMarginService.ZERO_MARGIN);
      this.margins.set(ChartType.DONUT, ChartMarginService.ZERO_MARGIN);
      this.margins.set(ChartType.BAR, { top: 10, right: 0, bottom: 50, left: 90 });
      this.margins.set(ChartType.MULTI_BAR, { top: 30, right: 10, bottom: 80, left: 90 });
      this.margins.set(ChartType.MULTI_HORIZONTAL_BAR, { top: 30, right: 10, bottom: 80, left: 160 });
      this.margins.set(ChartType.LINE, { top: 30, right: 10, bottom: 80, left: 110 });
      this.margins.set(ChartType.LINE_WITH_FOCUS, { top: 30, right: 10, bottom: 80, left: 110 });
      this.margins.set(ChartType.AREA, { top: 30, right: 10, bottom: 80, left: 110 });
      this.margins.set(ChartType.SCATTER, { top: 30, right: 10, bottom: 80, left: 110 });
      this.margins.set(ChartType.SUNBURST, { top: 20, right: 20, bottom: 20, left: 20 });
   }

   marginOf(chartType: ChartType): Margin {
      const margin = this.margins.get(chartType) || ChartMarginService.ZERO_MARGIN;
      return <Margin>CommonUtils.clone(margin);
   }

   remember(chartType: ChartType, margin: Margin) {
      this.margins.set(chartType, margin);
   }

   computeMargin(currMargin: Margin, event: ResizeEvent): Margin {
      const edges = event.edges;
      return {
         top: currMargin.top + (edges.top ? <number>edges.top : 0),
         right: currMargin.right - (edges.right ? <number>edges.right : 0),
         bottom: currMargin.bottom - (edges.bottom ? <number>edges.bottom : 0),
         left: currMargin.left + (edges.left ? <number>edges.left : 0)
      };
   }

   marginToStyle(margin: Margin, topOffset: number): Object {
      return {
        top: (margin.top + topOffset) + 'px',
        right: margin.right + 'px',
        bottom: margin.bottom + 'px',
        left: margin.left + 'px',
      };
    }

   reset() {
      this.init();
   }
}
