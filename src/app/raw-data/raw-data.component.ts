import { ChangeDetectionStrategy, Component, inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ConfigController } from 'app/shared/controller/config.controller';
import { RawDataState } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService } from 'app/shared/services';
import { ComputedColumnChange, ComputedColumnService } from 'app/shared/services/computed-column.service';
import { RAW_DATA_FILE_BASE_NAME } from 'app/shared/services/export/export-file';
import { LanguageService } from 'app/shared/services/language';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { RawDataStateProvider, RawDataStateService } from 'app/shared/services/saved-views';
import { entryRowStyle } from 'app/shared/ui/virtual-table/entry-row-style';
import { queryDefToQuery } from 'app/shared/services/view-persistence/filter/filter-to-query-converter';
import { ViewColumnRenamer } from 'app/shared/services/view-persistence/view-column-renamer';
import { queryToQueryDef } from 'app/shared/services/view-persistence/filter/query-to-filter-converter';
import { createDefaultRawDataState } from 'app/shared/services/view-persistence/raw-data-state-factory';
import { ColumnWidthResolver } from 'app/shared/ui/virtual-table/column-width-resolver';
import { VirtualTableComponent } from 'app/shared/ui/virtual-table/virtual-table.component';
import { ColumnResize, VirtualTableSource } from 'app/shared/ui/virtual-table/virtual-table-source';
import { computedColumnTooltipOf } from 'app/shared/utils/computation-utils';
import { colWidthMeasurementOf } from 'app/shared/utils/source-system';
import { lastValueFrom, Subscription } from 'rxjs';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { ContrastAnalysis, ContrastService } from 'app/shared/services/contrast/contrast.service';
import { ContrastFinding, ValueKind } from 'app/shared/services/contrast/contrast.types';
import { CanvasPaging, Column, ExportFormat, Operator, Page, PropertyFilter, Query, Route } from '../shared/model';
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
export class RawDataComponent extends ConfigController implements OnInit, OnDestroy, RawDataStateProvider {

  @Input() dialogStyle: boolean;
  @Input() query: Query;
  @Input() hideToolbar: boolean;

  /**
   * the rows the displayed rows are compared with when explaining them in a dialog, the main view compares with all rows
   */
  @Input() explainBase: Query;

  @ViewChild(VirtualTableComponent) table: VirtualTableComponent;

  override readonly route = Route.RAWDATA;

  columns: Column[];
  totalRowCount: number;
  loading: boolean;
  considerColumnWidths: boolean;
  showNestedObjects: boolean;
  highlight: boolean;
  multiLine: boolean;
  paging: CanvasPaging;
  exportFormats: ExportFormat[] = [ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.JSON];

  colWidthMeasurement: 'em' | 'px';
  restoredQuery: Query;
  widths: number[] = [];
  customWidths: Record<string, number> = {};

  /**
   * the selection and base explained in the contrast panel, undefined while the panel is closed
   */
  contrastAnchor: { selection: Query, base: Query };
  contrast: ContrastAnalysis;

  readonly source: VirtualTableSource = {
    rowCount: () => this.totalRowCount,
    rowAt: index => this.cache.rowAt(index),
    requestRange: (first, last) => this.cache.requestRange(first, last)
  };

  private cache: RawDataBlockCache;
  private readonly widthResolver = new ColumnWidthResolver();
  private readonly computedColumnService = inject(ComputedColumnService);
  private computedColumnsSubscription: Subscription;
  private readonly contrastService = inject(ContrastService);

  constructor(bottomSheet: MatBottomSheet, router: Router, public override dbService: DBService, public dialogService: DialogService,
    notificationService: NotificationService, private exportService: ExportService, public snackBar: MatSnackBar,
    private rawDataStateService: RawDataStateService) {
    super(Route.RAWDATA, router, bottomSheet, dbService, notificationService);
    const defaults = createDefaultRawDataState().data;
    this.considerColumnWidths = defaults.considerColumnWidths;
    this.showNestedObjects = false;
    this.highlight = defaults.highlight;
    this.multiLine = defaults.multiLine;
    this.paging = defaults.paging;
  }

