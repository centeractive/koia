import {
  Component, Input, Inject, ElementRef, OnInit, OnChanges, SimpleChanges, AfterViewInit,
  ViewEncapsulation, Output, EventEmitter, ViewChild
} from '@angular/core';
import { Observable } from 'rxjs';
import { ChangeEvent, GraphContext, Route } from '../shared/model';
import { GraphOptionsProvider } from './graph-options-provider';
import { CommonUtils } from 'app/shared/utils';
import { GraphDataService, RawDataRevealService } from 'app/shared/services';
import { Router } from '@angular/router';
import { DBService } from 'app/shared/services/backend';
import { ExportDataProvider } from 'app/shared/controller';
import { NvD3Component } from 'ng2-nvd3';

@Component({
  selector: 'retro-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css',
    '../../../node_modules/nvd3/build/nv.d3.css'],
  encapsulation: ViewEncapsulation.None
})
export class GraphComponent implements OnInit, OnChanges, AfterViewInit, ExportDataProvider {

  static readonly MAX_NODES = 1_000;

  @Input() parentConstraintSize: boolean;
  @Input() context: GraphContext;
  @Input() entries$: Observable<Object[]>;

  @ViewChild(NvD3Component, undefined) nvD3Component: NvD3Component;

  @Output() onWarning: EventEmitter<string> = new EventEmitter();

  graphOptions: Object;
  title: string;
  graphData: Object;
  loading: boolean;

  private optionsProvider: GraphOptionsProvider;

  constructor(@Inject(ElementRef) private cmpElementRef: ElementRef, private router: Router, private dbService: DBService,
    private graphDataService: GraphDataService, rawDataRevealService: RawDataRevealService) {
    this.optionsProvider = new GraphOptionsProvider(rawDataRevealService);
  }

  ngOnInit(): void {
    if (!this.dbService.getActiveScene()) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.context.subscribeToChanges((e: ChangeEvent) => this.contextChanged(e));
    }
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
    this.graphOptions = this.optionsProvider.createOptions(this.context,
      this.parentConstraintSize ? this.cmpElementRef.nativeElement.parentElement : null);
    if (changeEvent === ChangeEvent.STRUCTURE) {
      this.buildGraphData();
    }
    this.loading = false;
  }

  private buildGraphData(): void {
    const graphData = this.graphDataService.createData(this.context);
    if (graphData['nodes'].length > GraphComponent.MAX_NODES) {
      const msg = 'Graph: Maximum number of ' + GraphComponent.MAX_NODES + ' nodes exceeded.' +
        '\n\nPlease choose chart instead or apply/refine data filtering.'
      this.onWarning.emit(msg);
    } else {
      this.graphData = graphData;
    }
  }

  createExportData(): Object[] {
    throw new Error('Method not implemented.');
  }
}
