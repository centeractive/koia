import { DataFrame, IDataFrame } from 'data-forge';
import { GraphContext, Column, PropertyFilter, GraphNode, GraphLink, DataType } from '../model';
import { DateTimeUtils, ColumnNameConverter } from 'app/shared/utils';
import { Injectable } from '@angular/core';

export interface GraphData {
   nodes: GraphNode[];
   links: GraphLink[];
}

/**
 * d3-force graph data provider service
 *
 * @see https://github.com/d3/d3-force
 */
@Injectable({
   providedIn: 'root'
})
export class GraphDataService {

   createData(graphContext: GraphContext): GraphData {
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
            const date = DateTimeUtils.toBaseDate(ts, timeColumn.groupingTimeUnit);
            return date ? date.getTime() : undefined;
         }
      });
   }

   /**
    * creates an object tree out of the specified data, grouped by the selected columns
    */
   private createTree(data: Object[], providerContext: ProviderContext): TreeNode {
      if (!providerContext.groupByColumns) {
         return { key: '', values: data.length };
      }
      const groupByColumns = providerContext.groupByColumns.map(c => c.name);
      const rootValues: TreeNode[] = [];
      data.forEach(entry => {
         groupByColumns.reduce((nodes, column, i) => {
            const lastGroupByColumns = i + 1 === groupByColumns.length;
            const value = entry[column] || PropertyFilter.EMPTY_VALUE;
            let node: TreeNode = nodes.find(n => n.key === value);
            if (node) {
               if (lastGroupByColumns) {
                  node.values = (node.values as number) + 1;
               }
            } else {
               node = { key: value, values: lastGroupByColumns ? 1 : [] };
               nodes.push(node);
            }
            return node.values;
         }, rootValues);
      });
      return { key: '', values: rootValues };
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
      const nodeName = this.nodeNameFrom(column);
      return { parent, group, name: nodeName, value, info }
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
   links: GraphLink[] = [];

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