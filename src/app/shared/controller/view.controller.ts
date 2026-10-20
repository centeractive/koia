import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ChartComponent } from 'app/chart/chart.component';
import { SummaryTableComponent } from 'app/summary-table/summary-table.component';
import { Subscription } from 'rxjs';
import { AbstractComponent } from '../component/abstract.component';
import { ViewLauncherContext } from '../component/view-launcher-dialog';
import { Column, DataType, ElementContext, ExportFormat, Query, Route, Scene, SummaryContext, TextBoxContext } from '../model';
import { ChartContext, ChartType } from '../model/chart';
import { GraphContext } from '../model/graph';
import { TabContent, TabDef, View, ViewElement } from '../model/view-config';
import { DialogService, ExportService, NotificationService } from '../services';
import { DBService } from '../services/backend';
import { CouchDBConstants } from '../services/backend/couchdb/couchdb-constants';
import { ChartMarginService } from '../services/chart';
import { ComputedColumnChange, ComputedColumnService } from '../services/computed-column.service';
import { ModelToViewConverter, ViewToModelConverter } from '../services/view-persistence';
import { queryDefToQuery } from '../services/view-persistence/filter/filter-to-query-converter';
import { TabContentProvider, ViewTabsService } from '../services/view-tabs';
import { ArrayUtils, CommonUtils, DateTimeUtils } from '../utils';
import { isAnalyzableColumn } from '../utils/column-utils';
import { withComputedValues } from '../utils/computation-utils';

