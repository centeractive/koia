import { ElementContext, ChartContext, GraphContext, SummaryContext } from '../model';
import { ElementType } from './element-type.enum';
import { ViewElement } from './view-element.type';
import { View } from './view.type';
import { Chart } from './chart.type';
import { Graph } from './graph.type';
import { Summary } from './summary.type';

export class ModelToConfigConverter {

   convert(viewName: string, elementContexts: ElementContext[]): View {
      const configElements: ViewElement[] = [];
      elementContexts.forEach(c => configElements.push(this.toViewElement(c)))
      return {
         name: viewName,
         gridColumns: null,
         gridCellRatio: null,
         elements: configElements
      };
   }

   private toViewElement(context: ElementContext): ViewElement {
      if (context instanceof ChartContext) {
         return this.toChart(<ChartContext>context);
      } else if (context instanceof GraphContext) {
         return this.toGraph(<GraphContext>context);
      } else if (context instanceof SummaryContext) {
         return this.toSummary(<SummaryContext>context);
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
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
         chartType: context.chartType,
         margin: context.margin,
         showLegend: context.showLegend,
         legendPosition: context.legendPosition,
         xLabelRotation: context.xLabelRotation
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
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
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
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
         empty: ''
      }
   }
}
