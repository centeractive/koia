import { GraphContext, GraphNode } from 'app/shared/model';
import { GraphData, RawDataRevealService } from 'app/shared/services';
import {
    select, forceSimulation, forceManyBody, forceCenter, forceLink,
    scaleOrdinal, schemeCategory10, drag, SimulationNodeDatum, forceX, forceY
} from 'd3';
import { GraphOptionsProvider } from '../options/graph-options-provider';
import { GraphUtils } from '../options/graph-utils';
import { NodeDoubleClickHandler } from '../options/node-double-click-handler';

export class D3ForceGraphGenerator {

    private optionsProvider: GraphOptionsProvider;
    private nodeDoubleClickHandler: NodeDoubleClickHandler;

    constructor(private context: GraphContext, rawDataRevealService: RawDataRevealService) {
        this.nodeDoubleClickHandler = new NodeDoubleClickHandler(rawDataRevealService);
    }

    generate(graphData: GraphData, div: HTMLDivElement): void {
        div.replaceChildren();

        var tooltipDiv = select(div.parentElement).append('div')
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
            .style('fill', n => color('' + n.group))
            .style('cursor', 'pointer')
            .on('dblclick', e => this.nodeDoubleClickHandler.onNodeDoubleClicked(e.srcElement.__data__, this.context))
            .on('mouseenter', (e, d) => mouseEnter(e, d))
            .on('mouseleave', (e, d) => mouseLeave(d))
            .call(drag()
                .on('start', (e, d) => dragstarted(e, d))
                .on('drag', (e, d) => dragged(e, d))
                .on('end', (e, d) => dragended(e, d)));

        const mouseEnter = (e, d) => {
            tooltipDiv.transition()
                .duration(200)
                .style('opacity', 1);
            tooltipDiv.html(generateTooltip(e.srcElement.__data__, this.context))
                .style('left', (e.x + 10) + 'px')
                .style('top', (e.y - 100) + 'px');
        };

        const mouseLeave = (d) => {
            tooltipDiv.transition()
                .duration(500)
                .style('opacity', 0);
        }

        var labels = node.append('text')
            .text(n => GraphUtils.createDisplayText(n, this.context))
            .attr('dx', 12)
            .attr('dy', '.35em')
            .style('font-size', '12px')
            .style('color', n => color('' + n.group));

        node.append('title')
            .text(d => d.value);

        const simulation = forceSimulation(graphData.nodes)
            .force('link', forceLink(graphData.links).id(d => d.index)
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

        const dragstarted = (e: any, d: SimulationNodeDatum) => {
            if (!e.active) {
                simulation.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        }

        const dragged = (e: any, d: SimulationNodeDatum) => {
            d.fx = e.x;
            d.fy = e.y;
        }

        const dragended = (e: any, d: SimulationNodeDatum) => {
            if (!e.active) {
                simulation.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
        }


        const generateTooltip = (graphNode: GraphNode, context: GraphContext): string => {
            console.log('color' + color('' + graphNode.group))
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