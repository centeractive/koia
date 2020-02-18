import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RawDataDialogComponent } from 'app/raw-data/raw-data-dialog.component';
import { Query, Operator, PropertyFilter, Column, DataType, ElementContext } from '../model';
import { DateTimeUtils, QuerySanitizer } from '../utils';
import { CouchDBConstants } from './backend/couchdb';

@Injectable({
  providedIn: 'root'
})
export class RawDataRevealService {

  constructor(private dialogService: MatDialog) { }

  /**
   * displays raw data of a single entry identified by its ID
   */
  ofID(id: string): void {
    this.show(new Query(new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, id, DataType.TEXT)));
  }

  /**
   * displays raw data that is potentially grouped by one or multiple time columns
   *
   * @param baseQuery base query
   * @param timeColumn time columns
   * @param startTimes start time (timeunit lower boundary) belonging to individual time columns
   * @param columnNames columns names (must not include 'Time' column)
   * @param columnValues column values matching the specified column names, Operator.EQUAL is applied for individual
   * column names and their values
   */
  ofTimeUnit(baseQuery: Query, timeColumns: Column[], startTimes: number[], columnNames: string[],
    columnValues: any[], context: ElementContext): void {
    const query = baseQuery.clone();
    for (let i = 0; i < timeColumns.length; i++) {
      const timeStart = startTimes[i];
      const timeEnd = DateTimeUtils.addTimeUnits(timeStart, 1, timeColumns[i].groupingTimeUnit);
      query.addValueRangeFilter(timeColumns[i].name, timeStart, timeEnd);
    };
    this.ofQuery(query, columnNames, columnValues, context);
  }

  /**
   * displays raw data out of the base query and additional attributes
   *
   * @param baseQuery base query that may serve additional full text filter and propertiy filters
   * @param columnNames columns names (must not include time columns)
   * @param columnValues column values matching the specified column names, Operator.EQUAL is applied for individual
   * column names and their values
   */
  ofQuery(baseQuery: Query, columnNames: string[], columnValues: any[], context: ElementContext): void {
    const query = baseQuery.clone();
    for (let i = 0; i < columnNames.length; i++) {
      const dataType = context.columns.find(c => c.name === columnNames[i]).dataType;
      if (dataType === DataType.TIME) {
        query.addValueRangeFilter(columnNames[i], columnValues[i], columnValues[i]);
      } else {
        query.addPropertyFilter(new PropertyFilter(columnNames[i], Operator.EQUAL, columnValues[i]));
      }
    }
    this.show(query);
  }

  show(query: Query): void {
    this.dialogService.open(RawDataDialogComponent, { data: new QuerySanitizer(query).sanitize(), panelClass: 'dialog-container' });
  }
}
