import { Injectable, NgZone } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { RawDataDialogComponent } from 'app/raw-data/raw-data-dialog.component';
import { Column, DataType, ElementContext, Operator, PropertyFilter, Query } from '../model';
import { DateTimeUtils, QuerySanitizer } from '../utils';
import { isComputedColumn } from '../utils/column-utils';
import { CouchDBConstants } from './backend/couchdb';
import { LanguageService } from './language/language.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class RawDataRevealService {

  constructor(private dialogService: MatDialog, private zone: NgZone, private bottomSheet: MatBottomSheet,
    private notificationService: NotificationService) { }

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
    columnValues: unknown[], context: ElementContext): void {
    const query = baseQuery.clone();
    for (let i = 0; i < timeColumns.length; i++) {
      const timeStart = startTimes[i];
      const timeUnit = timeColumns[i].groupingTimeUnit;
      const timeEnd = timeUnit ? DateTimeUtils.addTimeUnits(timeStart, 1, timeUnit) : timeStart;
      query.addValueRangeFilter(timeColumns[i].name, timeStart, timeEnd);
    }
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
  ofQuery(baseQuery: Query, columnNames: string[], columnValues: unknown[], context: ElementContext): void {
    const computedColumn = context.columns.find(c => isComputedColumn(c) && columnNames.includes(c.name));
    if (computedColumn) {
      this.zone.run(() => this.notificationService.onWarning(this.bottomSheet,
        LanguageService.instant('computedColumn.noRawData', { column: computedColumn.name })));
      return;
    }
    const query = baseQuery.clone();
    for (let i = 0; i < columnNames.length; i++) {
      const dataType = context.columns.find(c => c.name === columnNames[i]).dataType;
      if (dataType === DataType.TIME) {
        query.addValueRangeFilter(columnNames[i], columnValues[i] as number, columnValues[i] as number);
      } else {
        query.addPropertyFilter(new PropertyFilter(columnNames[i], Operator.EQUAL, columnValues[i] as string | number | boolean));
      }
    }
    this.show(query);
  }

  /**
   * @see https://stackoverflow.com/a/56508410/2358409
   */ 
  show(query: Query): void {    
    this.zone.run(() => {
      this.dialogService.open(RawDataDialogComponent, {
        data: new QuerySanitizer(query).sanitize(),
        panelClass: 'dialog-container',
        maxWidth: 'calc(100vw - 40px)',
        enterAnimationDuration: 1,
        exitAnimationDuration: 1
      });
    });
  }
}
