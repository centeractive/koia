import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { ExportDataProvider } from 'app/shared/controller';
import { GraphContext } from 'app/shared/model/graph';
import { GraphData, GraphDataService, RawDataRevealService } from 'app/shared/services';
import { CommonUtils } from 'app/shared/utils';
import { D3ForceGraphGenerator } from './d3js/d3-force-graph-generator';
import { GraphOptionsProvider } from './options/graph-options-provider';
import { NodeDoubleClickHandler } from './options/node-double-click-handler';

@Component({
    selector: 'koia-graph',
    templateUrl: './graph.component.html',
    styleUrls: ['./graph.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class GraphComponent implements OnInit, AfterViewInit, ExportDataProvider {

  static readonly MAX_NODES = 1_000;

  @Input() parentConstraintSize: boolean;
  @Input() context: GraphContext;

  @Output() onWarning = new EventEmitter<string>();

  graphOptions: object;
  title: string;
  graphData: GraphData;
  loading: boolean;
  svgContainerId = Date.now();

  private optionsProvider: GraphOptionsProvider;

  constructor(@Inject(ElementRef) private cmpElementRef: ElementRef, private graphDataService: GraphDataService,
    private rawDataRevealService: RawDataRevealService) {
    this.optionsProvider = new GraphOptionsProvider(new NodeDoubleClickHandler(rawDataRevealService));
  }

  ngOnInit(): void {
    this.context.subscribeToChanges(() => this.prepareGraphAsync());
    this.prepareGraphAsync()
  }

  ngAfterViewInit(): void {
    window.onresize = () => this.prepareGraphAsync();
  }

  private prepareGraphAsync(): void {
    Promise.resolve().then(() => this.prepareGraph());
  }

  private async prepareGraph(): Promise<void> {
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
    const div: HTMLDivElement = this.cmpElementRef.nativeElement.querySelector('#div_svg');
    new D3ForceGraphGenerator(this.context, this.rawDataRevealService)
      .generate(this.graphData, div, this.context);
  }

  /**
   * TODO: get rid of this - graph should automatically adapt to the resized element in the flex-view
   */
  private adjustCanvasContainerSize(): void {
    const chartContainer = this.cmpElementRef.nativeElement.parentElement;
    chartContainer.style.width = this.context.width + 'px';
    chartContainer.style.height = this.context.height + 'px';
  }

  createExportData(): object[] {
    throw new Error('Method not implemented.');
  }
}
