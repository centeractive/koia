import { Injectable } from '@angular/core';
import { ResizeEvent } from 'angular-resizable-element';
import { ChartType, Margin } from '../../model/chart';
import { CommonUtils } from '../../utils';


export function defaultMargin(): Margin {
   return { top: 0, right: 20, bottom: 20, left: 20 };
}

@Injectable({
   providedIn: 'root'
})
export class ChartMarginService {

   private margins: Map<ChartType, Margin>;

   constructor() {
      this.init();
   }

   private init(): void {
      this.margins = new Map();
      ChartType.ALL.forEach(t => this.margins.set(t, defaultMargin()));
   }

   marginOf(chartType: ChartType): Margin {
      const margin = this.margins.get(chartType) || defaultMargin();
      return CommonUtils.clone(margin);
   }

   remember(chartType: ChartType, margin: Margin): void {
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

   marginToStyle(margin: Margin, topOffset: number): object {
      return {
         top: (margin.top + topOffset) + 'px',
         right: margin.right + 'px',
         bottom: margin.bottom + 'px',
         left: margin.left + 'px'
      };
   }

   reset(): void {
      this.init();
   }
}
