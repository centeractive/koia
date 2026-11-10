import {
  ChangeDetectionStrategy,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { ExportDataProvider } from 'app/shared/controller';
import { GraphContext } from 'app/shared/model/graph';
import { GraphData, GraphDataService, RawDataRevealService } from 'app/shared/services';
import { LanguageService } from 'app/shared/services/language';
import { isRendered } from 'app/shared/ui/rendered';
import { CommonUtils } from 'app/shared/utils';
import { Subscription } from 'rxjs';
import { D3ForceGraphGenerator } from './d3js/d3-force-graph-generator';

@Component({
  selector: 'koia-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class GraphComponent implements OnInit, DoCheck, OnDestroy, ExportDataProvider {

  static readonly MAX_NODES = 1_000;

  @Input() context: GraphContext;

  @Output() onWarning = new EventEmitter<string>();

  title: string;
  graphData: GraphData;
  loading: boolean;

  private graphGenerator: D3ForceGraphGenerator;
  private contextSubscription: Subscription;
  private languageSubscription: Subscription;
  private destroyed = false;
  private outdated = false;
  private resizePending = false;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, private graphDataService: GraphDataService,
    rawDataRevealService: RawDataRevealService, private languageService: LanguageService, private zone: NgZone) {
    this.graphGenerator = new D3ForceGraphGenerator(rawDataRevealService);
  }

  ngOnInit(): void {
    this.contextSubscription = this.context.subscribeToChanges(() => this.prepareGraphAsync());
    this.languageSubscription = this.languageService.changed$.subscribe(() => this.onLanguageChanged());
    this.prepareGraphAsync()
  }

  /**
   * rebuilds the graph data too, since GraphDataService formats the node counts in the current language
   */
  private onLanguageChanged(): void {
    if (this.graphData) {
      this.prepareGraphAsync();
    }
  }

  ngDoCheck(): void {
    if (this.outdated && isRendered(this.svgDiv())) {
      this.outdated = false;
      this.prepareGraphAsync();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.resizePending) {
      this.resizePending = true;
      this.prepareGraphAsync();
    }
  }

  private prepareGraphAsync(): void {
    Promise.resolve().then(() => this.prepareGraph());
  }

  private async prepareGraph(): Promise<void> {
    this.loading = true;
    await CommonUtils.sleep(100); // releases UI thread for showing new title and progress bar
    this.resizePending = false;
    if (!this.destroyed) {
      if (isRendered(this.svgDiv())) {
        this.buildGraphData();
      } else {
        this.outdated = true;
      }
    }
    this.loading = false;
  }

  private buildGraphData(): void {
    const graphData = this.graphDataService.createData(this.context);
    if (graphData['nodes'].length > GraphComponent.MAX_NODES) {
      const max = GraphComponent.MAX_NODES.toLocaleString(LanguageService.numberLocaleId());
      this.onWarning.emit(LanguageService.instant('graph.maxNodesExceeded', { max }));
    } else {
      this.graphData = graphData;
      this.generateGraph();
    }
  }

  private generateGraph(): void {
    const nodes = this.graphData.nodes;
    nodes.forEach((n, i) => n.index = i);
    this.zone.runOutsideAngular(() => this.graphGenerator.generate(this.graphData, this.svgDiv(), this.context));
  }

  private svgDiv(): HTMLDivElement {
    return this.cmpElementRef.nativeElement.querySelector('.div_svg');
  }

  createExportData(): object[] {
    throw new Error('Method not implemented.');
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.contextSubscription.unsubscribe();
    this.languageSubscription.unsubscribe();
    this.graphGenerator.stop();
  }
}
