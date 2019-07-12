import { RawDataLinkFactory } from '../shared/utils';
import { GraphContext, PropertyFilter } from '../shared/model';
import { GraphNode } from '../shared/model/graph-node.type';
import { GraphUtils } from './graph-utils';
import { Router } from '@angular/router';

declare var d3: any;

/**
 * Options provider for d3-force graph
 *
 * @see https://github.com/d3/d3-force
 */
export class GraphOptionsProvider {

   constructor(private router: Router) {}

   createOptions(context: GraphContext, parentDiv: HTMLDivElement): Object {
      const color = d3.scale.category20();
      return {
         chart: {
            type: 'forceDirectedGraph',
            width: parentDiv ? parentDiv.clientWidth : context.width,
            height: parentDiv ? parentDiv.clientHeight : context.height,
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            linkStrength: context.linkStrength,
            friction: context.friction,
            linkDist: context.linkDist,
            charge: context.charge,
            gravity: context.gravity,
            theta: context.theta,
            alpha: context.alpha,
            radius: 8,
            tooltip: {
               contentGenerator: node => this.generateTooltip(node, context)
            },
            color: node => color(node.group),
            nodeExtras: nodes => this.shapeNodes(nodes, context)
         }
      }
   }

   private shapeNodes(nodes, context: GraphContext) {
      return nodes
         .attr('cursor', 'pointer')
         .on('dblclick', d => this.showRawDataOf(d, context))
         &&
         nodes
            .append('a')
            .on('dblclick', d => this.showRawDataOf(d, context))
            .append('text')
            .attr('dx', 12)
            .attr('dy', '.35em')
            .text(d => GraphUtils.createDisplayText(d, context))
            .style('font-size', '12px')
            .attr('cursor', 'pointer');
   }

   private showRawDataOf(graphNode: GraphNode, context: GraphContext): void {
      const link = RawDataLinkFactory.createGraphNodeLink(graphNode, context);
      if (link) {
         this.router.navigateByUrl(link);
      }
   }

   private generateTooltip(graphNode: GraphNode, context: GraphContext): string {
      const series = graphNode['series'][0];
      let result = '<div class="div_tooltip">'
         + '<span class="tooltip_colored_box" style="background:' + series.color + ';margin-right:10px;"></span>';
      if (graphNode.parent) {
         result += graphNode.name + ': <b>' + GraphUtils.formattedValueOf(graphNode, context) + '</b>';
      } else {
         result += 'Root Node';
      }
      if (graphNode.info) {
         const entries = graphNode.info === '1' ? ' Entry' : ' Entries';
         result += ' (' + graphNode.info.toLocaleString() + entries + ')';
      }
      return result + '<br><br>Double-click to show data...</div>';
   }
}
