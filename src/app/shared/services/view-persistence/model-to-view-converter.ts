import { ElementContext, Query, Route, SummaryContext, TextBoxContext } from 'app/shared/model/';
import { ChartContext, ScaleConfig } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ElementType, View, ViewElement } from 'app/shared/model/view-config';
import { Chart } from './chart.type';
import { queryToQueryDef } from './filter/query-to-filter-converter';
import { Graph } from './graph.type';
import { Summary } from './summary.type';
import { TextBox } from './text-box.type';

export class ModelToViewConverter {

   convert(route: Route, viewName: string, query: Query, elementContexts: ElementContext[]): View {
      const configElements: ViewElement[] = elementContexts.map(c => this.toViewElement(c, elementContexts));
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

   private toViewElement(context: ElementContext, elementContexts: ElementContext[]): ViewElement {
      if (context instanceof ChartContext) {
         return this.toChart(context);
      } else if (context instanceof GraphContext) {
         return this.toGraph(context);
      } else if (context instanceof SummaryContext) {
         return this.toSummary(context);
      } else if (context instanceof TextBoxContext) {
         return this.toTextBox(context, elementContexts);
      }
      throw new Error('unknown context ' + context);
   }

   private viewElementOf(context: ElementContext, elementType: ElementType): ViewElement {
      return {
         elementType,
         title: context.title,
         gridColumnSpan: context.gridColumnSpan,
         gridRowSpan: context.gridRowSpan,
         width: context.width,
         height: context.height,
         x: context.x,
         y: context.y,
         z: context.z,
         dataColumns: context.dataColumns,
         splitColumns: context.splitColumns,
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
         colorOptions: context.colorProvider.options
      };
   }

   private toChart(context: ChartContext): Chart {
      return {
         ...this.viewElementOf(context, ElementType.CHART),
         chartType: context.chartType,
         margin: context.margin,
         showLegend: context.showLegend,
         legendPosition: context.legendPosition,
         baseScale: context.baseScale.toScale(),
         valueScales: ScaleConfig.toScales(context.valueScales),
         stacked: context.stacked,
         multiValueAxes: context.multiValueAxes
      }
   }

   private toGraph(context: GraphContext): Graph {
      return {
         ...this.viewElementOf(context, ElementType.GRAPH),
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
         ...this.viewElementOf(context, ElementType.SUMMARY),
         empty: ''
      }
   }

   private toTextBox(context: TextBoxContext, elementContexts: ElementContext[]): TextBox {
      return {
         ...this.viewElementOf(context, ElementType.TEXT_BOX),
         content: context.content,
         backgroundColor: context.backgroundColor,
         tiled: context.tiled,
         bordered: context.bordered,
         ...this.anchorOf(context, elementContexts)
      }
   }

   private anchorOf(context: TextBoxContext, elementContexts: ElementContext[]): Pick<TextBox, 'anchor' | 'anchorX' | 'anchorY'> {
      const anchor = elementContexts.indexOf(context.anchor);
      return anchor < 0 ? {} : { anchor, anchorX: context.anchorOffset.x, anchorY: context.anchorOffset.y };
   }
}
