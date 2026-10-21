import { GraphContext, GraphLink, GraphNode } from 'app/shared/model/graph';
import { GraphData, RawDataRevealService } from 'app/shared/services';
import { claimClick } from 'app/shared/ui/claimed-click';
import {
    D3DragEvent, Simulation, drag, forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, max,
    scaleSqrt, select
} from 'd3';
import { GraphUtils } from '../options/graph-utils';
import { NodeDoubleClickHandler } from '../options/node-double-click-handler';
import { graphTooltip } from './graph-tooltip';
import { linkEnds } from './link-ends';
import { tooltipPosition } from './tooltip-position';

const MIN_RADIUS = 4;
const MAX_RADIUS = 30;
const ROOT_RADIUS = 12;
const MIN_ALPHA = 0.01;
const MAX_ALPHA = 0.1;
// GraphContext#alpha keeps the d3 v3 scale where 0.1 was the initial alpha
const ALPHA_SCALE = 10;
// GraphContext#friction keeps the d3 v3 range, scaled so that the default friction 0.9 yields d3's default velocity decay 0.4
const VELOCITY_DECAY_SCALE = 4;

type NodeDragEvent = D3DragEvent<SVGGElement, GraphNode, GraphNode>;

export class D3ForceGraphGenerator {

    private rootColor = 'black';
    private nodeDoubleClickHandler: NodeDoubleClickHandler;
    private simulation: Simulation<GraphNode, GraphLink>;

    constructor(rawDataRevealService: RawDataRevealService) {
        this.nodeDoubleClickHandler = new NodeDoubleClickHandler(rawDataRevealService);
    }

    generate(graphData: GraphData, div: HTMLDivElement, context: GraphContext): void {
        this.stop();
        div.replaceChildren();
        const bgColors = context.colorProvider.bgColors(this.countDistinctGroups(graphData.nodes) - 1);
        const colorOf = (graphNode: GraphNode) => graphNode.parent ? bgColors[graphNode.group - 1] : this.rootColor;
        const radius = scaleSqrt().domain([0, Math.max(1, max(graphData.nodes, n => n.parent ? n.count : 0))]).range([MIN_RADIUS, MAX_RADIUS]);
        const radiusOf = (graphNode: GraphNode) => graphNode.parent ? radius(graphNode.count) : ROOT_RADIUS;

        const tooltipDiv = select(div).append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        const svg = select(div).append('svg');

        const link = svg.append('g')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .selectAll<SVGLineElement, GraphLink>('line')
            .data(graphData.links)
            .join('line');

        const node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll<SVGGElement, GraphNode>('g')
            .data(graphData.nodes)
            .join('g')
            .call(drag<SVGGElement, GraphNode, GraphNode>()
                .on('start', event => this.dragStarted(event))
                .on('drag', event => this.dragged(event))
                .on('end', event => this.dragEnded(event)))
            .on('click', (event: MouseEvent) => claimClick(event));

        node.append('circle')
            .attr('r', n => radiusOf(n))
            .style('fill', n => colorOf(n))
            .style('cursor', 'pointer')
            .on('dblclick', (_event: MouseEvent, n: GraphNode) => this.nodeDoubleClickHandler.onNodeDoubleClicked(n, context))
            .on('mouseenter', (_event: MouseEvent, n: GraphNode) => mouseEnter(n))
            .on('mouseleave', () => mouseLeave());

        const mouseEnter = (graphNode: GraphNode) => {
            tooltipDiv.transition()
                .duration(200)
                .style('opacity', 1);
            tooltipDiv.html(graphTooltip(graphNode, colorOf(graphNode), context));
            const tooltip = tooltipDiv.node().firstElementChild as HTMLElement;
            const position = tooltipPosition(graphNode.x, graphNode.y, radiusOf(graphNode),
                { width: tooltip.offsetWidth, height: tooltip.offsetHeight }, { width: div.clientWidth, height: div.clientHeight });
            tooltipDiv.style('left', position.left + 'px').style('top', position.top + 'px');
        };

        const mouseLeave = () => {
            tooltipDiv.transition()
                .duration(500)
                .style('opacity', 0);
        }

        node.append('text')
            .text(n => GraphUtils.createDisplayText(n, context))
            .attr('dx', n => radiusOf(n) + 3)
            .attr('dy', '.35em')
            .style('font-size', '12px');

        this.simulation = forceSimulation<GraphNode, GraphLink>(graphData.nodes)
            .force('link', forceLink<GraphNode, GraphLink>(graphData.links).id(n => n.index)
                .distance(context.linkDist)
                .strength(context.linkStrength))
            .force('charge', forceManyBody().strength(context.charge).theta(context.theta))
            .force('center', forceCenter(div.clientWidth / 2, div.clientHeight / 2))
            .force('x', forceX(div.clientWidth / 2).strength(context.gravity))
            .force('y', forceY(div.clientHeight / 2).strength(context.gravity))
            .force('collide', forceCollide<GraphNode>(n => radiusOf(n) + 2))
            .alpha(Math.min(Math.max(context.alpha, MIN_ALPHA), MAX_ALPHA) * ALPHA_SCALE)
            .velocityDecay(Math.min((1 - context.friction) * VELOCITY_DECAY_SCALE, 1))
            .on('tick', () => {
                node.attr('transform', n => 'translate(' + n.x + ',' + n.y + ')');
                link.each((l, i, lines) => {
                    const ends = linkEnds(l.source, l.target, radiusOf(l.source), radiusOf(l.target));
                    select(lines[i]).attr('x1', ends.x1).attr('y1', ends.y1).attr('x2', ends.x2).attr('y2', ends.y2);
                });
            });
    }

    stop(): void {
        this.simulation?.stop();
    }

    private dragStarted(event: NodeDragEvent): void {
        this.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    private dragged(event: NodeDragEvent): void {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    private dragEnded(event: NodeDragEvent): void {
        this.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    private countDistinctGroups(nodes: GraphNode[]): number {
        return new Set<number>(nodes.map(n => n.group)).size;
    }
}
