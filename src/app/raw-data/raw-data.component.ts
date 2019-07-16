import { Component, ViewChild, OnInit, ElementRef, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sort, MatPaginator, MatBottomSheet } from '@angular/material';
import { Column, Query, Route, Page } from '../shared/model';
import { DBService } from '../shared/services/backend';
import { ValueFormatter } from '../shared/utils';
import { QueryUtils } from 'app/shared/utils/query-utils';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { NotificationService } from 'app/shared/services';
import { AbstractComponent } from 'app/shared/controller';

@Component({
  selector: 'retro-raw-data',
  templateUrl: './raw-data.component.html',
  styleUrls: ['./raw-data.component.css']
})
export class RawDataComponent extends AbstractComponent implements OnInit {

  static readonly MARGIN_TOP = 10;

  @Input() query: Query;

  @ViewChild('header', undefined) divHeaderRef: ElementRef<HTMLDivElement>;
  @ViewChild('content', undefined) divContentRef: ElementRef<HTMLDivElement>;
  @ViewChild(MatPaginator, undefined) paginator: MatPaginator;

  readonly route = Route.PIVOT;
  columns: Column[];
  columnNames: string[];
  entries: Object[];
  totalRowCount: number;
  pageSizeOptions: number[];
  loading: boolean;
  wrapWords: boolean;
  highlight: boolean;

  private page: Page;
  private valueFormatter = new ValueFormatter();

  constructor(bottomSheet: MatBottomSheet, private router: Router, private activatedRoute: ActivatedRoute,
    private dbService: DBService, notificationService: NotificationService) {
    super(bottomSheet, notificationService);
    this.pageSizeOptions = [5, 10, 25, 50, 100, 500];
    this.wrapWords = true;
    this.highlight = true;
  }

  ngOnInit() {
    const scene = this.dbService.getActiveScene();
    if (!scene) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      if (!this.query) {
        this.query = new Query();
      }
      this.query.setPageDefinition(0, this.pageSizeOptions[0]);
      this.columns = scene.columns;
      this.columnNames = this.columns.map(c => c.name);
      this.fetchEntriesPage();
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
      })
      .catch(err => {
        this.loading = false;
        this.notifyError(err);
      });
  }

  formattedValueOf(column: Column, entry: Object): any {
    return this.valueFormatter.formatValue(column, entry[column.name]);
  }

  adjustLayout() {
    const marginTop = this.divHeaderRef.nativeElement.offsetHeight + RawDataComponent.MARGIN_TOP;
    const style = this.divContentRef.nativeElement.style;
    style.marginTop = marginTop + 'px';
    style.maxHeight = (window.innerHeight - marginTop - RawDataComponent.MARGIN_TOP) + 'px';
  }

  printView(): void {
    window.print();
  }
}
