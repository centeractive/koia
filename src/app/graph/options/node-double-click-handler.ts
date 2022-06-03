import { RawDataRevealService } from 'app/shared/services';
import { PropertyFilter, DataType, Operator, Query, Column } from 'app/shared/model';
import { GraphNode, GraphContext } from 'app/shared/model/graph';
import { GraphUtils } from './graph-utils';
import { ColumnNameConverter } from 'app/shared/utils';

export class NodeDoubleClickHandler {

   constructor(private rawDataRevealService: RawDataRevealService) { }

   /**
    * displays raw data of the specified graph node
    */
   onNodeDoubleClicked(graphNode: GraphNode, context: GraphContext): void {
      const query = context.query.clone();
      const columnNames: string[] = [];
      const columnValues: any[] = [];
      GraphUtils.collectNonTimeColumnNames(graphNode, context).forEach(c => {
         const value = GraphUtils.findColumnValue(graphNode, c);
         if (value === PropertyFilter.EMPTY_VALUE) {
            query.addPropertyFilter(new PropertyFilter(c, Operator.EMPTY, ''));
         } else {
            columnNames.push(c);
            columnValues.push(value);
         }
      });
      this.revealRawData(graphNode, query, context.groupByColumns, columnNames, columnValues, context);
   }

   private revealRawData(graphNode: GraphNode, query: Query, groupByColumns: Column[], columnNames: string[], columnValues: any[],
      context: GraphContext) {
      if (groupByColumns.find(c => c.dataType === DataType.TIME) !== undefined) {
         const timeColumns = groupByColumns.filter(c => c.dataType === DataType.TIME);
         const startTimes = timeColumns.map(c => GraphUtils.findColumnValue(graphNode, ColumnNameConverter.toLabel(c, c.groupingTimeUnit)));
         this.rawDataRevealService.ofTimeUnit(query, timeColumns, startTimes, columnNames, columnValues, context);
      } else {
         this.rawDataRevealService.ofQuery(query, columnNames, columnValues, context);
      }
   }
}