@Directive()
export abstract class ViewController extends AbstractComponent implements OnInit, AfterViewInit, OnDestroy, ViewLauncherContext,
   TabContentProvider {

   static readonly MARGIN_TOP = 10;
   static readonly SIDENAV_WIDTH = 380; // keep in sync with .sidenav in styles.css
   static readonly ALL_EXPORT_FORMATS = Object.keys(ExportFormat).map(key => ExportFormat[key]);

   @Input() tab: TabDef;

   @ViewChild(MatSidenav) sidenav: MatSidenav;
   @ViewChild('content') divContentRef: ElementRef<HTMLDivElement>;
   @ViewChildren('elementContainer') elementContainerDivRefs: QueryList<ElementRef<HTMLDivElement>>;
   @ViewChildren(ChartComponent) chartComponents: QueryList<ChartComponent>;
   @ViewChildren(SummaryTableComponent) sumTableComponents: QueryList<SummaryTableComponent>;
   @ViewChildren('but_configure') configButtonsRefs: QueryList<ElementRef<HTMLButtonElement>>;

   elementContexts: ElementContext[];
   selectedContext: ElementContext;
   selectedContextPosition: number;
   entries: object[];
   loading: boolean;
   restoredQuery: Query;

   protected scene: Scene;

   private timeColumns: Column[];
   private viewToModelConverter: ViewToModelConverter;
   private modelToViewConverter = new ModelToViewConverter();
   private columns: Column[];
   private query: Query;
   private entriesSubscription: Subscription;
   private computedColumnsSubscription: Subscription;
   private destroyed = false;
   private scrollToAddedElement = false;

   constructor(public route: Route, private router: Router, bottomSheet: MatBottomSheet, private dbService: DBService,
      protected dialogService: DialogService, private chartMarginService: ChartMarginService, notificationService: NotificationService, private exportService: ExportService,
      private viewTabsService: ViewTabsService, private computedColumnService: ComputedColumnService) {
      super(bottomSheet, notificationService);
   }

   ngOnInit(): void {
      this.scene = this.dbService.getActiveScene();
      if (!this.scene) {
         this.router.navigateByUrl(Route.SCENES);
      } else {
         this.elementContexts = [];
         this.identifyColumns();
         this.queryData(new Query());
         if (this.tab) {
            if (this.tab.view) {
               this.applyView(this.tab.view);
            }
            this.viewTabsService.register(this.tab.id, this);
         }
         this.computedColumnsSubscription = this.computedColumnService.changed$.subscribe(c => this.onComputedColumnsChanged(c));
      }
   }

   ngAfterViewInit(): void {
      if (this.scene) {
         if (this.elementContainerDivRefs.length === 0) {
            this.selectView();
         }
         this.elementContainerDivRefs.changes.subscribe(() => {
            if (this.scrollToAddedElement) {
               this.scrollToAddedElement = false;
               this.elementContainerDivRefs.last.nativeElement.scrollIntoView({ block: 'end' });
            }
         });
      }
   }

   ngOnDestroy(): void {
      this.destroyed = true;
      if (this.tab) {
         this.viewTabsService.unregister(this.tab.id, this);
      }
      this.entriesSubscription?.unsubscribe();
      this.computedColumnsSubscription?.unsubscribe();
   }

   /**
    * the indexes of the event count the tiles only, overlays are not part of the drop list
    */
   drop(event: CdkDragDrop<object>): void {
      moveItemInArray(this.elementContexts, this.contextIndexOfTile(event.previousIndex), this.contextIndexOfTile(event.currentIndex));
      this.requestPersist();
   }

   private identifyColumns(): void {
      this.columns = this.scene.columns
         .filter(isAnalyzableColumn)
         .filter(c => c.name !== CouchDBConstants._ID)
         .map(c => <Column>CommonUtils.clone(c));
      this.viewToModelConverter = new ViewToModelConverter(this.columns);
      this.timeColumns = this.columns
         .filter(c => c.dataType === DataType.TIME);
   }

   private onComputedColumnsChanged(change: ComputedColumnChange): void {
      this.identifyColumns();
      if (this.entries) {
         withComputedValues(this.entries, this.columns);
      }
      const renamedFrom = new Map<string, string>();
      if (change.name !== undefined && change.name !== change.previousName) {
         renamedFrom.set(change.name, change.previousName);
      }
      this.elementContexts.forEach(c => c.updateColumns(this.clonedColumns(), renamedFrom));
      this.requestPersist();
   }

   addSummaryTable(): SummaryContext {
      return this.addElementContext(new SummaryContext(this.clonedColumns()));
   }

   addChart(): ChartContext {
      const chartType = ChartType.BAR;
      const chartMargin = this.chartMarginService.marginOf(chartType);
      return this.addElementContext(new ChartContext(this.clonedColumns(), chartType.type, chartMargin));
   }

   addGraph(): GraphContext {
      return this.addElementContext(new GraphContext(this.clonedColumns()));
   }

   addTextTile(): TextBoxContext {
      const textTile = new TextBoxContext(this.clonedColumns(), true);
      textTile.bordered = true;
      return this.addTextBox(textTile);
   }

   addNote(): TextBoxContext {
      const note = new TextBoxContext(this.clonedColumns());
      note.backgroundColor = TextBoxContext.NOTE_BACKGROUND_COLOR;
      return this.addTextBox(note);
   }

   private addTextBox(textBox: TextBoxContext): TextBoxContext {
      textBox.editRequested = true;
      return this.addElementContext(textBox);
   }

   abstract generateDashboard(): void;

   canGenerateDashboard(): boolean {
      return !this.loading && this.entries?.length > 0;
   }

   private addElementContext<T extends ElementContext>(context: T): T {
      context.query = this.query;
      context.entries = this.entries;
      this.observeChanges(context);
      this.scrollToAddedElement = !context.isOverlay();
      this.elementContexts = this.elementContexts.concat([context]);
      this.onElementContextAdded(context);
      if (context.isConfigurable()) {
         this.configure(null, context);
      }
      this.requestPersist();
      return context;
   }

   private observeChanges(context: ElementContext): void {
      context.subscribeToChanges(() => this.requestPersist());
   }

   protected clonedColumns(): Column[] {
      return this.columns.map(c => <Column>CommonUtils.clone(c));
   }

   onFilterChanged(query: Query): void {
      this.elementContexts.forEach(c => c.query = query)
      this.queryData(query);
      this.requestPersist();
   }

   private queryData(query: Query): void {
      this.loading = true;
      this.query = query;
      if (this.entriesSubscription) {
         this.entriesSubscription.unsubscribe();
      }
      this.entriesSubscription = this.dbService.findEntriesWithComputedValues(query, true).subscribe({
         next: (data) => {
            this.entries = data;
            DateTimeUtils.defineTimeUnits(this.timeColumns, data);
            this.elementContexts.forEach(c => c.entries = data);
         },
         error: (err) => {
            this.loading = false;
            this.notifyError(err);
         },
         complete: () => this.loading = false
      });
   }

   isSummaryContext(context: ElementContext): boolean {
      return context instanceof SummaryContext;
   }

   isTextBoxContext(context: ElementContext): boolean {
      return context instanceof TextBoxContext;
   }

   isShowResizableMargin(context: ElementContext): boolean {
      return this.isChartContext(context) && this.asChartContext(context).isShowResizableMargin();
   }

   isChartContext(context: ElementContext): boolean {
      return context instanceof ChartContext;
   }

   asChartContext(context: ElementContext): ChartContext {
      return context as ChartContext;
   }

   isGraphContext(context: ElementContext): boolean {
      return context instanceof GraphContext;
   }

   configure(event: MouseEvent, context: ElementContext): void {
      this.selectedContext = context;
      this.selectedContextPosition = this.tiles().indexOf(context) + 1;
      this.sidenav.mode = !event || event.clientX < ViewController.SIDENAV_WIDTH ? 'push' : 'over';
      this.sidenav.open();
   }

   /**
   * @param position position among the tiles, starts at 1
   */
   changeElementPosition(position: number): void {
      ArrayUtils.move(this.elementContexts, this.contextIndexOfTile(this.selectedContextPosition - 1), this.contextIndexOfTile(position - 1));
      this.selectedContextPosition = position;
      this.elementContexts = this.elementContexts.slice(0);
      this.requestPersist();
   }

   removeElement(context: ElementContext): void {
      this.elementContexts = this.elementContexts.filter(c => c !== context);
      this.textBoxesAnchoredTo(context).forEach(c => c.clearAnchor());
      this.requestPersist();
   }

   protected textBoxesAnchoredTo(context: ElementContext): TextBoxContext[] {
      return this.elementContexts.filter(c => c instanceof TextBoxContext && c.anchor === context) as TextBoxContext[];
   }

   /**
    * @returns the number of elements taking a tile of their own, i.e. no overlays
    */
   tileCount(): number {
      return this.tiles().length;
   }

   private tiles(): ElementContext[] {
      return this.elementContexts.filter(c => !c.isOverlay());
   }

   private contextIndexOfTile(tileIndex: number): number {
      return this.elementContexts.indexOf(this.tiles()[tileIndex]);
   }

   onTitleChanged(context: ElementContext, title: string): void {
      context.title = title;
      this.requestPersist();
   }

   selectView(): void {
      this.dialogService.showViewLauncherDialog(this);
   }

   applyView(view: View): void {
      const clonedView: View = CommonUtils.clone(view);
      this.onPreRestoreView(clonedView);
      if (clonedView.query) {
         this.restoredQuery = queryDefToQuery(clonedView.query);
         this.queryData(this.restoredQuery);
      }
      this.elementContexts = this.restoreElementContexts(clonedView.elements);
   }

   protected restoreElementContexts(elements: ViewElement[]): ElementContext[] {
      return this.bindElementContexts(this.viewToModelConverter.convert(elements));
   }

   protected bindElementContexts<T extends ElementContext>(contexts: T[]): T[] {
      contexts.forEach(c => {
         c.query = this.query;
         c.entries = this.entries;
         this.observeChanges(c);
      });
      return contexts;
   }

   protected abstract onPreRestoreView(view: View): void;

   protected abstract onElementContextAdded(context: ElementContext): void;

   protected toView(name: string): View {
      const view = this.modelToViewConverter.convert(this.route, name, this.query, this.elementContexts);
      this.onPreSaveView(view);
      return view;
   }

   protected abstract onPreSaveView(view: View): void;

   tabContent(): TabContent {
      return { view: { ...this.toView(this.tab.title), modifiedTime: 0 } };
   }

   layout(): Route {
      return this.route;
   }

   protected requestPersist(): void {
      if (this.tab && !this.destroyed) {
         this.viewTabsService.requestPersist();
      }
   }

   saveAs(context: ElementContext, exportFormat: ExportFormat): void {
      if (this.isChartContext(context)) {
         const base64Image = this.asChartContext(context).chart.toBase64Image();
         this.exportService.exportImage(base64Image, exportFormat, context.getTitle());
      } else if (this.isSummaryContext(context)) {
         const sumTableComponent = this.sumTableComponents.find(cmp => cmp.context === context);
         this.exportService.exportData(sumTableComponent.createExportData(), this.columns, exportFormat, context.getTitle());
      }
   }
}
