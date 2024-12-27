import { CdkDragDrop, CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewInit, Directive, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
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
import { View } from '../model/view-config';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from '../services';
import { DBService } from '../services/backend';
import { CouchDBConstants } from '../services/backend/couchdb/couchdb-constants';
import { ChartMarginService } from '../services/chart';
import { ModelToViewConverter, ViewToModelConverter } from '../services/view-persistence';
import { queryDefToQuery } from '../services/view-persistence/filter/filter-to-query-converter';
import { ArrayUtils, CommonUtils, DateTimeUtils, StringUtils } from '../utils';

@Directive()
export abstract class ViewController extends AbstractComponent implements OnInit, AfterViewInit, ViewLauncherContext, ManageViewContext {

   static readonly MARGIN_TOP = 10;
   static readonly SIDENAV_WIDTH = 380; // keep in sync with .sidenav in styles.css
   static readonly ALL_EXPORT_FORMATS = Object.keys(ExportFormat).map(key => ExportFormat[key]);

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

   private timeColumns: Column[];
   private viewToModelConverter: ViewToModelConverter;
   private modelToViewConverter = new ModelToViewConverter();
   private columns: Column[];
   private query: Query;
   private entriesSubscription: Subscription;
   private currentViewName = '';

   constructor(public route: Route, private router: Router, bottomSheet: MatBottomSheet, private dbService: DBService,
      private dialogService: DialogService, private viewPersistenceService: ViewPersistenceService,
      private chartMarginService: ChartMarginService, notificationService: NotificationService, private exportService: ExportService) {
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

   drop(event: CdkDragDrop<object>): void {
      console.log('drop', event.previousIndex, event.currentIndex)
      moveItemInArray(this.elementContexts, event.previousIndex, event.currentIndex);
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
      const context = new SummaryContext(this.clonedColumns());
      context.query = this.query;
      context.entries = this.entries;
      this.elementContexts = this.elementContexts.concat([context]);
      this.configure(null, context);
      return context;
   }

   addChart(): ChartContext {
      const chartType = ChartType.BAR;
      const chartMargin = this.chartMarginService.marginOf(chartType);
      const context = new ChartContext(this.clonedColumns(), chartType.type, chartMargin);
      context.query = this.query;
      context.entries = this.entries;
      this.elementContexts = this.elementContexts.concat([context]);
      this.configure(null, context);
      return context;
   }

   addGraph(): GraphContext {
      const context = new GraphContext(this.clonedColumns());
      context.query = this.query;
      context.entries = this.entries;
      this.elementContexts = this.elementContexts.concat([context]);
      this.configure(null, context);
      return context;
   }

   private clonedColumns(): Column[] {
      return this.columns.map(c => <Column>CommonUtils.clone(c));
   }

   onFilterChanged(query: Query): void {
      this.elementContexts.forEach(c => c.query = query)
      this.queryData(query);
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
   }

   removeElement(context: ElementContext): void {
      this.elementContexts = this.elementContexts.filter(c => c !== context);
   }

   selectView(): void {
      this.dialogService.showViewLauncherDialog(this);
   }

   loadView(view: View): void {
      this.currentViewName = view.name;
      this.onPreRestoreView(view);
      const elementContexts = this.viewToModelConverter.convert(view.elements);
      if (view.query) {
         this.restoredQuery = queryDefToQuery(view.query);
         this.queryData(this.restoredQuery);
      }
      elementContexts.forEach(c => {
         c.query = this.query;
         c.entries = this.entries;
      });
      this.elementContexts = elementContexts;
   }

   protected abstract onPreRestoreView(view: View): void;

   saveView(): void {
      if (this.elementContexts.length === 0) {
         this.notifyWarning('View contains no elements');
         return;
      }
      const dialogData = new InputDialogData('Save View', 'View Name', this.currentViewName, 20);
      const dialogRef = this.dialogService.showInputDialog(dialogData);
      lastValueFrom(dialogRef.afterClosed())
         .then(() => {
            if (dialogData.closedWithOK) {
               this.currentViewName = dialogData.input;
               const view = this.modelToViewConverter.convert(this.route, dialogData.input, this.query, this.elementContexts);
               this.onPreSaveView(view);
               this.viewPersistenceService.saveView(this.scene, view)
                  .then(s => {
                     this.showStatus(s);
                     this.refreshViews();
                  });
            }
         });
   }

   protected abstract onPreSaveView(view: View): void;

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

   // TODO: move most of this code to the ViewPersistenceService
   updateViews(deletedViews: View[], renamedViews: View[]): void {
      const deltedViewNames = deletedViews.map(v => v.name);
      this.scene.config.views = this.scene.config.views.filter(v => !deltedViewNames.includes(v.name));
      this.refreshViews();
      this.dbService.persistScene(this.scene, false);
      this.notifyUpdatedViews(deletedViews, renamedViews);
   }

   private notifyUpdatedViews(deletedViews: View[], renamedViews: View[]): void {
      const message: string[] = [];
      if (deletedViews.length) {
         message.push('Deleted ' + deletedViews.length + StringUtils.pluralize(' view', deletedViews.length));
      }
      if (renamedViews.length) {
         message.push('Renamed ' + renamedViews.length + StringUtils.pluralize(' view', renamedViews.length));
      }
      this.notifySuccess(message.join('\n'));
   }
}
