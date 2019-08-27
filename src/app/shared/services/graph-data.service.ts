import { DataFrame, IDataFrame } from 'data-forge';
import { GraphContext, Column, PropertyFilter, GraphNode, DataType } from '../model';
import { DateTimeUtils, CommonUtils, ColumnNameConverter } from 'app/shared/utils';
import { Injectable } from '@angular/core';

declare var d3: any;

/**
 * d3-force graph data provider service
 *
 * @see https://github.com/d3/d3-force
 */
@Injectable({
   providedIn: 'root'
})
export class GraphDataService {

   createData(graphContext: GraphContext): Object {
      const providerContext = new ProviderContext(graphContext);
      let dataFrame: IDataFrame<number, any> = new DataFrame(providerContext.entries);
      graphContext.columns.filter(c => c.dataType === DataType.TIME).forEach(c => dataFrame = this.convertTime(dataFrame, c));
      const treeRoot = this.createTree(dataFrame.toArray(), providerContext);
      this.buildGraphData(null, treeRoot, -1, providerContext);
      return { nodes: providerContext.nodes, links: providerContext.links };
   }

   /**
    * TODO: transformSeries may not work when undefined values are present (see solution at ValueRangeGroupingService#groupByValueRanges)
    */
   private convertTime(dataFrame: IDataFrame<number, any>, timeColumn: Column): IDataFrame<number, any> {
      return dataFrame.transformSeries({
         [timeColumn.name]: ts => {
            const date = DateTimeUtils.toDate(ts, timeColumn.groupingTimeUnit);
            return date ? date.getTime() : undefined;
         }
      });
   }

   /**
    * creates an object tree out of the specified data, grouped by the selected columns
    */
   private createTree(data: Object[], providerContext: ProviderContext): TreeNode {
      let nest = d3.nest();
      if (providerContext.groupByColumns) {
         // !!! d3 nest always converts keys to string
         providerContext.groupByColumns.forEach(c => nest.key(entry => entry[c.name] || PropertyFilter.EMPTY_VALUE));
      }
      nest = nest.rollup(v => v.length); // count elements
      return { key: '', values: nest.entries(data) }
   }

   private buildGraphData(parent: GraphNode, treeNode: TreeNode, columnIndex: number, providerContext: ProviderContext): void {
      const column = columnIndex === -1 ? undefined : providerContext.groupByColumns[columnIndex] // -1 is root node
      let graphNode: GraphNode;
      if (Array.isArray(treeNode.values)) {
         graphNode = this.createNode(parent, column, treeNode.key, null, providerContext);
         providerContext.nodes.push(graphNode);
         Array.from(treeNode.values).forEach(child => this.buildGraphData(graphNode, child, columnIndex + 1, providerContext));
      } else {
         graphNode = this.createNode(parent, column, treeNode.key, treeNode.values.toLocaleString(), providerContext)
         providerContext.nodes.push(graphNode);
      }
      if (parent) {
         providerContext.links.push({ source: parent, target: graphNode });
      }
   }

   private createNode(parent: GraphNode, column: Column, value: string, info: string, providerContext: ProviderContext): GraphNode {
      const group = !parent || !parent.parent ? providerContext.group++ : parent.group;
      let columnValue: any = value;
      if (columnValue && columnValue !== PropertyFilter.EMPTY_VALUE &&
         (column.dataType === DataType.NUMBER || column.dataType === DataType.TIME)) {
         columnValue = Number(value); // conversion needed because d3 nest always converts keys to string
      }
      const nodeName = this.nodeNameFrom(column);
      return { parent: parent, group: group, name: nodeName, value: columnValue, info: info }
   }

   private nodeNameFrom(column: Column): string {
      if (column) {
         return column.dataType === DataType.TIME ? ColumnNameConverter.toLabel(column, column.groupingTimeUnit) : column.name;
      }
      return ''; // root node
   }
}

class ProviderContext {
   columns: Column[];
   groupByColumns: Column[];
   entries: Object[];
   group = 0;
   nodes: GraphNode[] = [];
   links: Link[] = [];

   constructor(graphContext: GraphContext) {
      this.columns = graphContext.columns;
      this.groupByColumns = graphContext.groupByColumns;
      this.entries = graphContext.entries;
   }
}

interface TreeNode {
   key: string;
   values: number | TreeNode[];
}

interface Link {
   source: GraphNode;
   target: GraphNode;
}
