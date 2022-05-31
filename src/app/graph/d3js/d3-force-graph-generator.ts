import { GraphContext, GraphNode } from 'app/shared/model';
import { GraphData, RawDataRevealService } from 'app/shared/services';
import {
    select, forceSimulation, forceManyBody, forceCenter, forceLink,
    scaleOrdinal, schemeCategory10, drag, forceX, forceY
} from 'd3';
import { GraphUtils } from '../options/graph-utils';
import { NodeDoubleClickHandler } from '../options/node-double-click-handler';

export class D3ForceGraphGenerator {

    private nodeDoubleClickHandler: NodeDoubleClickHandler;

    constructor(private context: GraphContext, rawDataRevealService: RawDataRevealService) {
        this.nodeDoubleClickHandler = new NodeDoubleClickHandler(rawDataRevealService);
    }

    generate(graphData: GraphData, div: HTMLDivElement): void {
        div.replaceChildren();

        var tooltipDiv = select(div).append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        const svg = select(div).append('svg');
        const color = scaleOrdinal(schemeCategory10);

        const link = svg.append('g')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .selectAll('line')
            .data(graphData.links)
            .join('line');

        var node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(graphData.nodes)
            .enter().append('g')

        var circles = node.append('circle')
            .attr('r', 10)
            .style('fill', node => color('' + node.group))
            .style('cursor', 'pointer')
            .on('dblclick', (e: any, node) => this.nodeDoubleClickHandler.onNodeDoubleClicked(node, this.context))
            .on('mouseenter', (e: any, node) => mouseEnter(node))
            .on('mouseleave', () => mouseLeave())
            .call(drag()
                .on('start', (e: any, d: GraphNode) => dragstarted(e, d))
                .on('drag', (e: any, d: GraphNode) => dragged(e, d))
                .on('end', (e: any, d: GraphNode) => dragended(e, d)));

        const mouseEnter = (node: GraphNode) => {
            tooltipDiv.transition()
                .duration(200)
                .style('opacity', 1);
            // TODO: tooltip is partially hidden when node is close to the border of the svg    
            tooltipDiv.html(generateTooltip(node, this.context))
                .style('left', (node.x + 15) + 'px')
                .style('top', (node.y - 10) + 'px');
        };

        const mouseLeave = () => {
            tooltipDiv.transition()
                .duration(500)
                .style('opacity', 0);
        }

        var labels = node.append('text')
            .text(node => GraphUtils.createDisplayText(node, this.context))
            .attr('dx', 12)
            .attr('dy', '.35em')
            .style('font-size', '12px')
            .style('color', node => color('' + node.group));

        const simulation = forceSimulation(graphData.nodes)
            .force('link', forceLink(graphData.links).id(node => node.index)
                .distance(this.context.linkDist)
                .strength(this.context.linkStrength))
            .force('charge', forceManyBody().strength(this.context.charge))
            .force('center', forceCenter(div.clientWidth / 2, div.clientHeight / 2))
            .force('x', forceX(div.clientWidth / 2).strength(this.context.gravity))
            .force('y', forceY(div.clientHeight / 2).strength(this.context.gravity))
            .tick()
            .on('tick', () => {
                node.attr('transform', n => 'translate(' + n.x + ',' + n.y + ')');
                link
                    .attr('x1', l => l.source.x)
                    .attr('y1', l => l.source.y)
                    .attr('x2', l => l.target.x)
                    .attr('y2', l => l.target.y);
            });

        const dragstarted = (e: any, node: GraphNode) => {
            if (!e.active) {
                simulation.alphaTarget(0.3).restart();
            }
            node.fx = node.x;
            node.fy = node.y;
        }

        const dragged = (e: any, node: GraphNode) => {
            node.fx = e.x;
            node.fy = e.y;
        }

        const dragended = (e: any, node: GraphNode) => {
            if (!e.active) {
                simulation.alphaTarget(0);
            }
            node.fx = null;
            node.fy = null;
        }


        const generateTooltip = (graphNode: GraphNode, context: GraphContext): string => {
            let result = '<div class="div_tooltip">'
                + '<span class="tooltip_colored_box" style="background:' + color('' + graphNode.group) + ';margin-right:10px;"></span>';
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
}