import { GraphNode, GraphContext, Column, DataType } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils/date-time-utils';
import { CommonUtils } from 'app/shared/utils/common-utils';

export class GraphUtils {

   static createDisplayText(graphNode: GraphNode, context: GraphContext): string {
      const info = graphNode.info ? ' (' + graphNode.info + ')' : '';
      if (graphNode.parent) {
         return graphNode.name + ': ' + GraphUtils.formattedValueOf(graphNode, context) + info;
      }
      return info;
   }

   /**
    * find the value of the graph node with given name recursively within the specified graph node and its parent nodes
    *
    * @returns the value or en empty tring if no matching node was found
    */
   static findColumnValue(graphNode: GraphNode, nodeName: string): any {
      if (graphNode.name === nodeName) {
         return graphNode.value;
      } else if (graphNode.parent) {
         return this.findColumnValue(graphNode.parent, nodeName);
      }
      return '';
   }

   /**
    * collects all non-time column names recursively within the specified graph node and its parent nodes
    *
    * @returns an array with matching column names or an empty array if no matching column was found
    */
   static collectNonTimeColumnNames(graphNode: GraphNode, context: GraphContext): string[] {
      if (graphNode.parent && graphNode.parent.name) {
         const columnNames = this.collectNonTimeColumnNames(graphNode.parent, context);
         if (!this.findCorrespondingTimeColumn(graphNode.name, context)) {
            columnNames.push(graphNode.name);
         }
         return columnNames;
      }
      if (this.findCorrespondingTimeColumn(graphNode.name, context)) {
         return [];
      }
      return graphNode.name === '' ? [] : [graphNode.name];
   }

   static formattedValueOf(graphNode: GraphNode, context: GraphContext): any {
      let value: any = graphNode.value;
      const timeColumn = this.findCorrespondingTimeColumn(graphNode.name, context);
      if (timeColumn) {
         value = DateTimeUtils.formatTime(<number>value, timeColumn.groupingTimeUnit);
      }
      return value;
   }

   private static findCorrespondingTimeColumn(columnName: string, context: GraphContext): Column {
      for (const column of context.groupByColumns) {
         if (column.dataType === DataType.TIME && CommonUtils.labelOf(column, column.groupingTimeUnit) === columnName) {
            return column;
         }
      }
      return undefined;
   }
}
