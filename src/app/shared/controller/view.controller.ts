import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ChartComponent } from 'app/chart/chart.component';
import { SummaryTableComponent } from 'app/summary-table/summary-table.component';
import { Subscription, lastValueFrom } from 'rxjs';
import { AbstractComponent } from '../component/abstract.component';
import { InputDialogData } from '../component/input-dialog/input-dialog.component';
import { ManageViewContext } from '../component/manage-view-dialog';
import { ViewLauncherContext } from '../component/view-launcher-dialog';
import { Column, DataType, ElementContext, ExportFormat, Query, Route, Scene, SummaryContext } from '../model';
import { ChartContext, ChartType } from '../model/chart';
import { GraphContext } from '../model/graph';
import { TabContent, TabDef, View, ViewElement } from '../model/view-config';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from '../services';
import { DBService } from '../services/backend';
import { CouchDBConstants } from '../services/backend/couchdb/couchdb-constants';
import { ChartMarginService } from '../services/chart';
import { ModelToViewConverter, ViewToModelConverter } from '../services/view-persistence';
import { queryDefToQuery } from '../services/view-persistence/filter/filter-to-query-converter';
import { TabContentProvider, ViewTabsService } from '../services/view-tabs';
import { ArrayUtils, CommonUtils, DateTimeUtils } from '../utils';

@Directive()
export abstract class ViewController extends AbstractComponent implements OnInit, AfterViewInit, OnDestroy, ViewLauncherContext,
   ManageViewContext, TabContentProvider {

   static readonly VIEW_NAME_MAX_LENGTH = 40;
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
   views: View[] = [];

   protected scene: Scene;
   protected currentViewName = '';

   private timeColumns: Column[];
   private viewToModelConverter: ViewToModelConverter;
   private modelToViewConverter = new ModelToViewConverter();
   private columns: Column[];
   private query: Query;
   private entriesSubscription: Subscription;
   private destroyed = false;

   constructor(public route: Route, private router: Router, bottomSheet: MatBottomSheet, private dbService: DBService,
      private dialogService: DialogService, private viewPersistenceService: ViewPersistenceService,
      private chartMarginService: ChartMarginService, notificationService: NotificationService, private exportService: ExportService,
      private viewTabsService: ViewTabsService) {
      super(bottomSheet, notificationService);
   }

   ngOnInit(): void {
      this.scene = this.dbService.getActiveScene();
      if (!this.scene) {
         this.router.navigateByUrl(Route.SCENES);
      } else {
         this.refreshViews();
         this.elementContexts = [];
         this.queryData(new Query());
         this.identifyColumns();
         if (this.tab) {
            if (this.tab.view) {
               this.applyView(this.tab.view);
            }
            this.viewTabsService.register(this.tab.id, this);
         }
      }
   }

   private refreshViews(): void {
      this.views = this.viewPersistenceService.findViews(this.scene, this.route);
   }

   ngAfterViewInit(): void {
      if (this.scene) {
         if (this.elementContainerDivRefs.length === 0) {
            this.selectView();
         } else {
            this.elementContainerDivRefs.changes.subscribe(() => {
               if (this.elementContainerDivRefs.last) {
                  const htmlDiv = this.elementContainerDivRefs.last.nativeElement;
                  htmlDiv.scrollIntoView();
               }
            });
         }
      }
   }

   ngOnDestroy(): void {
      this.destroyed = true;
      if (this.tab) {
         this.viewTabsService.unregister(this.tab.id, this);
      }
      this.entriesSubscription?.unsubscribe();
   }

   drop(event: CdkDragDrop<object>): void {
      moveItemInArray(this.elementContexts, event.previousIndex, event.currentIndex);
      this.requestPersist();
   }

   private identifyColumns(): void {
      this.columns = this.scene.columns
         .filter(c => c.indexed)
         .filter(c => c.name !== CouchDBConstants._ID);
      this.viewToModelConverter = new ViewToModelConverter(this.columns);
      this.timeColumns = this.columns
         .filter(c => c.dataType === DataType.TIME);
      DateTimeUtils.defineTimeUnits(this.timeColumns, this.entries);
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

   private addElementContext<T extends ElementContext>(context: T): T {
      context.query = this.query;
      context.entries = this.entries;
      this.observeChanges(context);
      this.elementContexts = this.elementContexts.concat([context]);
      this.configure(null, context);
      this.requestPersist();
      return context;
   }

   private observeChanges(context: ElementContext): void {
      context.subscribeToChanges(() => this.requestPersist());
   }

   private clonedColumns(): Column[] {
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
      this.entriesSubscription = this.dbService.findEntries(query, true).subscribe({
         next: (data) => {
            this.entries = data;
            this.elementContexts.forEach(c => c.entries = data);
         },
         error: (err) => this.notifyError(err),
         complete: () => this.loading = false
      });
   }

   isSummaryContext(context: ElementContext): boolean {
      return context instanceof SummaryContext;
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
      this.selectedContextPosition = this.elementContexts.indexOf(context) + 1;
      this.sidenav.mode = !event || event.clientX < ViewController.SIDENAV_WIDTH ? 'push' : 'over';
      this.sidenav.open();
   }

   /**
   * @param position starts at 1
   */
   changeElementPosition(position: number): void {
      ArrayUtils.move(this.elementContexts, this.selectedContextPosition - 1, position - 1);
      this.selectedContextPosition = position;
      this.elementContexts = this.elementContexts.slice(0);
      this.requestPersist();
   }

   removeElement(context: ElementContext): void {
      this.elementContexts = this.elementContexts.filter(c => c !== context);
      this.requestPersist();
   }

   onTitleChanged(context: ElementContext, title: string): void {
      context.title = title;
      this.requestPersist();
   }

   selectView(): void {
      this.dialogService.showViewLauncherDialog(this);
   }

   loadView(view: View): void {
      this.currentViewName = view.name;
      this.applyView(view);
   }

   protected applyView(view: View): void {
      const clonedView: View = CommonUtils.clone(view);
      this.onPreRestoreView(clonedView);
      if (clonedView.query) {
         this.restoredQuery = queryDefToQuery(clonedView.query);
         this.queryData(this.restoredQuery);
      }
      this.elementContexts = this.restoreElementContexts(clonedView.elements);
   }

   protected restoreElementContexts(elements: ViewElement[]): ElementContext[] {
      const elementContexts = this.viewToModelConverter.convert(elements);
      elementContexts.forEach(c => {
         c.query = this.query;
         c.entries = this.entries;
         this.observeChanges(c);
      });
      return elementContexts;
   }

   protected abstract onPreRestoreView(view: View): void;

   saveView(): void {
      if (this.elementContexts.length === 0) {
         this.notifyWarning('View contains no elements');
         return;
      }
      const dialogData = new InputDialogData('Save View', 'View Name', this.currentViewName, ViewController.VIEW_NAME_MAX_LENGTH);
      const dialogRef = this.dialogService.showInputDialog(dialogData);
      lastValueFrom(dialogRef.afterClosed())
         .then(() => {
            if (dialogData.closedWithOK) {
               this.currentViewName = dialogData.input;
               this.viewPersistenceService.saveView(this.scene, this.toView(dialogData.input))
                  .then(s => {
                     this.showStatus(s);
                     this.refreshViews();
                  });
            }
         });
   }

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

   printView(): void {
      window.print();
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

   manageViews(): void {
      this.dialogService.showManageViewDialog(this);
   }

   updateViews(deletedViews: View[], renamedViews: View[]): void {
      const status = this.viewPersistenceService.updateViews(this.scene, deletedViews, renamedViews);
      this.refreshViews();
      this.showStatus(status);
   }
}
