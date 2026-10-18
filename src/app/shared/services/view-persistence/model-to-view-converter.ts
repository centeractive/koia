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

   private layoutOf(context: ElementContext): Pick<ViewElement, 'gridColumnSpan' | 'gridRowSpan' | 'width' | 'height' | 'x' | 'y' | 'z'> {
      return {
         gridColumnSpan: context.gridColumnSpan,
         gridRowSpan: context.gridRowSpan,
         width: context.width,
         height: context.height,
         x: context.x,
         y: context.y,
         z: context.z
      };
   }

   private toChart(context: ChartContext): Chart {
      return {
         elementType: ElementType.CHART,
         title: context.title,
         ...this.layoutOf(context),
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
         baseScale: context.baseScale.toScale(),
         valueScales: ScaleConfig.toScales(context.valueScales),
         stacked: context.stacked,
         multiValueAxes: context.multiValueAxes
      }
   }

   private toGraph(context: GraphContext): Graph {
      return {
         elementType: ElementType.GRAPH,
         title: context.title,
         ...this.layoutOf(context),
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
         ...this.layoutOf(context),
         dataColumns: context.dataColumns,
         splitColumns: context.splitColumns,
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
         colorOptions: context.colorProvider.options,
         empty: ''
      }
   }

   private toTextBox(context: TextBoxContext, elementContexts: ElementContext[]): TextBox {
      return {
         elementType: ElementType.TEXT_BOX,
         title: context.title,
         ...this.layoutOf(context),
         dataColumns: context.dataColumns,
         splitColumns: context.splitColumns,
         groupByColumns: context.groupByColumns,
         aggregations: context.aggregations,
         valueGroupings: context.valueGroupings,
         colorOptions: context.colorProvider.options,
         content: context.content,
         backgroundColor: context.backgroundColor,
         ...this.anchorOf(context, elementContexts)
      }
   }

   private anchorOf(context: TextBoxContext, elementContexts: ElementContext[]): Pick<TextBox, 'anchor' | 'anchorX' | 'anchorY'> {
      const anchor = elementContexts.indexOf(context.anchor);
      return anchor < 0 ? {} : { anchor, anchorX: context.anchorOffset.x, anchorY: context.anchorOffset.y };
   }
}
