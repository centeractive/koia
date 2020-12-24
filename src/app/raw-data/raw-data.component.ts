import { Component, ViewChild, OnInit, ElementRef, Input, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Column, Query, Route, Page, ExportFormat, DataType } from '../shared/model';
import { DBService } from '../shared/services/backend';
import { NotificationService, DialogService, ExportService } from 'app/shared/services';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { ValueFormatter } from 'app/shared/format';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'koia-raw-data',
  templateUrl: './raw-data.component.html',
  styleUrls: ['./raw-data.component.css']
})
export class RawDataComponent extends AbstractComponent implements OnInit, AfterViewInit {

  @Input() dialogStyle: boolean;
  @Input() query: Query;
  @Input() hideToolbar: boolean;

  @ViewChild('content') divContentRef: ElementRef<HTMLDivElement>;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly route = Route.RAWDATA;
  columns: Column[];
  columnNames: string[];
  hasObjectDataTypeColumns: boolean;
  entries: Object[];
  totalRowCount: number;
  pageSizeOptions: number[];
  loading: boolean;
  considerColumnWidths: boolean;
  showNestedObjects: boolean;
  highlight: boolean;
  exportFormats: ExportFormat[] = [ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.JSON];

  private page: Page;
  private valueFormatter = new ValueFormatter();

  constructor(bottomSheet: MatBottomSheet, private router: Router, private dbService: DBService,
    private dialogService: DialogService, notificationService: NotificationService,
    private exportService: ExportService, public snackBar: MatSnackBar) {
    super(bottomSheet, notificationService);
    this.pageSizeOptions = [5, 10, 25, 50, 100, 500];
    this.considerColumnWidths = true;
    this.showNestedObjects = false;
    this.highlight = true;
  }

  ngOnInit() {
    const scene = this.dbService.getActiveScene();
    if (scene) {
      if (!this.query) {
        this.query = new Query();
      }
      this.query.setPageDefinition(0, this.pageSizeOptions[0]);
      this.columns = scene.columns;
      this.hasObjectDataTypeColumns = this.columns.find(c => c.dataType === DataType.OBJECT) !== undefined;
      this.columnNames = this.columns.map(c => c.name);
      this.fetchEntriesPage();
    } else {
      this.router.navigateByUrl(Route.SCENES);
    }
  }

  ngAfterViewInit(): void {
    this.adjustLayout();
  }

  onFilterChanged(query: Query): void {
    query.setSort(this.query.getSort());
    this.query = query;
    this.paginator.pageIndex = 0;
    this.onPageChanged();
  }

  sortEntries(sort: Sort): void {
    this.query.setSort(sort);
    this.paginator.pageIndex = 0;
    this.onPageChanged();
  }

  onPageChanged(): void {
    this.query.setPageDefinition(this.paginator.pageIndex, this.paginator.pageSize);
    this.fetchEntriesPage();
  }

  private fetchEntriesPage(): void {
    this.loading = true;
    this.dbService.requestEntriesPage(this.query, this.page)
      .then(page => {
        this.page = page;
        this.entries = page.entries;
        this.totalRowCount = page.totalRowCount;
        this.loading = false;
        SortLimitationWorkaround.showInfoDialog(this.dbService, this.dialogService, this.query);
      })
      .catch(err => {
        this.loading = false;
        this.notifyError(err);
      });
  }

  formattedValueOf(column: Column, entry: Object): any {
    if (!this.showNestedObjects && column.dataType === DataType.OBJECT) {
      return entry[column.name] ? '...' : '';
    }
    return this.valueFormatter.formatValue(column, entry[column.name]);
  }

  displayValue(column: Column, entry: Object): void {
    if (column.dataType === DataType.OBJECT) {
      const data = new ConfirmDialogData('Column ' + column.name, '<pre>' + entry[column.name] + '</pre>', ['CLose']);
      this.dialogService.showConfirmDialog(data);
    }
  }

  adjustLayout() {
    let maxHeight = window.innerHeight;
    if (this.dialogStyle) {
      maxHeight -= 200; // TODO: compute dependent on dialog height and toolbar
    }
    const style = this.divContentRef.nativeElement.style;
    style.maxHeight = maxHeight + 'px';
  }

  saveAs(exportFormat: ExportFormat): void {
    const query = this.query.clone();
    const message = (query.hasFilter() ? 'filtered' : 'complete') + ' data is collected and saves as ' +
      exportFormat + ' in the background';
    this.snackBar.open(message, undefined, { duration: 3000 });
    query.clearPageDefinition();
    this.dbService.findEntries(query, false).toPromise()
      .then(entries => {
        if (exportFormat === ExportFormat.JSON) {
          this.exportService.restoreJSONObjects(entries, this.columns);
        }
        this.exportService.exportData(entries, exportFormat, 'Raw-Data');
      })
      .catch(error => this.notifyError(error));
  }

  printView(): void {
    window.print();
  }
}
