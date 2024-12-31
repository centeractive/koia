import { Column, ElementContext, SummaryContext } from 'app/shared/model';
import { ChartContext, TicksConfig } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ElementType, ViewElement } from 'app/shared/model/view-config';
import { CommonUtils } from 'app/shared/utils';
import { Chart } from './chart.type';
import { Graph } from './graph.type';
import { Summary } from './summary.type';

export class ViewToModelConverter {

   constructor(private columns: Column[]) { }

   convert(configElements: ViewElement[]): ElementContext[] {
      return configElements.map(e => this.toElementContext(e));
   }

   private toElementContext(viewElement: ViewElement): ElementContext {
      if (viewElement.elementType === ElementType.CHART) {
         return this.toChartContext(viewElement as Chart);
      } else if (viewElement.elementType === ElementType.GRAPH) {
         return this.toGraphContext(viewElement as Graph);
      } else if (viewElement.elementType === ElementType.SUMMARY) {
         return this.toSummaryContext(viewElement as Summary);
      }
      throw new Error('view element of type ' + viewElement.elementType + ' not yet implemented');
   }

   private toChartContext(chart: Chart): ChartContext {
      const context = new ChartContext(this.clonedColumns(), chart.chartType, chart.margin);
      context.copyAttributes(chart);
      context.showLegend = chart.showLegend;
      context.legendPosition = chart.legendPosition;
      context.baseTicks = new TicksConfig(() => context.fireLookChanged(), chart.baseTicks);
      context.valueTicks = new TicksConfig(() => context.fireLookChanged(), chart.valueTicks);
      context.stacked = chart.stacked;
      return context;
   }

   private toGraphContext(graph: Graph): GraphContext {
      const context = new GraphContext(this.clonedColumns());
      context.copyAttributes(graph);
      context.linkStrength = graph.linkStrength;
      context.friction = graph.friction;
      context.linkDist = graph.linkDist;
      context.charge = graph.charge;
      context.gravity = graph.gravity;
      context.theta = graph.theta;
      context.alpha = graph.alpha;
      return context;
   }

   private toSummaryContext(summary: Summary): SummaryContext {
      const context = new SummaryContext(this.clonedColumns());
      context.copyAttributes(summary);
      return context;
   }

   private clonedColumns(): Column[] {
      return this.columns.map(c => <Column>CommonUtils.clone(c));
   }

}
