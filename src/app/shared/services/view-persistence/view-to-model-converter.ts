import { Column, ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ElementType, ViewElement } from 'app/shared/model/view-config';
import { CommonUtils } from 'app/shared/utils';
import { Chart } from './chart.type';
import { Graph } from './graph.type';
import { Summary } from './summary.type';
import { TextBox } from './text-box.type';

export class ViewToModelConverter {

   constructor(private columns: Column[]) { }

   convert(configElements: ViewElement[]): ElementContext[] {
      const contexts = configElements.map(e => this.toElementContext(e));
      contexts.forEach((context, i) => {
         if (context instanceof TextBoxContext) {
            this.restoreAnchor(context, configElements[i] as TextBox, contexts);
         }
      });
      return contexts;
   }

   private restoreAnchor(context: TextBoxContext, textBox: TextBox, contexts: ElementContext[]): void {
      const anchor = contexts[textBox.anchor];
      if (anchor && !anchor.isOverlay()) {
         context.setAnchor(anchor, { x: textBox.anchorX, y: textBox.anchorY });
      }
   }

   private toElementContext(viewElement: ViewElement): ElementContext {
      if (viewElement.elementType === ElementType.CHART) {
         return this.toChartContext(viewElement as Chart);
      } else if (viewElement.elementType === ElementType.GRAPH) {
         return this.toGraphContext(viewElement as Graph);
      } else if (viewElement.elementType === ElementType.SUMMARY) {
         return this.toSummaryContext(viewElement as Summary);
      } else if (viewElement.elementType === ElementType.TEXT_BOX) {
         return this.toTextBoxContext(viewElement as TextBox);
      }
      throw new Error('view element of type ' + viewElement.elementType + ' not yet implemented');
   }

   private toChartContext(chart: Chart): ChartContext {
      const context = new ChartContext(this.clonedColumns(), chart.chartType, chart.margin);
      context.copyAttributes(chart);
      context.showLegend = chart.showLegend;
      context.legendPosition = chart.legendPosition;
      context.baseScale = context.baseScaleStore.toScaleConfig(chart.baseScale);
      if (chart.valueScales) {
         context.valueScales = chart.valueScales.map(s => context.valueScaleStore.toScaleConfig(s));
      }
      context.stacked = chart.stacked;
      context.multiValueAxes = chart.multiValueAxes;
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

   private toTextBoxContext(textBox: TextBox): TextBoxContext {
      const context = new TextBoxContext(this.clonedColumns());
      context.copyAttributes(textBox);
      context.content = textBox.content;
      context.backgroundColor = textBox.backgroundColor;
      return context;
   }

   private clonedColumns(): Column[] {
      return this.columns.map(c => <Column>CommonUtils.clone(c));
   }

}
