export interface GraphNode {
   parent: GraphNode;
   group: number;
   name: string; // column name or time unit
   value: string | number;
   info: string; // i.e. count
}
