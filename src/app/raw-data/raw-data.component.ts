import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ConfigController } from 'app/shared/controller/config.controller';
import { ConfigRecord } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from 'app/shared/services';
import { RAW_DATA_FILE_BASE_NAME } from 'app/shared/services/export/export-file';
import { LanguageService } from 'app/shared/services/language';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { queryDefToQuery } from 'app/shared/services/view-persistence/filter/filter-to-query-converter';
import { ColumnWidthResolver } from 'app/shared/ui/virtual-table/column-width-resolver';
import { VirtualTableComponent } from 'app/shared/ui/virtual-table/virtual-table.component';
import { ColumnResize, VirtualTableSource } from 'app/shared/ui/virtual-table/virtual-table-source';
import { colWidthMeasurementOf } from 'app/shared/utils/source-system';
import { lastValueFrom } from 'rxjs';
import { Column, ExportFormat, Page, Query, Route } from '../shared/model';
import { DBService } from '../shared/services/backend';
import { RawDataBlockCache } from './raw-data-block-cache';
import { SORT_INDICATORS } from './sort-indicators';

@Component({
  selector: 'koia-raw-data',
  templateUrl: './raw-data.component.html',
  styleUrls: ['./raw-data.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class RawDataComponent extends ConfigController implements OnInit, AfterViewInit, OnDestroy {

  @Input() dialogStyle: boolean;
  @Input() query: Query;
  @Input() hideToolbar: boolean;

  @ViewChild(VirtualTableComponent) table: VirtualTableComponent;

  override readonly route = Route.RAWDATA;

  columns: Column[];
  totalRowCount: number;
  loading: boolean;
  considerColumnWidths: boolean;
  showNestedObjects: boolean;
  highlight: boolean;
  multiLine = false;
  exportFormats: ExportFormat[] = [ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.JSON];

  colWidthMeasurement: 'em' | 'px';
  restoredQuery: Query;
  widths: number[] = [];
  customWidths: Record<string, number> = {};

  readonly source: VirtualTableSource = {
    rowCount: () => this.totalRowCount,
    rowAt: index => this.cache.rowAt(index),
    requestRange: (first, last) => this.cache.requestRange(first, last)
  };

  private cache: RawDataBlockCache;
  private readonly widthResolver = new ColumnWidthResolver();

  constructor(bottomSheet: MatBottomSheet, router: Router, public override dbService: DBService, public override viewPersistenceService: ViewPersistenceService,
    public override dialogService: DialogService, notificationService: NotificationService, private exportService: ExportService, public snackBar: MatSnackBar) {
    super(Route.RAWDATA, router, bottomSheet, dbService, dialogService, viewPersistenceService, notificationService);
    this.considerColumnWidths = true;
    this.showNestedObjects = false;
    this.highlight = true;
  }

  init(): void {
    if (!this.query) {
      this.query = new Query();
    }
    this.columns = this.scene.columns;
    this.colWidthMeasurement = colWidthMeasurementOf(this.scene);
    this.cache = new RawDataBlockCache(this.dbService, () => this.query, {
      onLoading: loading => this.loading = loading,
      onBlockLoaded: (page, firstBlock) => this.onBlockLoaded(page, firstBlock),
      onError: error => this.notifyError(error)
    });
    this.applyWidths();
    this.cache.reset();
  }

  ngAfterViewInit(): void {
    if (!this.dialogStyle && this.scene?.config.records.filter(r => r.route === this.route).length) {
      this.selectConfig();
    }
  }

  ngOnDestroy(): void {
    this.cache?.cancel();
  }

  onFilterChanged(query: Query): void {
    query.setSort(this.query.getSort());
    this.query = query;
    this.reload();
  }

  sortBy(column: Column): void {
    if (!column.indexed) {
      return;
    }
    const sort = this.query.getSort();
    if (sort?.active === column.name && sort.direction === 'asc') {
      this.query.setSort({ active: column.name, direction: 'desc' });
    } else if (sort?.active === column.name && sort.direction === 'desc') {
      this.query.clearSort();
    } else {
      this.query.setSort({ active: column.name, direction: 'asc' });
    }
    this.reload();
  }

  readonly sortIndicator = (column: Column): string => {
    const sort = this.query.getSort();
    if (sort?.active !== column.name) {
      return '';
    }
    return sort.direction === 'asc' ? SORT_INDICATORS.asc : sort.direction === 'desc' ? SORT_INDICATORS.desc : '';
  };

  readonly rowStyleOf = (entry: object): object | null => this.highlight ? { background: entry['bgcolor'], color: entry['fgcolor'] } : null;

  onColumnResize(resize: ColumnResize): void {
    this.customWidths[this.columns[resize.index].name] = resize.width;
    this.widths = this.widths.map((width, i) => i === resize.index ? resize.width : width);
  }

  toggleMultiLine(): void {
    this.multiLine = !this.multiLine;
  }

  toggleShowNestedObjects(): void {
    this.showNestedObjects = !this.showNestedObjects;
    this.applyWidths();
  }

  toggleConsiderColumnWidths(): void {
    this.considerColumnWidths = !this.considerColumnWidths;
    this.customWidths = {};
    this.applyWidths();
  }

  toggleHighlight(): void {
    this.highlight = !this.highlight;
  }

  saveAs(exportFormat: ExportFormat): void {
    const query = this.query.clone();
    const message = LanguageService.instant(query.hasFilter() ? 'rawData.exportFiltered' : 'rawData.exportComplete', { format: exportFormat });
    this.snackBar.open(message, undefined, { duration: 4000 });
    query.clearPageDefinition();
    lastValueFrom(this.dbService.findEntries(query, false))
      .then(entries => this.exportService.exportData(entries, this.columns, exportFormat, RAW_DATA_FILE_BASE_NAME))
      .catch(error => this.notifyError(error));
  }

  configToBeSaved(): { query: Query, data: ConfigRecordData } {
    return {
      query: this.query,
      data: {
        considerColumnWidths: this.considerColumnWidths,
        highlight: this.highlight,
        multiLine: this.multiLine,
        columnWidths: { ...this.customWidths }
      }
    };
  }

  loadConfig(configRecord: ConfigRecord): void {
    this.currentViewName = configRecord.name;
    this.query = queryDefToQuery(configRecord.query);
    this.restoredQuery = this.query;
    const configRecordData = configRecord.data as ConfigRecordData;
    this.considerColumnWidths = configRecordData.considerColumnWidths;
    this.highlight = configRecordData.highlight;
    this.multiLine = configRecordData.multiLine ?? false;
    this.customWidths = { ...(configRecordData.columnWidths ?? {}) };
    this.applyWidths();
    this.reload();
  }

  private reload(): void {
    this.totalRowCount = undefined;
    this.table.reset();
    this.cache.reset();
  }

  private onBlockLoaded(page: Page, firstBlock: boolean): void {
    this.totalRowCount = page.totalRowCount;
    if (firstBlock) {
      SortLimitationWorkaround.showInfoDialog(this.dbService, this.dialogService, this.query);
      this.applyWidths();
    }
    this.table.refresh();
  }

  private applyWidths(): void {
    this.widths = this.columns.map(column => this.customWidths[column.name] ??
      this.widthResolver.widthOf(column, this.colWidthMeasurement, this.considerColumnWidths, this.cache.loadedRows(), this.showNestedObjects));
  }
}

interface ConfigRecordData {
  considerColumnWidths: boolean,
  highlight: boolean,
  multiLine?: boolean,
  columnWidths?: Record<string, number>
}
