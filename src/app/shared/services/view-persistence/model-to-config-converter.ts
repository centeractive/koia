import { ElementContext, SummaryContext, Route } from 'app/shared/model/';
import { GraphContext } from 'app/shared/model/graph';
import { ChartContext } from 'app/shared/model/chart';
import { ElementType, ViewElement, View } from 'app/shared/model/view-config';
import { Chart } from './chart.type';
import { Graph } from './graph.type';
import { Summary } from './summary.type';

export class ModelToConfigConverter {

   convert(route: Route, viewName: string, elementContexts: ElementContext[]): View {
      const configElements: ViewElement[] = elementContexts.map(c => this.toViewElement(c));
      return {
         route: route,
         name: viewName,
         modifiedTime: new Date().getTime(),
         gridColumns: null,
         gridCellRatio: null,
         elements: configElements
      };
   }

   private toViewElement(context: ElementContext): ViewElement {
      if (context instanceof ChartContext) {
         return this.toChart(context);
      } else if (context instanceof GraphContext) {
         return this.toGraph(context);
      } else if (context instanceof SummaryContext) {
         return this.toSummary(context);
      }
      throw new Error('unknown context ' + context);
   }

   private toChart(context: ChartContext): Chart {
      return {
         elementType: ElementType.CHART,
         title: context.title,
         gridColumnSpan: context.gridColumnSpan,
         gridRowSpan: context.gridRowSpan,
         width: context.width,
         height: context.height,
         dataColumns: context.dataColumns,
         splitColumns: context.splitColumns,
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
         chartType: context.chartType,
         colorOptions: context.colorProvider.options,
         margin: context.margin,
         showLegend: context.showLegend,
         legendPosition: context.legendPosition,
         xLabelRotation: context.xLabelRotation,
         stacked: context.stacked
      }
   }

   private toGraph(context: GraphContext): Graph {
      return {
         elementType: ElementType.GRAPH,
         title: context.title,
         gridColumnSpan: context.gridColumnSpan,
         gridRowSpan: context.gridRowSpan,
         width: context.width,
         height: context.height,
         dataColumns: context.dataColumns,
         splitColumns: context.splitColumns,
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
         colorOptions: context.colorProvider.options,
         linkStrength: context.linkStrength,
         friction: context.friction,
         linkDist: context.linkDist,
         charge: context.charge,
         gravity: context.gravity,
         theta: context.theta,
         alpha: context.alpha
      }
   }

   private toSummary(context: SummaryContext): Summary {
      return {
         elementType: ElementType.SUMMARY,
         title: context.title,
         gridColumnSpan: context.gridColumnSpan,
         gridRowSpan: context.gridRowSpan,
         width: context.width,
         height: context.height,
         dataColumns: context.dataColumns,
         splitColumns: context.splitColumns,
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
         colorOptions: context.colorProvider.options,
         empty: ''
      }
   }
}
