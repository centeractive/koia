import { Column } from 'app/shared/model';
import { RawDataRevealService } from 'app/shared/services';
import { ValueGrouping } from 'app/shared/value-range/model';
import { QueryProvider } from './query-provider';
import { QueryEnhancer } from './query-enhancer';

export class CellClickHandler {

  private static readonly TOTAL_CELL_CLASSES = ['pvtTotal', 'pvtGrandTotal'];

  constructor(private columns: Column[], private baseQueryProvider: QueryProvider, private rawDataRevealService: RawDataRevealService) { }

  /**
   * reveals the raw data represented by the pivot table cell, a mouse click was made on
   */
  onCellClicked(valueGroupings: ValueGrouping[], mouseEvent: any, filters: object, exclusions: object, inclusions: object,
    pivotData: object): void {
    this.revealRawData(filters, exclusions, inclusions, pivotData, valueGroupings, this.isTotalCell(mouseEvent));
  }

  private isTotalCell(mouseEvent: any) {
    for (const totalCellClass of CellClickHandler.TOTAL_CELL_CLASSES) {
      if (mouseEvent.srcElement.classList.contains(totalCellClass)) {
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
    this.rawDataRevealService.show(queryEnhancer.getQuery());
  }
}
