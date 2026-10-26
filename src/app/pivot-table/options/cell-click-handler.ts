import { Column, Query } from 'app/shared/model';
import { RawDataRevealService } from 'app/shared/services';
import { ValueGrouping } from 'app/shared/value-range/model';
import { QueryEnhancer } from './query-enhancer';
import { QueryProvider } from './query-provider';

export class CellClickHandler {

  private static readonly TOTAL_CELL_CLASSES = ['pvtTotal', 'pvtGrandTotal'];

  constructor(private columns: Column[], private baseQueryProvider: QueryProvider, private rawDataRevealService: RawDataRevealService) { }

  /**
   * reveals the raw data represented by the pivot table cell, a mouse click was made on
   */
  onCellClicked(valueGroupings: ValueGrouping[], mouseEvent: MouseEvent, filters: object, exclusions: object, inclusions: object,
    pivotData: object): void {
    this.revealRawData(filters, exclusions, inclusions, pivotData, valueGroupings, this.isTotalCell(mouseEvent));
  }

  private isTotalCell(mouseEvent: MouseEvent) {
    const cell = (mouseEvent.target as Element).closest('td');
    for (const totalCellClass of CellClickHandler.TOTAL_CELL_CLASSES) {
      if (cell.classList.contains(totalCellClass)) {
        return true;
      }
    }
    return false;
  }

  private revealRawData(filters: object, exclusions: object, inclusions: object, pivotData: object, valueGroupings: ValueGrouping[],
    totalColumn: boolean): void {
    const queryEnhancer = new QueryEnhancer(this.baseQueryProvider.provide().clone(), this.columns, valueGroupings, filters);
    queryEnhancer.addBasicFilters();
    if (totalColumn) {
      queryEnhancer.addFiltersForValueChoices(exclusions, inclusions, pivotData);
    }
    this.rawDataRevealService.show(queryEnhancer.getQuery(), this.explainBase(valueGroupings, exclusions, inclusions, pivotData));
  }

  /**
   * the rows the pivot table shows, i.e. the base query reduced by the exclusions of all row and column attributes, an empty
   * filters object is required since exclusions of filter labels are skipped. As today, exclusions of attributes neither used
   * in rows nor columns are not considered. The query of a non-total cell has no exclusions, it's thereby no subset of this
   * base, which the explanation copes with by intersecting both
   */
  private explainBase(valueGroupings: ValueGrouping[], exclusions: object, inclusions: object, pivotData: object): Query {
    const baseEnhancer = new QueryEnhancer(this.baseQueryProvider.provide().clone(), this.columns, valueGroupings, {});
    baseEnhancer.addFiltersForValueChoices(exclusions, inclusions, pivotData);
    return baseEnhancer.getQuery();
  }
}
