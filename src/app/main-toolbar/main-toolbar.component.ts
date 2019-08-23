import {
  Component, ViewEncapsulation, OnInit, Input, Output, EventEmitter, AfterViewChecked
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Route, Column, Query, PropertyFilter, Operator, DataType, Scene } from '../shared/model';
import { ArrayUtils, DataTypeUtils } from 'app/shared/utils';
import { DBService } from 'app/shared/services/backend';
import { TimeRangeFilter } from './filter/time-range-filter';
import { NumberRangeFilter } from './filter/number-range-filter';
import { PropertyFilterCustomizer } from './filter/property-filter-customizer';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { ChangeContext } from 'ng5-slider';

@Component({
  selector: 'koia-main-toolbar',
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

  readonly urlFront = '/' + Route.FRONT;
  readonly urlScenes = '/' + Route.SCENES;
  readonly urlScene = '/' + Route.SCENE;
  readonly urlRawdata = '/' + Route.RAWDATA;
  readonly urlPivot = '/' + Route.PIVOT;
  readonly urlGrid = '/' + Route.GRID;
  readonly urlFlex = '/' + Route.FLEX;

  currURL: string;
  scene: Scene;
  nonTimeColumns: Column[];
  timeColumns: Column[];
  showFullTextFilter: boolean;
  showRangeFilters: boolean;
  fullTextFilter = '';
  readonly operators: Operator[];
  columnFilters: PropertyFilter[] = [];
  rangeFilters: NumberRangeFilter[] = [];
  propertyFilterCustomizer = new PropertyFilterCustomizer();

  private justNavigatedToParentView: boolean;

  constructor(public router: Router, private dbService: DBService) {
    this.operators = Object.keys(Operator).map(key => Operator[key]);
  }

  ngOnInit(): void {
    this.currURL = '/' + this.route;
    this.scene = this.dbService.getActiveScene();
    if (this.scene) {
      this.listenOnNavigationEvents();
      this.nonTimeColumns = this.scene.columns.filter(c => c.dataType !== DataType.TIME);
      this.timeColumns = this.scene.columns.filter(c => c.dataType === DataType.TIME);
      this.retainInitialFilters();
    }
  }

  /**
   * This method is a workaround. It prevents us from seeing time sliders in a wrong state after the window was resized
   * while another view was active. In such cases, both handles of the sliders were shown at the time range start point.
   *
   * 1. we listen on navigation events in order to detect when the parent view gets activated.
   * 2. when #ngAfterViewChecked is invoked after such an event, we re-create the time slide options, thus forcing updates
   * of the ng5-sliders.
   *
   * @see #ngAfterViewChecked
   */
  private listenOnNavigationEvents(): void {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && (<NavigationEnd>e).url === '/' + this.route) {
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
    this.onAfterViewChecked.emit();
  }

  private retainInitialFilters(): void {
    if (this.query) {
      this.fullTextFilter = this.query.getFullTextFilter();
      const nonTimeColumnNames = this.nonTimeColumns.map(c => c.name);
      this.columnFilters = this.query.getPropertyFilters()
        .filter(f => nonTimeColumnNames.includes(f.propertyName));
      this.query.getValueRangeFilters().forEach(f => {
        const column = this.scene.columns.find(c => c.name === f.propertyName);
        this.addRangeFilter(column, f.valueRange);
      })
    }
  }

  availableOperatorsOf(columnName: string): Operator[] {
    const column = this.scene.columns.find(c => c.name === columnName);
    return column.dataType === DataType.TEXT ? this.operators : this.operators.filter(o => o !== Operator.CONTAINS);
  }

  addColumnFilter(column: Column): void {
    if (column.dataType === DataType.TIME) {
      this.addRangeFilter(column, null);
    } else {
      this.columnFilters.push(new PropertyFilter(column.name, Operator.EQUAL, '', column.dataType));
    }
  }

  isNumberColumn(column: Column): boolean {
    return column && column.dataType === DataType.NUMBER;
  }

  hasRangeFilter(column: Column): boolean {
    return this.rangeFilters.find(f => f.column === column) !== undefined;
  }

  iconOf(dataType: DataType): string {
    return DataTypeUtils.iconOf(dataType);
  }

  addRangeFilter(column: Column, selValueRange: ValueRange): void {
    this.dbService.numberRangeOf(column)
      .then(vr => {
        if (column.dataType === DataType.TIME) {
          this.rangeFilters.push(new TimeRangeFilter(column, vr.min, vr.max, selValueRange));
        } else {
          this.rangeFilters.push(new NumberRangeFilter(column, vr.min, vr.max, selValueRange));
        }
        this.showRangeFilters = true;
      });
  }

  onColumnFilterNameChanged(filter: PropertyFilter, column: Column): void {
    filter.propertyName = column.name;
    filter.dataType = column.dataType;
    if (column.dataType !== DataType.TEXT && filter.operator === Operator.CONTAINS) {
      filter.operator = Operator.EQUAL;
    }
    if (filter.isApplicable()) {
      this.refreshEntries();
    }
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

  onRangeFilterChanged(filter: NumberRangeFilter, changeContext: ChangeContext): void {
    filter.selValueRange.min = changeContext.value;
    filter.selValueRange.max = changeContext.highValue;
    this.refreshEntries();
  }

  resetRangeFilter(rangeFilter: NumberRangeFilter): void {
    rangeFilter.reset();
    setTimeout(() => this.refreshEntries(), 500); // let slider properly reset itself
  }

  removeRangeFilter(rangeFilter: NumberRangeFilter): void {
    ArrayUtils.removeElement(this.rangeFilters, rangeFilter);
    if (rangeFilter.isFiltered()) {
      this.refreshEntries();
    }
  }

  refreshEntries(): void {
    const query = new Query();
    if (this.fullTextFilter && this.fullTextFilter.length > 0) {
      this.defineFullTextFilter(query);
    }
    this.columnFilters
      .filter(f => f.operator === Operator.EMPTY || f.operator === Operator.NOT_EMPTY
        || (f.filterValue !== undefined && f.filterValue !== ''))
      .forEach(f => query.addPropertyFilter(f.clone()));
    this.rangeFilters
      .filter(f => f.isStartFiltered() || f.isEndFiltered())
      .forEach(f => query.addValueRangeFilter(f.column.name, f.selValueRange.min, f.selValueRange.max, f.selValueRange.maxExcluding));
    this.onFilterChange.emit(query);
  }

  private defineFullTextFilter(query: Query): void {
    query.setFullTextFilter(this.fullTextFilter);


    // jsonserver
    //
    // [[Query.setFullTextFilter]] would be the proper method to be used but this results in a json-server full text search within
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
