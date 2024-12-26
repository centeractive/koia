import { ElementContext, Query, Route, SummaryContext } from 'app/shared/model/';
import { ChartContext } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ElementType, View, ViewElement } from 'app/shared/model/view-config';
import { Chart } from './chart.type';
import { queryToQueryDef } from './filter/query-to-filter-converter';
import { Graph } from './graph.type';
import { Summary } from './summary.type';

export class ModelToViewConverter {

   convert(route: Route, viewName: string, query: Query, elementContexts: ElementContext[]): View {
      const configElements: ViewElement[] = elementContexts.map(c => this.toViewElement(c));
      return {
         route,
         name: viewName,
         modifiedTime: new Date().getTime(),
         query: queryToQueryDef(query),
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
         xLabelStepSize: context.xLabelStepSize,
         xLabelRotation: context.xLabelRotation,
         yLabelStepSize: context.yLabelStepSize,
         yLabelRotation: context.yLabelRotation,
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
