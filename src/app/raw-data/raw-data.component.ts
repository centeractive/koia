import { Component, ViewChild, OnInit, ElementRef, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Sort, MatPaginator, MatBottomSheet } from '@angular/material';
import { Column, Query, Route, Page, Scene } from '../shared/model';
import { DBService } from '../shared/services/backend';
import { ValueFormatter, QueryParamExtractor } from '../shared/utils';
import { NotificationService } from 'app/shared/services';
import { AbstractComponent } from 'app/shared/controller';
import { CouchDBService } from 'app/shared/services/backend/couchdb';

@Component({
  selector: 'koia-raw-data',
  templateUrl: './raw-data.component.html',
  styleUrls: ['./raw-data.component.css']
})
export class RawDataComponent extends AbstractComponent implements OnInit {

  static readonly MARGIN_TOP = 10;

  @Input() dialogStyle: boolean;
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

  constructor(bottomSheet: MatBottomSheet, private router: Router, private activatedRoute: ActivatedRoute, private dbService: DBService,
    private couchDBService: CouchDBService, notificationService: NotificationService) {
    super(bottomSheet, notificationService);
    this.pageSizeOptions = [5, 10, 25, 50, 100, 500];
    this.wrapWords = true;
    this.highlight = true;
  }

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      const queryParamExtractor = new QueryParamExtractor(params);
      if (queryParamExtractor.getCouchDBConnectionInfo() && queryParamExtractor.getSceneID()) {
        this.couchDBService.initConnection(queryParamExtractor.getCouchDBConnectionInfo())
          .then(msg => this.dbService.initBackend(true)
            .then(r => this.dbService.activateScene(queryParamExtractor.getSceneID())
              .then(scene => this.initScene(scene))))
          .catch(err => console.error('cannot show raw data of scene with _id ' + queryParamExtractor.getSceneID(), err));
      } else {
        const scene = this.dbService.getActiveScene();
        if (scene) {
          this.initScene(scene);
        } else {
          this.router.navigateByUrl(Route.SCENES);
        }
      }
    });
  }

  private initScene(scene: Scene): void {
    if (!this.query) {
      this.query = new Query();
    }
    this.query.setPageDefinition(0, this.pageSizeOptions[0]);
    this.columns = scene.columns;
    this.columnNames = this.columns.map(c => c.name);
    this.fetchEntriesPage();
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
    const style = this.divContentRef.nativeElement.style;
    if (this.dialogStyle) {
      style.marginTop = RawDataComponent.MARGIN_TOP + 'px';
    } else {
      const marginTop = this.divHeaderRef.nativeElement.offsetHeight + RawDataComponent.MARGIN_TOP;
      style.marginTop = marginTop + 'px';
      style.maxHeight = (window.innerHeight - marginTop - RawDataComponent.MARGIN_TOP) + 'px';
    }
  }

  printView(): void {
    window.print();
  }
}
