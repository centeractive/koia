import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ValueFormatter } from 'app/shared/format';
import { DialogService, ExportService, NotificationService } from 'app/shared/services';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { colWidthMeasurementOf } from 'app/shared/utils/source-system';
import * as _ from 'lodash';
import { lastValueFrom } from 'rxjs';
import { Column, DataType, ExportFormat, Page, Query, Route } from '../shared/model';
import { DBService } from '../shared/services/backend';

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
  entries: object[];
  totalRowCount: number;
  pageSizeOptions: number[];
  initialPageSize: number;
  loading: boolean;
  considerColumnWidths: boolean;
  showNestedObjects: boolean;
  highlight: boolean;
  exportFormats: ExportFormat[] = [ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.JSON];

  colWidthMeasurement: 'em' | 'px';
  tableStyleWidth: number;

  private page: Page;
  private valueFormatter = new ValueFormatter();

  constructor(bottomSheet: MatBottomSheet, private router: Router, private dbService: DBService,
    private dialogService: DialogService, notificationService: NotificationService,
    private exportService: ExportService, public snackBar: MatSnackBar) {
    super(bottomSheet, notificationService);
    this.pageSizeOptions = [5, 10, 25, 50, 100, 500];
    this.initialPageSize = this.pageSizeOptions[1];
    this.considerColumnWidths = true;
    this.showNestedObjects = false;
    this.highlight = true;
  }

  ngOnInit(): void {
    const scene = this.dbService.getActiveScene();
    if (scene) {
      if (!this.query) {
        this.query = new Query();
      }
      this.query.setPageDefinition(0, this.initialPageSize);
      this.columns = scene.columns;
      this.colWidthMeasurement = colWidthMeasurementOf(scene);
      this.tableStyleWidth = _.sum(this.columns.map(c => c.width));
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

  formattedValueOf(column: Column, entry: object): any {
    if (!this.showNestedObjects && column.dataType === DataType.OBJECT) {
      return entry[column.name] ? '...' : '';
    }
    return this.valueFormatter.formatValue(column, entry[column.name]);
  }

  displayValue(column: Column, entry: object): void {
    if (column.dataType === DataType.OBJECT) {
      const data = new ConfirmDialogData('Column ' + column.name, '<pre>' + entry[column.name] + '</pre>', ['CLose']);
      this.dialogService.showConfirmDialog(data);
    }
  }

  adjustLayout(): void {
    let maxHeight = window.innerHeight;
    if (this.dialogStyle) {
      maxHeight -= 200; // TODO: compute dependent on dialog height and toolbar
    }
    const style = this.divContentRef.nativeElement.style;
    style.maxHeight = maxHeight + 'px';
  }

  saveAs(exportFormat: ExportFormat): void {
    const query = this.query.clone();
    const message = (query.hasFilter() ? 'filtered' : 'complete') + ' data is collected and saves as ' + exportFormat + ' in the background';
    this.snackBar.open(message, undefined, { duration: 4000 });
    query.clearPageDefinition();
    lastValueFrom(this.dbService.findEntries(query, false))
      .then(entries => this.exportService.exportData(entries, this.columns, exportFormat, 'Raw-Data'))
      .catch(error => this.notifyError(error));
  }

  printView(): void {
    window.print();
  }
}
