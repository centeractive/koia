import { Component, OnInit, Input, Output, EventEmitter, AfterViewChecked } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Route, Column, Query, PropertyFilter, Operator, DataType, Scene } from '../shared/model';
import { ArrayUtils, DataTypeUtils } from 'app/shared/utils';
import { DBService } from 'app/shared/services/backend';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { DialogService } from 'app/shared/services';
import { TimeRangeFilter } from './range-filter/model/time-range-filter';
import { NumberRangeFilter } from './range-filter/model/number-range-filter';
import { QueryBuilder } from './query-builder';
import { PropertyFilterValidator } from 'app/shared/validator';
import { ValueFilterUtils } from './value-filter/value-filter-utils';

@Component({
  selector: 'koia-main-toolbar',
  templateUrl: './main-toolbar.component.html',
  styleUrls: ['./main-toolbar.component.css']
})
export class MainToolbarComponent implements OnInit, AfterViewChecked {

  @Input() dialogStyle: boolean;
  @Input() route: Route;
  @Input() query: Query;
  @Output() onFilterChange: EventEmitter<Query> = new EventEmitter();

  readonly urlFront = '/' + Route.FRONT;
  readonly urlScenes = '/' + Route.SCENES;
  readonly urlScene = '/' + Route.SCENE;
  readonly urlRawdata = '/' + Route.RAWDATA;
  readonly urlPivot = '/' + Route.PIVOT;
  readonly urlGrid = '/' + Route.GRID;
  readonly urlFlex = '/' + Route.FLEX;

  currURL: string;
  scene: Scene;
  showFullTextFilter: boolean;
  showRangeFilters: boolean;
  fullTextFilter = '';
  propertyFilters: PropertyFilter[] = [];
  rangeFilters: NumberRangeFilter[] = [];

  private propertyFilterValidator: PropertyFilterValidator;
  private justNavigatedToParentView: boolean;

  constructor(public router: Router, private dbService: DBService, private dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.currURL = '/' + this.route;
    this.scene = this.dbService.getActiveScene();
    if (this.scene) {
      this.propertyFilterValidator = new PropertyFilterValidator(this.scene.columns);
      this.listenOnNavigationEvents();
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
  }

  retainInitialFilters(): void {
    if (this.query) {
      this.fullTextFilter = this.query.getFullTextFilter();
      this.propertyFilters = this.query.getPropertyFilters();
      this.query.getValueRangeFilters().forEach(f => {
        const column = this.scene.columns.find(c => c.name === f.name);
        this.addRangeFilter(column, f.valueRange, f.inverted);
      })
    }
  }

  showSceneDetails(sceneID: string): void {
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
    return column && DataTypeUtils.isNumeric(column.dataType);
  }

  iconOf(dataType: DataType): string {
    return DataTypeUtils.iconOf(dataType);
  }

  canAddValueFilter(column: Column) {
    if (column.dataType === DataType.TIME) {
      return this.propertyFilters.find(f => f.name === column.name) === undefined;
    }
    return true;
  }

  addRangeFilter(column: Column, selValueRange: ValueRange, inverted: boolean): void {
    this.dbService.numberRangeOf(column)
      .then(vr => {
        if (column.dataType === DataType.TIME) {
          this.rangeFilters.push(new TimeRangeFilter(column, vr.min, vr.max, selValueRange, inverted));
        } else {
          this.rangeFilters.push(new NumberRangeFilter(column, vr.min, vr.max, selValueRange, inverted));
        }
        this.showRangeFilters = true;
      });
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
    this.refreshEntries();
  }

  removeRangeFilter(rangeFilter: NumberRangeFilter): void {
    ArrayUtils.removeElement(this.rangeFilters, rangeFilter);
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
