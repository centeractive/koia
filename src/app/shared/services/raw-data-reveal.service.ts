import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { RawDataDialogComponent } from 'app/raw-data/raw-data-dialog.component';
import { Query, Operator, PropertyFilter, Column, DataType, Route } from '../model';
import { DateTimeUtils, CommonUtils, ArrayUtils } from '../utils';
import { CouchDBConstants } from './backend/couchdb';
import { Router } from '@angular/router';
import { JSQueryFactory } from './backend/jsonserver';

@Injectable({
  providedIn: 'root'
})
export class RawDataRevealService {

  private useDialog = true;

  constructor(private router: Router, private dialogService: MatDialog) { }

  /**
   * @param useDialog [[true]] to have raw data shown in a dialog (default), [[false]] to have it shown in the standard raw data view
   */
  setUseDialog(useDialog: boolean) {
    this.useDialog = useDialog;
  }

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
    columnValues: any[]): void {
    const query = baseQuery.clone();
    for (let i = 0; i < timeColumns.length; i++) {
      const timeStart = startTimes[i];
      const timeEnd = DateTimeUtils.addTimeUnits(timeStart, 1, timeColumns[i].groupingTimeUnit);
      const valueRangeFilter = baseQuery.findValueRangeFilter(timeColumns[i].name);
      if (valueRangeFilter) {
        const valueRange = valueRangeFilter.valueRange;
        valueRange.min = Math.max(timeStart, valueRange.min || Number.MIN_VALUE);
        valueRange.max = Math.min(timeEnd, valueRange.max || Number.MAX_VALUE);
      } else {
        query.addValueRangeFilter(timeColumns[i].name, timeStart, timeEnd);
      }
    };
    this.ofQuery(query, columnNames, columnValues);
  }

  /**
   * displays raw data out of the base query and additional attributes
   *
   * @param baseQuery base query that may serve additional full text filter and propertiy filters
   * @param columnNames columns names (must not include time columns)
   * @param columnValues column values matching the specified column names, Operator.EQUAL is applied for individual
   * column names and their values
   */
  ofQuery(baseQuery: Query, columnNames: string[], columnValues: any[]): void {
    const query = baseQuery.clone();
    for (let i = 0; i < columnNames.length; i++) {
      query.addPropertyFilter(new PropertyFilter(columnNames[i], Operator.EQUAL, columnValues[i]));
    }
    this.show(query);
  }

  show(query: Query): void {
    if (this.useDialog) {
      this.dialogService.open(RawDataDialogComponent, { data: query, panelClass: 'dialog-container' });
    } else {
      const link = CommonUtils.encodeURL('/' + Route.RAWDATA + new JSQueryFactory().create(query));
      this.router.navigateByUrl(link);
    }
  }
}
