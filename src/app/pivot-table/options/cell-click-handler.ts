import { Column, PropertyFilter, Operator, TimeUnit, DataType, Query } from 'app/shared/model';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb';
import { ColumnNameConverter, DateTimeUtils } from 'app/shared/utils';
import { RawDataRevealService } from 'app/shared/services';
import { ValueRangeConverter } from 'app/shared/value-range/value-range-converter';
import { ValueGrouping } from 'app/shared/value-range/model';

export class CellClickHandler {

  private static readonly TOTAL_CELL_CLASSES = ['pvtTotal', 'pvtGrandTotal'];

  constructor(private rawDataRevealService: RawDataRevealService) { }

  /**
   * reveals the raw data that is represented by the pivot table cell, a mouse click was made on.
   *
   * TODO: find out if pivot table is locally filtered.
   * - When locally filtered, we must request raw data of total cells by IDs to obtain correct data.
   * - Requesting raw data by IDs is slow and results in raw data tables with no visible data filters.
   */
  onCellClicked(columns: Column[], valueGroupings: ValueGrouping[], mouseEvent: any, filters: Object, pivotData: any) {
    const pivotTableLocallyFiltered = false;
    if (this.isTotalCell(mouseEvent) && pivotTableLocallyFiltered) {
      this.revealRawDataByIDs(pivotData, filters);
    } else {
      this.revealRawDataByFilters(filters, columns, valueGroupings);
    }
  }

  private isTotalCell(mouseEvent: any) {
    for (const totalCellClass of CellClickHandler.TOTAL_CELL_CLASSES) {
      if (mouseEvent.srcElement.classList.contains(totalCellClass)) {
        return true;
      }
    }
    return false;
  }

  private revealRawDataByIDs(pivotData: any, filters: Object) {
    const itemIDs: string[] = [];
    pivotData.forEachMatchingRecord(filters, (item) => itemIDs.push(item[CouchDBConstants._ID]));
    if (itemIDs.length > 0) {
      this.rawDataRevealService.ofIDs(itemIDs);
    }
  }

  private revealRawDataByFilters(filters: Object, columns: Column[], valueGroupings: ValueGrouping[]) {
    const query = new Query();
    for (const filter of Object.keys(filters)) {
      const columnName = ColumnNameConverter.toColumnName(filter);
      const column = columns.find(c => c.name === columnName);
      this.addFilters(query, column, valueGroupings, filters[filter]);
    }
    this.rawDataRevealService.show(query);
  }

  private addFilters(query: Query, column: Column, valueGroupings: ValueGrouping[], filterValue: any) {
    const valueGrouping = valueGroupings.find(vg => vg.columnName === column.name);
    if (valueGrouping) {
      this.addValueGroupingFilter(query, column, filterValue);
    } else if (filterValue === 'null') {
      query.addPropertyFilter(new PropertyFilter(column.name, Operator.EMPTY, '', column.dataType));
    } else if (column.dataType === DataType.TIME && column.groupingTimeUnit !== TimeUnit.MILLISECOND) {
      this.addTimerRangeFilter(query, column, filterValue);
    } else {
      query.addPropertyFilter(new PropertyFilter(column.name, Operator.EQUAL, filterValue, column.dataType));
    }
  }

  private addValueGroupingFilter(query: Query, column: Column, filterValue: any): void {
    if (filterValue === ValueRangeConverter.EMPTY) {
      query.addPropertyFilter(new PropertyFilter(column.name, Operator.EMPTY, '', column.dataType));
    } else {
      query.addValueRangeFilter(column.name, ValueRangeConverter.toMinValue(filterValue), ValueRangeConverter.toMaxValue(filterValue));
    }
  }

  private addTimerRangeFilter(query: Query, column: Column, filterValue: any) {
    const ngFormat = DateTimeUtils.ngFormatOf(column.groupingTimeUnit);
    const timeStart = DateTimeUtils.parseDate(filterValue, ngFormat).getTime();
    const timeEnd = timeStart + DateTimeUtils.toMilliseconds(1, column.groupingTimeUnit);
    query.addValueRangeFilter(column.name, timeStart, timeEnd);
  }
}
