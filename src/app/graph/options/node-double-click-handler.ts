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
      const columnValues: (string | number)[] = [];
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

   private revealRawData(graphNode: GraphNode, query: Query, groupByColumns: Column[], columnNames: string[], columnValues: (string | number)[],
      context: GraphContext) {
      const level = this.hierarchyLevelOf(graphNode);
      const timeColumns = groupByColumns.slice(0, level).filter(c => c.dataType === DataType.TIME);
      if (timeColumns.length > 0) {
         const startTimes = timeColumns.map(c => GraphUtils.findColumnValue(graphNode, ColumnNameConverter.toLabel(c, c.groupingTimeUnit)) as number);
         this.rawDataRevealService.ofTimeUnit(query, timeColumns, startTimes, columnNames, columnValues, context);
      } else {
         this.rawDataRevealService.ofQuery(query, columnNames, columnValues, context);
      }
   }

   private hierarchyLevelOf(graphNode: GraphNode): number {
      let level = 0;
      while (graphNode.parent) {
         ++level;
         graphNode = graphNode.parent;
      }
      return level;
   }
}
