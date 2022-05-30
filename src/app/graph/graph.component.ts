import {
  Component, Input, Inject, ElementRef, OnInit, OnChanges, SimpleChanges, AfterViewInit,
  ViewEncapsulation, Output, EventEmitter
} from '@angular/core';
import { Observable } from 'rxjs';
import { ChangeEvent, GraphContext, GraphNode } from '../shared/model';
import { GraphOptionsProvider } from './options/graph-options-provider';
import { CommonUtils } from 'app/shared/utils';
import { GraphData, GraphDataService, RawDataRevealService } from 'app/shared/services';
import { ExportDataProvider } from 'app/shared/controller';
import { NodeDoubleClickHandler } from './options/node-double-click-handler';
import { select, forceSimulation, forceManyBody, forceCenter, forceLink, scaleOrdinal, schemeCategory10, forceX, forceY, ticks, drag, SimulationNodeDatum } from 'd3';
import { GraphUtils } from './options/graph-utils';

@Component({
  selector: 'koia-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GraphComponent implements OnInit, OnChanges, AfterViewInit, ExportDataProvider {

  static readonly MAX_NODES = 1_000;

  @Input() parentConstraintSize: boolean;
  @Input() context: GraphContext;
  @Input() entries$: Observable<Object[]>;

  @Output() onWarning: EventEmitter<string> = new EventEmitter();

  graphOptions: Object;
  title: string;
  graphData: GraphData;
  loading: boolean;

  private optionsProvider: GraphOptionsProvider;
  private nodeDoubleClickHandler: NodeDoubleClickHandler;

  constructor(@Inject(ElementRef) private cmpElementRef: ElementRef, private graphDataService: GraphDataService,
    rawDataRevealService: RawDataRevealService) {
    this.optionsProvider = new GraphOptionsProvider(new NodeDoubleClickHandler(rawDataRevealService));
    this.nodeDoubleClickHandler = new NodeDoubleClickHandler(rawDataRevealService);
  }

  ngOnInit(): void {
    this.context.subscribeToChanges((e: ChangeEvent) => this.contextChanged(e));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries$']) {
      this.fetchEntries();
    }
  }

  ngAfterViewInit() {
    window.onresize = () => this.updateGraphSize();
  }

  private contextChanged(changeEvent: ChangeEvent): void {
    this.prepareGraphAsync(changeEvent);
  }

  private fetchEntries(): void {
    this.entries$.toPromise().then(entries => this.onEntries(entries));
  }

  private onEntries(entries: Object[]): void {
    this.context.entries = entries;
  }

  private updateGraphSize() {
    this.prepareGraphAsync(ChangeEvent.SIZE);
  }

  private prepareGraphAsync(changeEvent: ChangeEvent): void {
    Promise.resolve().then(() => this.prepareGraph(changeEvent));
  }

  private async prepareGraph(changeEvent: ChangeEvent): Promise<void> {
    this.loading = true;
    await CommonUtils.sleep(100); // releases UI thread for showing new title and progress bar
    const parentDiv: HTMLDivElement = this.parentConstraintSize ? this.cmpElementRef.nativeElement.parentElement : null;
    this.graphOptions = this.optionsProvider.createOptions(this.context, parentDiv);
    this.buildGraphData();
    this.loading = false;
  }

  private buildGraphData(): void {
    const graphData = this.graphDataService.createData(this.context);
    if (graphData['nodes'].length > GraphComponent.MAX_NODES) {
      const msg = 'Graph: Maximum number of ' + GraphComponent.MAX_NODES.toLocaleString() + ' nodes exceeded.' +
        '\n\nPlease choose chart instead or apply/refine data filtering.'
      this.onWarning.emit(msg);
    } else {
      this.graphData = graphData;
      this.generateGraph();
    }
  }

  private generateGraph(): void {
    if (!this.parentConstraintSize) {
      this.adjustCanvasContainerSize();
    }

    const nodes = this.graphData.nodes;
    nodes.forEach((n, i) => n.index = i);

    const div: HTMLDivElement = document.querySelector('#div_svg');
    div.replaceChildren();

    const svg = select('#div_svg').append('svg');

    const color = scaleOrdinal(schemeCategory10);

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(this.graphData.links)
      .join('line');

    var node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')

    var circles = node.append('circle')
      .attr('r', 10)
      .style('fill', n => color('' + n.group))
      .style('cursor', 'pointer')
      .on('dblclick', e => this.nodeDoubleClickHandler.onNodeDoubleClicked(e.srcElement.__data__, this.context))
      .call(drag()
        .on('start', (e, d) => dragstarted(e, d))
        .on('drag', (e, d) => dragged(e, d))
        .on('end', (e, d) => dragended(e, d)));

    var labels = node.append('text')
      .text(n => GraphUtils.createDisplayText(n, this.context))
      .attr('x', 12)
      .attr('y', 3)
      .style('font-size', '12px')
      .style('color', n => color('' + n.group));

    node.append('title')
      .text(d => d.value);

    const simulation = forceSimulation(nodes)
      .force('link', forceLink(this.graphData.links).id(d => d['id'])
        .distance(this.context.linkDist)
        .strength(this.context.linkStrength))
      .force('charge', forceManyBody().strength(this.context.charge))
      .force('center', forceCenter(div.clientWidth / 2, div.clientHeight / 2))
      .tick(1000)
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
  }


  /**
   * TODO: get rid of this - graph should automatically adapt to the resized element in the flex-view
   */
  private adjustCanvasContainerSize(): void {
    const chartContainer = this.cmpElementRef.nativeElement.parentElement;
    chartContainer.style.width = this.context.width + 'px';
    chartContainer.style.height = this.context.height + 'px';
  }

  createExportData(): Object[] {
    throw new Error('Method not implemented.');
  }
}
