import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { ExportDataProvider } from 'app/shared/controller';
import { GraphContext } from 'app/shared/model/graph';
import { GraphData, GraphDataService, RawDataRevealService } from 'app/shared/services';
import { LanguageService } from 'app/shared/services/language';
import { CommonUtils } from 'app/shared/utils';
import { D3ForceGraphGenerator } from './d3js/d3-force-graph-generator';

@Component({
  selector: 'koia-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class GraphComponent implements OnInit, OnDestroy, ExportDataProvider {

  static readonly MAX_NODES = 1_000;

  @Input() context: GraphContext;

  @Output() onWarning = new EventEmitter<string>();

  title: string;
  graphData: GraphData;
  loading: boolean;

  private graphGenerator: D3ForceGraphGenerator;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, private graphDataService: GraphDataService,
    rawDataRevealService: RawDataRevealService) {
    this.graphGenerator = new D3ForceGraphGenerator(rawDataRevealService);
  }

  ngOnInit(): void {
    this.context.subscribeToChanges(() => this.prepareGraphAsync());
    this.prepareGraphAsync()
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.prepareGraphAsync();
  }

  private prepareGraphAsync(): void {
    Promise.resolve().then(() => this.prepareGraph());
  }

  private async prepareGraph(): Promise<void> {
    this.loading = true;
    await CommonUtils.sleep(100); // releases UI thread for showing new title and progress bar
    this.buildGraphData();
    this.loading = false;
  }

  private buildGraphData(): void {
    const graphData = this.graphDataService.createData(this.context);
    if (graphData['nodes'].length > GraphComponent.MAX_NODES) {
      const max = GraphComponent.MAX_NODES.toLocaleString(LanguageService.localeId());
      this.onWarning.emit(LanguageService.instant('graph.maxNodesExceeded', { max }));
    } else {
      this.graphData = graphData;
      this.generateGraph();
    }
  }

  private generateGraph(): void {
    const nodes = this.graphData.nodes;
    nodes.forEach((n, i) => n.index = i);
    const div: HTMLDivElement = this.cmpElementRef.nativeElement.querySelector('.div_svg');
    this.graphGenerator.generate(this.graphData, div, this.context);
  }

  createExportData(): object[] {
    throw new Error('Method not implemented.');
  }

  ngOnDestroy(): void {
    this.graphGenerator.stop();
  }
}