  init(): void {
    const state = this.dialogStyle ? undefined : this.rawDataStateService.register(this);
    if (state) {
      this.adopt(state);
    } else if (!this.query) {
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
    this.computedColumnsSubscription = this.computedColumnService.changed$.subscribe(c => this.onComputedColumnsChanged(c));
  }

  private onComputedColumnsChanged(change: ComputedColumnChange): void {
    if (change.name !== undefined && change.name !== change.previousName) {
      new ViewColumnRenamer(change.previousName, change.name).renameKey(this.customWidths);
    }
    this.columns = this.scene.columns;
    this.closeExplanation();
    this.applyWidths();
    this.reload();
  }

  ngOnDestroy(): void {
    this.cache?.cancel();
    this.computedColumnsSubscription?.unsubscribe();
    this.rawDataStateService.unregister(this);
  }

  onFilterChanged(query: Query): void {
    query.setSort(this.query.getSort());
    this.query = query;
    this.closeExplanation();
    this.reload();
  }

  /**
   * replaces the query by the specified one and keeps the current sort, the main toolbar shows the filters of the new query
   */
  applyQuery(query: Query): void {
    query.setSort(this.query.getSort());
    this.query = query;
    this.restoredQuery = query;
    this.reload();
  }

  canExplain(): boolean {
    return this.dialogStyle ? !!this.explainBase : !!this.query?.hasFilter();
  }

  /**
   * analyzes in which column values the displayed rows differ from the base rows
   */
  explain(): void {
    const anchor = {
      selection: this.query.clone(),
      base: this.dialogStyle ? this.explainBase.clone() : new Query()
    };
    this.contrastAnchor = anchor;
    this.contrast = undefined;
    this.contrastService.explain(anchor.selection, anchor.base, this.scene.columns)
      .then(analysis => {
        if (this.contrastAnchor === anchor) {
          this.contrast = analysis;
        }
      })
      .catch(error => {
        this.closeExplanation();
        this.notifyError(error);
      });
  }

  closeExplanation(): void {
    this.contrastAnchor = undefined;
    this.contrast = undefined;
  }

  /**
   * narrows the explained rows to the ones having the value of the finding, a further finding replaces the previous narrowing
   */
  onFindingClick(finding: ContrastFinding): void {
    const query = this.contrastAnchor.selection.clone();
    const dataType = this.scene.columns.find(c => c.name === finding.column).dataType;
    if (finding.kind === ValueKind.EMPTY) {
      query.addPropertyFilter(new PropertyFilter(finding.column, Operator.EMPTY, '', dataType));
    } else {
      query.addPropertyFilter(new PropertyFilter(finding.column, Operator.EQUAL, finding.value, dataType));
    }
    this.applyQuery(query);
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

  readonly headerTooltip = (column: Column): string => computedColumnTooltipOf(column);

  readonly rowStyleOf =(entry: object): object | null => this.highlight ? entryRowStyle(entry) : null;

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

  isPaged(): boolean {
    return PageFormat.isPaged(this.paging);
  }

  onPagingChange(paging: CanvasPaging): void {
    this.paging = paging;
  }

  saveAs(exportFormat: ExportFormat): void {
    const query = this.query.clone();
    const message = LanguageService.instant(query.hasFilter() ? 'rawData.exportFiltered' : 'rawData.exportComplete', { format: exportFormat });
    this.snackBar.open(message, undefined, { duration: 4000 });
    query.clearPageDefinition();
    lastValueFrom(this.dbService.findEntriesWithComputedValues(query, false))
      .then(entries => this.exportService.exportData(entries, this.columns, exportFormat, RAW_DATA_FILE_BASE_NAME))
      .catch(error => this.notifyError(error));
  }

  rawDataState(): RawDataState {
    return {
      query: queryToQueryDef(this.query),
      data: {
        considerColumnWidths: this.considerColumnWidths,
        highlight: this.highlight,
        multiLine: this.multiLine,
        columnWidths: { ...this.customWidths },
        paging: this.paging
      }
    };
  }

  applyRawDataState(state: RawDataState): void {
    this.adopt(state);
    this.closeExplanation();
    this.applyWidths();
    this.reload();
  }

  private adopt(state: RawDataState): void {
    this.query = queryDefToQuery(state.query);
    this.restoredQuery = this.query;
    this.considerColumnWidths = state.data.considerColumnWidths;
    this.highlight = state.data.highlight;
    this.multiLine = state.data.multiLine ?? false;
    this.customWidths = { ...(state.data.columnWidths ?? {}) };
    this.paging = state.data.paging ?? CanvasPaging.NONE;
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
