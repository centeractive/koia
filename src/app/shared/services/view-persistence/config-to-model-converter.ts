import { ElementContext, SummaryContext, Column, DataType } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ElementType, ViewElement } from 'app/shared/model/view-config';
import { Chart } from './chart.type';
import { Graph } from './graph.type';
import { Summary } from './summary.type';
import { CommonUtils } from 'app/shared/utils';
import { ColorProviderFactory } from 'app/shared/color';

export class ConfigToModelConverter {

   constructor(private columns: Column[]) { }

   convert(configElements: ViewElement[]): ElementContext[] {
      return configElements.map(e => this.toElementContext(e));
   }

   private toElementContext(viewElement: ViewElement): ElementContext {
      if (viewElement.elementType === ElementType.CHART) {
         return this.toChartContext(<Chart>viewElement);
      } else if (viewElement.elementType === ElementType.GRAPH) {
         return this.toGraphContext(<Graph>viewElement);
      } else if (viewElement.elementType === ElementType.SUMMARY) {
         return this.toSummaryContext(<Summary>viewElement);
      }
      throw new Error('view element of type ' + viewElement.elementType + ' not yet implemented');
   }

   private toChartContext(chart: Chart): ChartContext {
      const context = new ChartContext(this.clonedColumns(), chart.chartType, chart.margin);
      this.copy(chart, context);
      context.showLegend = chart.showLegend;
      context.legendPosition = chart.legendPosition;
      context.xLabelRotation = chart.xLabelRotation;
      context.stacked = chart.stacked;
      return context;
   }

   private toGraphContext(graph: Graph): GraphContext {
      const context = new GraphContext(this.clonedColumns());
      this.copy(graph, context);
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
      this.copy(summary, context);
      return context;
   }

   private clonedColumns(): Column[] {
      return this.columns.map(c => <Column>CommonUtils.clone(c));
   }

   private copy(from: ViewElement, to: ElementContext): void {
      to.title = from.title;
      to.dataColumns = from.dataColumns.map(c => this.targetColumn(c, to));
      to.splitColumns = from.splitColumns.map(c => this.targetColumn(c, to));
      to.groupByColumns = from.groupByColumns.map(c => this.targetColumn(c, to));
      to.gridColumnSpan = from.gridColumnSpan;
      to.gridRowSpan = from.gridRowSpan;
      to.setSize(from.width, from.height);
      to.aggregations = from.aggregations;
      to.valueGroupings = from.valueGroupings;
      to.colorProvider = ColorProviderFactory.create(from.colorOptions);
   }

   private targetColumn(sourceColumn: Column, targetContext: ElementContext) {
      const targetColumn = targetContext.columns.find(c => sourceColumn.name === c.name);
      if (sourceColumn.dataType === DataType.TIME) {
         targetColumn.groupingTimeUnit = sourceColumn.groupingTimeUnit;
      }
      return targetColumn;
   }
}
