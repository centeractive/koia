import {
  Component, ViewEncapsulation, OnInit, Input, Output, EventEmitter, AfterViewChecked
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Route, Column, Query, PropertyFilter, Operator, DataType, Scene } from '../shared/model';
import { CommonUtils, ArrayUtils, DataTypeUtils } from 'app/shared/utils';
import { DBService } from 'app/shared/services/backend';
import { TimeRangeFilter } from './time-range-filter';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'retro-main-toolbar',
  templateUrl: './main-toolbar.component.html',
  styleUrls: ['./main-toolbar.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MainToolbarComponent implements OnInit, AfterViewChecked {

  @Input() dialogStyle: boolean;
  @Input() route: Route;
  @Input() query: Query;
  @Output() onAfterViewChecked: EventEmitter<void> = new EventEmitter();
  @Output() onFilterChange: EventEmitter<Query> = new EventEmitter(true);

  readonly urlScenes = '/' + Route.SCENES;
  readonly urlRawdata = '/' + Route.RAWDATA;
  readonly urlGrid = '/' + Route.GRID;
  readonly urlFlex = '/' + Route.FLEX;
  readonly urlPivot = '/' + Route.PIVOT;

  currURL: string;
  scene: Scene;
  nonTimeColumns: Column[];
  timeColumns: Column[];
  showContext: boolean;
  showTimeFilter: boolean;
  fullTextFilter = '';
  readonly operators: Operator[];
  columnFilters: PropertyFilter[] = [];
  timeRangeFilters: TimeRangeFilter[] = [];

  private justNavigatedToParentView: boolean

  constructor(public router: Router, private dbService: DBService) {
    this.operators = Object.keys(Operator).map(key => Operator[key]);
    this.identifyCurrentUrl();
  }

  private identifyCurrentUrl(): void {
    if (this.router.events) {
      this.router.events.subscribe(e => {
        if (e instanceof NavigationEnd) {
          this.currURL = CommonUtils.extractBaseURL((<NavigationEnd>e).urlAfterRedirects);
        }
      });
    }
  }

  ngOnInit() {
    this.scene = this.dbService.getActiveScene();
    if (!this.scene) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.listenOnNavigationEvents();
      this.nonTimeColumns = this.scene.columns.filter(c => c.dataType !== DataType.TIME);
      this.timeColumns = this.scene.columns.filter(c => c.dataType === DataType.TIME);
      this.retainInitialFilters();
    }
  }

  /**
   * This method is a workaround. It prevents us from seeing the time slider in a wrong state after the window was resized
   * while another view was active. In such cases, both hendles of the slider were shown at the time range start point.
   *
   * 1. we listen on navigation events in order to detect when the parent view gets activated.
   * 2. when #ngAfterViewChecked is invoked after such an event, we re-create the time slide options, thus forcing an update
   * of the ng5-slider.
   *
   * @see #ngAfterViewChecked
   */
  private listenOnNavigationEvents() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && (<NavigationEnd>e).url === '/' + this.route) {
        this.justNavigatedToParentView = true;
      }
    });
  }

  /**
   * @see #listenOnNavigationEvents
   */
  ngAfterViewChecked() {
    if (this.justNavigatedToParentView) {
      this.justNavigatedToParentView = false;
      this.timeRangeFilters.forEach(f => f.defineTimeRangeOptions());
    }
    this.onAfterViewChecked.emit();
  }

  private retainInitialFilters() {
    if (this.query) {
      this.fullTextFilter = this.query.getFullTextFilter();
      const nonTimeColumnNames = this.nonTimeColumns.map(c => c.name);
      this.columnFilters = this.query.getPropertyFilters()
        .filter(f => nonTimeColumnNames.includes(f.propertyName));
      const timeColumnNames = this.timeColumns.map(c => c.name);
      ArrayUtils.distinctValues(this.query.getPropertyFilters()
        .map(pf => pf.propertyName)
        .filter(n => timeColumnNames.includes(n)))
        .map(n => this.timeColumns.find(c => c.name === n))
        .forEach(c => this.addTimeRangeFilter(c));
    }
  }

  availableOperatorsOf(columnName: string): Operator[] {
    const column = this.scene.columns.find(c => c.name === columnName);
    return column.dataType === DataType.TEXT ? this.operators : this.operators.filter(o => o !== Operator.CONTAINS);
  }

  addColumnFilter(column: Column): void {
    if (column.dataType === DataType.TIME) {
      this.addTimeRangeFilter(column);
    } else {
      this.columnFilters.push(new PropertyFilter(column.name, Operator.EQUAL, ''));
    }
  }

  hasTimeRangeFilter(column: Column): boolean {
    return this.timeRangeFilters.find(f => f.column === column) !== undefined;
  }

  iconOf(dataType: DataType): string {
    return DataTypeUtils.iconOf(dataType);
  }

  addTimeRangeFilter(timeColumn: Column): void {
    this.dbService.timeRangeOf(timeColumn)
      .then(vr => {
        const timeRangeFilter = new TimeRangeFilter(timeColumn, vr.min, vr.max, this.query);
        this.timeRangeFilters.push(timeRangeFilter);
        this.showTimeFilter = true;
      });
  }

  onColumnFilterChanged(filter: PropertyFilter, column: Column): void {
    filter.propertyName = column.name;
    if (column.dataType !== DataType.TEXT && filter.operator === Operator.CONTAINS) {
      filter.operator = Operator.EQUAL;
    }
    this.refreshEntries();
  }

  removeColumnFilter(columnFilter: PropertyFilter): void {
    this.columnFilters = this.columnFilters.filter(cf => cf !== columnFilter);
    if (columnFilter.isApplicable()) {
      this.refreshEntries();
    }
  }

  onFilterFieldKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.refreshEntries();
    }
  }

  resetFullTextFilter(): void {
    this.fullTextFilter = '';
    this.refreshEntries();
  }

  resetColumnFilter(columnFilter: PropertyFilter): void {
    columnFilter.clearFilterValue();
    this.refreshEntries();
  }

  resetTimeRangeFilter(timeRangeFilter: TimeRangeFilter): void {
    timeRangeFilter.reset();
    setTimeout(() => this.refreshEntries(), 500); // let slider properly reset itself
  }

  removeTimeRangeFilter(timeRangeFilter: TimeRangeFilter): void {
    ArrayUtils.removeElement(this.timeRangeFilters, timeRangeFilter);
    if (timeRangeFilter.isFiltered()) {
      this.refreshEntries();
    }
  }

  refreshEntries(): void {
    const query = new Query();
    if (this.fullTextFilter && this.fullTextFilter.length > 0) {
      this.defineFullTextFilter(query);
    }
    this.columnFilters
      .filter(f => f.operator === Operator.NOT_EMPTY || (f.filterValue !== undefined && f.filterValue !== ''))
      .forEach(f => query.addPropertyFilter(f.clone()));
    this.timeRangeFilters
      .filter(f => f.isStartFiltered())
      .forEach(f => query.setTimeStart(f.column.name, f.selTimeStart));
    this.timeRangeFilters
      .filter(f => f.isEndFiltered())
      .forEach(f => query.setTimeEnd(f.column.name, f.selTimeEnd));
    this.onFilterChange.emit(query);
  }

  private defineFullTextFilter(query: Query): void {
    query.setFullTextFilter(this.fullTextFilter);


    // jsonserver
    //
    // [[Query.setFullTextFilter]] would be the propper method to be used but this results in a json-server full text search within
    // all columns. Since the time column is stored as a number, this may produces wrong results when the search term is also a
    // number. As a workaround, we search within the 'Data' column for now.
    //
    // TODO: find generic solution that works also when 'Data' column does not exist
    //
    // if (this.dataColumnExists) {
    //  query.addPropertyFilter(new PropertyFilter('Data', Operator.CONTAINS, this.fullTextFilter));
    // }
  }
}
