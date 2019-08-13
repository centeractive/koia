import {
   ElementContext, Column, Query, SummaryContext, ChartContext, GraphContext, ChartType, Route, Scene,
   DataType, ExportFormat
} from '../model';
import { Observable, Subscription } from 'rxjs';
import { DateTimeUtils, ArrayUtils, CommonUtils } from '../utils';
import { ViewChild, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit } from '@angular/core';
import { MatSidenav, MatBottomSheet } from '@angular/material';
import { NotificationService, ChartMarginService, ViewPersistenceService, ExportService, DialogService } from '../services';
import { Router } from '@angular/router';
import { DBService } from '../services/backend';
import { CouchDBConstants } from '../services/backend/couchdb/couchdb-constants';
import { SummaryTableComponent } from 'app/summary-table/summary-table.component';
import { AbstractComponent } from '../component/abstract.component';
import { ChartComponent } from 'app/chart/chart.component';
import { ConfigToModelConverter, ModelToConfigConverter } from '../services/view-persistence';
import { View } from '../model/view-config';
import { InputDialogData } from '../component/input-dialog/input-dialog.component';

export abstract class ViewController extends AbstractComponent implements OnInit, AfterViewInit {

   static readonly MARGIN_TOP = 10;
   static readonly SIDENAV_WIDTH = 300; // keep in sync with .sidenav in styles.css
   static readonly ALL_EXPORT_FORMATS = Object.keys(ExportFormat).map(key => ExportFormat[key]);

   @ViewChild(MatSidenav, undefined) sidenav: MatSidenav;
   @ViewChild('header', undefined) divHeaderRef: ElementRef<HTMLDivElement>;
   @ViewChild('content', undefined) divContentRef: ElementRef<HTMLDivElement>;
   @ViewChildren('elementContainer') elementContainerDivRefs: QueryList<ElementRef<HTMLDivElement>>;
   @ViewChildren(ChartComponent) chartComponents: QueryList<ChartComponent>;
   @ViewChildren(SummaryTableComponent) sumTableComponents: QueryList<SummaryTableComponent>;
   @ViewChildren('but_configure') configButtonsRefs: QueryList<ElementRef<HTMLButtonElement>>;

   elementContexts: ElementContext[];
   selectedContext: ElementContext;
   selectedContextPosition: number;
   entries$: Observable<Object[]>;
   loading: boolean;

   private textColumns: Column[];
   private numberColumns: Column[];
   private timeColumns: Column[];
   private configToModelConverter: ConfigToModelConverter;
   private modelToConfigConverter = new ModelToConfigConverter();
   private query: Query;
   private scene: Scene;
   private columns: Column[];
   private entriesSubscription: Subscription;

   constructor(public route: Route, private router: Router, bottomSheet: MatBottomSheet, private dbService: DBService,
      private dialogService: DialogService, private viewPersistenceService: ViewPersistenceService,
      private chartMarginService: ChartMarginService, notificationService: NotificationService, private exportService: ExportService) {
      super(bottomSheet, notificationService);
   };

   ngOnInit(): void {
      this.scene = this.dbService.getActiveScene();
      if (!this.scene) {
         this.router.navigateByUrl(Route.SCENES);
      } else {
         this.elementContexts = [];
         this.query = new Query();
         this.queryData(this.query);
         this.identifyColumns();
      }
   }

   ngAfterViewInit(): void {
      this.elementContainerDivRefs.changes.subscribe(c => {
         if (this.elementContainerDivRefs.last) {
            const htmlDiv = this.elementContainerDivRefs.last.nativeElement;
            htmlDiv.scrollIntoView();
         }
      });
   }

   private identifyColumns(): void {
      this.columns = this.scene.columns
         .filter(c => c.indexed)
         .filter(c => c.name !== CouchDBConstants._ID);
      this.configToModelConverter = new ConfigToModelConverter(this.columns);
      this.textColumns = this.columns
         .filter(c => c.dataType === DataType.TEXT);
      this.numberColumns = this.columns
         .filter(c => c.dataType === DataType.NUMBER);
      this.timeColumns = this.columns
         .filter(c => c.dataType === DataType.TIME);
      this.entriesSubscription = this.entries$.subscribe(entries => DateTimeUtils.defineTimeUnits(this.timeColumns, entries));
   }

