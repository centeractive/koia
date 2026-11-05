import { Column, Query } from 'app/shared/model';
import { RawDataRevealService } from 'app/shared/services';
import { ValueGrouping } from 'app/shared/value-range/model';
import { QueryEnhancer } from './query-enhancer';
import { QueryProvider } from './query-provider';

export class CellClickHandler {

  constructor(private columns: Column[], private baseQueryProvider: QueryProvider, private rawDataRevealService: RawDataRevealService) { }

  /**
   * reveals the raw data PivotTable.js aggregated into the clicked cell
   *
   * @param filters values of the row and column attributes the clicked cell pins
   * @param exclusions values excluded per attribute in the pop-up filter menus
   */
  onCellClicked(valueGroupings: ValueGrouping[], filters: object, exclusions: object): void {
    const queryEnhancer = new QueryEnhancer(this.baseQueryProvider.provide().clone(), this.columns, valueGroupings, filters);
    queryEnhancer.addBasicFilters();
    queryEnhancer.addFiltersForValueChoices(exclusions);
    this.rawDataRevealService.reveal(queryEnhancer.getQuery(), this.columns, this.explainBase(valueGroupings, exclusions));
  }

  /**
   * the rows the pivot table aggregates, i.e. the base query reduced by the exclusions of all attributes (no attribute is pinned),
   * the rows of any cell are a subset of them
   */
  private explainBase(valueGroupings: ValueGrouping[], exclusions: object): Query {
    const baseEnhancer = new QueryEnhancer(this.baseQueryProvider.provide().clone(), this.columns, valueGroupings, {});
    baseEnhancer.addFiltersForValueChoices(exclusions);
    return baseEnhancer.getQuery();
  }
}
