import { AfterViewChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { NavigationEnd, Router } from '@angular/router';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ArrayUtils, DataTypeUtils } from 'app/shared/utils';
import { filterableColumnsOf } from 'app/shared/utils/column-utils';
import { PropertyFilterValidator } from 'app/shared/validator';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { Subscription } from 'rxjs';
import { tabUrl } from 'app/shared/services/view-tabs/tab-defs';
import { Column, DataType, PropertyFilter, Query, Route, Scene } from '../shared/model';
import { QueryBuilder } from './query-builder';
import { NumberRangeFilter } from './range-filter/model/number-range-filter';
import { TimeRangeFilter } from './range-filter/model/time-range-filter';
import { ValueFilterUtils } from './value-filter/value-filter-utils';

@Component({
    selector: 'koia-main-toolbar',
    templateUrl: './main-toolbar.component.html',
    styleUrls: ['./main-toolbar.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MainToolbarComponent extends AbstractComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {

  @Input() dialogStyle: boolean;
  @Input() route: Route;
  @Input() tabId: string;
  @Input() query: Query;
  @Input() restoredQuery: Query;
  @Output() onFilterChange = new EventEmitter<Query>();

  currURL: string;
  scene: Scene;
  showFullTextFilter: boolean;
  showRangeFilters: boolean;
  fullTextFilter = '';
  propertyFilters: PropertyFilter[] = [];
  rangeFilters: NumberRangeFilter[] = [];

  private propertyFilterValidator: PropertyFilterValidator;
  private justNavigatedToParentView: boolean;
  private navigationSubscription: Subscription;

  constructor(public router: Router, private dbService: DBService, private dialogService: DialogService, bottomSheet: MatBottomSheet,
    notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  ngOnInit(): void {
    this.currURL = this.tabId ? tabUrl(this.tabId) : '/' + this.route;
    this.scene = this.dbService.getActiveScene();
    if (this.scene) {
      this.propertyFilterValidator = new PropertyFilterValidator(this.scene.columns);
      this.listenOnNavigationEvents();
      this.retainInitialFilters();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.restoredQuery && !!this.restoredQuery) {
      this.query = this.restoredQuery;
      if (!changes.restoredQuery.firstChange) {
        this.retainInitialFilters();
      }
    }
  }

  ngOnDestroy(): void {
    this.navigationSubscription?.unsubscribe();
  }

  /**
   * This method is a workaround. It prevents us from seeing time sliders in a wrong state after the window was resized
   * while another view was active. In such cases, both handles of the sliders were shown at the time range start point.
   *
   * 1. we listen on navigation events in order to detect when the parent view gets activated.
   * 2. when #ngAfterViewChecked is invoked after such an event, we re-create the time slide options, thus forcing updates
   * of the ngx-sliders.
   *
   * @see #ngAfterViewChecked
   */
  private listenOnNavigationEvents(): void {
    this.navigationSubscription = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url === this.currURL) {
        this.justNavigatedToParentView = true;
      }
    });
  }

  /**
   * @see #listenOnNavigationEvents
   */
  ngAfterViewChecked(): void {
    if (this.justNavigatedToParentView) {
      this.justNavigatedToParentView = false;
      this.rangeFilters.forEach(f => f.defineSliderOptions());
    }
  }

  retainInitialFilters(): void {
    if (this.query) {
      const query = this.query.clone();
      this.fullTextFilter = query.getFullTextFilter();
      this.showFullTextFilter = !!this.fullTextFilter;
      this.propertyFilters = query.getPropertyFilters();
      this.rangeFilters = [];
      this.showRangeFilters = false;
      query.getValueRangeFilters().forEach(f => {
        const column = this.scene.columns.find(c => c.name === f.name);
        this.addRangeFilter(column, f.valueRange, f.inverted);
      })
    }
  }

  filterableColumns(): Column[] {
    return filterableColumnsOf(this.scene.columns);
  }

  showSceneDetails(): void {
    this.dialogService.showSceneDetailsDialog(this.scene);
  }

  addValueFilter(column: Column): void {
    const operator = ValueFilterUtils.defaultOperatorOf(column.dataType);
    const value = column.dataType === DataType.BOOLEAN ? true : '';
    this.propertyFilters.push(new PropertyFilter(column.name, operator, value, column.dataType));
    if (column.dataType === DataType.TIME || column.dataType === DataType.BOOLEAN) {
      this.refreshEntries();
    }
  }

  isNumericColumn(column: Column): boolean {
    return DataTypeUtils.isNumericColumn(column);
  }

  iconOf(dataType: DataType): string {
    return DataTypeUtils.iconOf(dataType);
  }

  canAddValueFilter(column: Column): boolean {
    if (column.dataType === DataType.TIME) {
      return this.propertyFilters.find(f => f.name === column.name) == undefined;
    }
    return true;
  }

  addRangeFilter(column: Column, selValueRange: ValueRange, inverted = false): void {
    this.dbService.numberRangeOf(column)
      .then(vr => {
        if (column.dataType === DataType.TIME) {
          this.rangeFilters.push(new TimeRangeFilter(column, vr.min, vr.max, selValueRange, inverted));
        } else {
          this.rangeFilters.push(new NumberRangeFilter(column, vr.min, vr.max, selValueRange, inverted));
        }
        this.showRangeFilters = true;
      })
      .catch(err => this.notifyError(err));
  }

  onFullTextFilterFieldKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.refreshEntries();
    }
  }

  removePropertyFilter(propertyFilter: PropertyFilter): void {
    this.propertyFilters = this.propertyFilters.filter(cf => cf !== propertyFilter);
    if (propertyFilter.isApplicable()) {
      this.refreshEntries();
    }
  }

  resetFullTextFilter(): void {
    this.fullTextFilter = '';
    this.showFullTextFilter = false;
    this.refreshEntries();
  }

  removeRangeFilter(rangeFilter: NumberRangeFilter): void {
    ArrayUtils.removeElement(this.rangeFilters, rangeFilter);
    this.showRangeFilters = this.rangeFilters.length > 0;
    if (rangeFilter.isFiltered()) {
      this.refreshEntries();
    }
  }

  refreshEntries(): void {
    const query = new QueryBuilder()
      .fullTextFilter(this.fullTextFilter)
      .propertyFilters(this.propertyFilters)
      .rangeFilters(this.rangeFilters)
      .getQuery();
    if (this.isValid(query)) {
      this.onFilterChange.emit(query);
    }
  }

  private isValid(query: Query): boolean {
    for (const propertyFilter of query.getPropertyFilters()) {
      if (this.propertyFilterValidator.validate(propertyFilter)) {
        return false;
      }
    }
    return true;
  }
}