   addSummaryTable(): SummaryContext {
      const context = new SummaryContext(this.clonedColumns());
      context.query = this.query;
      this.elementContexts = this.elementContexts.concat([context]);
      this.configure(null, context);
      return context;
   }

   addChart(): ChartContext {
      const chartType = ChartType.BAR;
      const chartMargin = this.chartMarginService.marginOf(chartType);
      const context = new ChartContext(this.clonedColumns(), chartType.type, chartMargin);
      context.groupByColumns = [this.identifyXAxisColumn(context)];
      context.query = this.query;
      this.elementContexts = this.elementContexts.concat([context]);
      this.configure(null, context);
      return context;
   }

   private identifyXAxisColumn(context: ChartContext): Column {
      let xAxisColumn: Column;
      if (this.timeColumns.length > 0) {
         xAxisColumn = this.timeColumns[0];
      } else if (this.numberColumns.length > 0) {
         xAxisColumn = this.numberColumns[0];
      } else if (this.textColumns.length > 0) {
         xAxisColumn = this.textColumns[0];
      } else {
         return context.columns[0];
      }
      return context.columns.find(c => c.name === xAxisColumn.name);
   }

   addGraph(): GraphContext {
      const context = new GraphContext(this.clonedColumns());
      context.query = this.query;
      this.elementContexts = this.elementContexts.concat([context]);
      this.configure(null, context);
      return context;
   }

   private clonedColumns(): Column[] {
      return this.columns.map(c => <Column>CommonUtils.clone(c));
   }

   onFilterChanged(query: Query): void {
      this.query = query;
      this.elementContexts.forEach(c => c.query = query)
      this.queryData(query);
   }

   private queryData(query: Query): void {
      this.loading = true;
      if (this.entriesSubscription) {
         this.entriesSubscription.unsubscribe();
      }
      this.entries$ = this.dbService.findEntries(query, true);
      this.entries$.toPromise()
         .then(d => this.loading = false)
         .catch(err => {
            this.loading = false;
            this.notifyError(err);
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
      return <ChartContext>context;
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

   findViews(): View[] {
      return this.viewPersistenceService.findViews(this.scene, this.route);
   }

   loadView(view: View): void {
      this.onPreRestoreView(view);
      const elementContexts = this.configToModelConverter.convert(view.elements);
      elementContexts.forEach(c => c.query = this.query);
      this.elementContexts = elementContexts;
   }

   protected abstract onPreRestoreView(view: View): void;

   saveView(): void {
      if (this.elementContexts.length === 0) {
         this.notifyWarning('View contains no elements');
         return;
      }
      const data = new InputDialogData('Save View', 'View Name', '');
      const dialogRef = this.dialogService.showInputDialog(data);
      dialogRef.afterClosed().toPromise().then(r => {
         if (data.closedWithOK) {
            const view = this.modelToConfigConverter.convert(this.route, data.input, this.elementContexts);
            this.onPreSaveView(view);
            this.viewPersistenceService.saveView(this.scene, view)
               .then(s => this.showStatus(s));
         }
      });
   }
   
   protected abstract onPreSaveView(view: View): void;

   printView(): void {
      window.print();
   }

   adjustLayout() {
      this.divContentRef.nativeElement.style.marginTop = (this.divHeaderRef.nativeElement.offsetHeight + ViewController.MARGIN_TOP) + 'px';
   }

   saveAs(context: ElementContext, exportFormat: ExportFormat): void {
      if (this.isChartContext(context)) {
         this.exportService.exportImage(this.asChartContext(context).getContainer(), exportFormat, context.getTitle());
      } else if (this.isSummaryContext(context)) {
         const sumTableComponent = this.sumTableComponents.find(cmp => cmp.context === context);
         this.exportService.exportData(sumTableComponent.createExportData(), exportFormat, context.getTitle());
      }
   }
}
