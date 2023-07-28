import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ConfigController } from 'app/shared/controller/config.controller';
import { ValueFormatter } from 'app/shared/format';
import { ConfigRecord } from 'app/shared/model/view-config';
import { QueryDef } from 'app/shared/model/view-config/query/query-def.type';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from 'app/shared/services';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { queryDefToQuery } from 'app/shared/services/view-persistence/filter/filter-to-query-converter';
import { queryToQueryDef } from 'app/shared/services/view-persistence/filter/query-to-filter-converter';
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
export class RawDataComponent extends ConfigController implements OnInit, AfterViewInit {

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
  restoredQuery: Query;

  private page: Page;
  private valueFormatter = new ValueFormatter();

  constructor(bottomSheet: MatBottomSheet, router: Router, public dbService: DBService, public viewPersistenceService: ViewPersistenceService,
    public dialogService: DialogService, notificationService: NotificationService, private exportService: ExportService, public snackBar: MatSnackBar) {
    super(Route.RAWDATA, router, bottomSheet, dbService, dialogService, viewPersistenceService, notificationService);
    this.pageSizeOptions = [5, 10, 25, 50, 100, 500];
    this.initialPageSize = this.pageSizeOptions[1];
    this.considerColumnWidths = true;
    this.showNestedObjects = false;
    this.highlight = true;
  }

  init(): void {
    if (!this.query) {
      this.query = new Query();
    }
    this.query.setPageDefinition(0, this.initialPageSize);
    this.columns = this.scene.columns;
    this.colWidthMeasurement = colWidthMeasurementOf(this.scene);
    this.tableStyleWidth = _.sum(this.columns.map(c => c.width));
    this.hasObjectDataTypeColumns = this.columns.find(c => c.dataType === DataType.OBJECT) !== undefined;
    this.columnNames = this.columns.map(c => c.name);
    this.fetchEntriesPage();
  }

  ngAfterViewInit(): void {
    this.adjustLayout();

    if (!this.dialogStyle && this.scene.config.records.length) {
      this.selectConfig();
    }
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

  // eslint-disable-next-line
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

  configToBeSaved(): { query: Query, data: ConfigRecordData } {
    return {
      query: this.query,
      data: {
        pageDef: {
          queryDef: queryToQueryDef(this.page.query),
          totalRowCount: this.page.totalRowCount
        },
        considerColumnWidths: this.considerColumnWidths,
        highlight: this.highlight
      }
    };
  }

  loadConfig(config: ConfigRecord): void {
    this.query = queryDefToQuery(config.query);
    this.restoredQuery = this.query;
    const configRecordData: ConfigRecordData = config.data;
    this.page.query = queryDefToQuery(configRecordData.pageDef.queryDef);
    this.page.totalRowCount = configRecordData.pageDef.totalRowCount;
    this.initialPageSize = this.query.getRowsPerPage();
    this.considerColumnWidths = configRecordData.considerColumnWidths;
    this.highlight = configRecordData.highlight;
    this.fetchEntriesPage();
  }
}

interface ConfigRecordData {
  pageDef: {
    queryDef: QueryDef;
    totalRowCount: number;
  },
  considerColumnWidths: boolean,
  highlight: boolean
}
