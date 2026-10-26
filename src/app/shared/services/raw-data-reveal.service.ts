import { Injectable, NgZone } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { RawDataDialogComponent, RawDataDialogData } from 'app/raw-data/raw-data-dialog.component';
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
   * @param startTimes start time (timeunit lower boundary, the upper boundary is excluded) belonging to individual time columns,
   * [[undefined]] or [[null]] for missing time
   * @param columnNames columns names (must not include 'Time' column)
   * @param columnValues column values matching the specified column names, Operator.EQUAL is applied for individual
   * column names and their values
   * @param explainBase the rows the revealed rows are compared with when explaining them
   */
  ofTimeUnit(baseQuery: Query, timeColumns: Column[], startTimes: number[], columnNames: string[],
    columnValues: unknown[], context: ElementContext, explainBase = baseQuery): void {
    const query = baseQuery.clone();
    for (let i = 0; i < timeColumns.length; i++) {
      const timeStart = startTimes[i];
      const timeUnit = timeColumns[i].groupingTimeUnit;
      if (PropertyFilter.isEmptyValue(timeStart)) {
        query.addPropertyFilter(new PropertyFilter(timeColumns[i].name, Operator.EMPTY, '', timeColumns[i].dataType));
      } else if (timeUnit) {
        query.addValueRangeFilter(timeColumns[i].name, timeStart, DateTimeUtils.addTimeUnits(timeStart, 1, timeUnit), true);
      } else {
        query.addValueRangeFilter(timeColumns[i].name, timeStart, timeStart);
      }
    }
    this.ofQuery(query, columnNames, columnValues, context, explainBase);
  }

  /**
   * displays raw data out of the base query and additional attributes
   *
   * @param baseQuery base query that may serve additional full text filter and propertiy filters
   * @param columnNames columns names (must not include time columns)
   * @param columnValues column values matching the specified column names, Operator.EQUAL is applied for individual
   * column names and their values
   * @param explainBase the rows the revealed rows are compared with when explaining them
   */
  ofQuery(baseQuery: Query, columnNames: string[], columnValues: unknown[], context: ElementContext, explainBase = baseQuery): void {
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
      } else if (PropertyFilter.isEmptyValue(columnValues[i])) {
        query.addPropertyFilter(new PropertyFilter(columnNames[i], Operator.EMPTY, '', dataType));
      } else {
        query.addPropertyFilter(new PropertyFilter(columnNames[i], Operator.EQUAL, columnValues[i] as string | number | boolean, dataType));
      }
    }
    this.show(query, explainBase);
  }

  /**
   * @param explainBase the rows the revealed rows are compared with when explaining them, absent if they cannot be explained
   * @see https://stackoverflow.com/a/56508410/2358409
   */
  show(query: Query, explainBase?: Query): void {
    const data: RawDataDialogData = {
      query: new QuerySanitizer(query).sanitize(),
      explainBase: explainBase ? new QuerySanitizer(explainBase).sanitize() : undefined
    };
    this.zone.run(() => {
      this.dialogService.open(RawDataDialogComponent, {
        data,
        panelClass: 'dialog-container',
        maxWidth: 'calc(100vw - 40px)',
        enterAnimationDuration: 1,
        exitAnimationDuration: 1
      });
    });
  }
}
