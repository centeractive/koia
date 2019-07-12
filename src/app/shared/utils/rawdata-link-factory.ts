import { Route } from '../model/route.enum';
import { Operator } from '../model/operator.enum';
import { PropertyFilter } from '../model/property-filter';
import { Query } from '../model/query';
import { ElementContext } from '../model/element-context';
import { DateTimeUtils } from './date-time-utils';
import { CommonUtils } from './common-utils';
import { GraphNode, GraphContext, DataType, Column } from '../model';
import { GraphUtils } from 'app/graph/graph-utils';
import { JSQueryFactory } from '../services/backend/jsonserver/js-query-factory';
import { CouchDBConstants } from '../services/backend/couchdb/couchdb-constants';

export class RawDataLinkFactory {

   /**
    * creates a raw data link for a single entry identified by its ID
    *
    * @returns an encoded URL to be used for showing raw data matching the specified criteria
    */
   static createIDLink(id: number): string {
      const query = new Query();
      query.setPropertyFilter(new PropertyFilter(CouchDBConstants._ID, Operator.EQUAL, id.toString()));
      return CommonUtils.encodeURL('/' + Route.RAWDATA + new JSQueryFactory().create(query));
   }

   /**
    * creates a raw data link for a graph node
    *
    * @returns an encoded URL to be used for showing raw data matching the graph node
    */
   static createGraphNodeLink(graphNode: GraphNode, context: GraphContext): string {
      const columnNames = GraphUtils.collectNonTimeColumnNames(graphNode, context);
      const columnValues = columnNames.map(c => GraphUtils.findColumnValue(graphNode, c));
      if (columnValues.find(v => v === PropertyFilter.EMPTY)) {
         alert(PropertyFilter.EMPTY + ' search criteria is not implemented.\nTherefore, contextual data cannot be requested from server.');
         return undefined;
      }
      if (context.groupByColumns.find(c => c.dataType === DataType.TIME) !== undefined) {
         const timeColumns = context.groupByColumns.filter(c => c.dataType === DataType.TIME);
         const startTimes = timeColumns.map(c => GraphUtils.findColumnValue(graphNode, CommonUtils.labelOf(c, c.groupingTimeUnit)));
         return RawDataLinkFactory.createTimeUnitLink(context, timeColumns, startTimes, columnNames, columnValues);
      } else {
         return RawDataLinkFactory.createLink(context.query, columnNames, columnValues);
      }
   }

   /**
    * creates a raw data link for data that is potentially grouped by one or multiple time columns
    *
    * @param context element context
    * @param timeColumn time columns
    * @param startTimes start time (timeunit lower boundary) belonging to individual time columns
    * @param columnNames columns names (must not include 'Time' column)
    * @param columnValues column values matching the specified column names, Operator.EQUAL is applied for individual
    * column names and their values
    * @returns an encoded URL to be used for showing raw data matching the specified criteria
    */
   static createTimeUnitLink(context: ElementContext, timeColumns: Column[], startTimes: number[], columnNames: string[],
      columnValues: any[]): string {
      const query = context.query.clone();
      for (let i = 0; i < timeColumns.length; i++) {
         const timeStart = Math.max(startTimes[i], context.query.getTimeStart(timeColumns[i].name) || 0);
         let timeEnd = DateTimeUtils.addTimeUnits(timeStart, 1, timeColumns[i].groupingTimeUnit);
         timeEnd = Math.min(timeEnd, context.query.getTimeEnd(timeColumns[i].name) || Number.MAX_VALUE);
         query.setTimeStart(timeColumns[i].name, timeStart);
         query.setTimeEnd(timeColumns[i].name, timeEnd);
      };
      return this.createLink(query, columnNames, columnValues);
   }

   /**
    * creates a raw data link out of the base query and additional attributes
    *
    * @param baseQuery base query that may serve additional full text filter and propertiy filters
    * @param columnNames columns names (must not include time columns)
    * @param columnValues column values matching the specified column names, Operator.EQUAL is applied for individual
    * column names and their values
    * @returns an encoded URL to be used for showing raw data matching the specified criteria
    */
   static createLink(baseQuery: Query, columnNames: string[], columnValues: any[]): string {
      const query = new Query();
      query.setFullTextFilter(baseQuery.getFullTextFilter());
      for (const propertyFilter of baseQuery.getPropertyFilters()) {
         query.addPropertyFilter(propertyFilter.clone());
      }
      for (let i = 0; i < columnNames.length; i++) {
         query.addPropertyFilter(new PropertyFilter(columnNames[i], Operator.EQUAL, columnValues[i]));
      }
      return CommonUtils.encodeURL('/' + Route.RAWDATA + new JSQueryFactory().create(query));
   }
}
