import { SimulationNodeDatum } from 'd3';

export interface GraphNode extends SimulationNodeDatum {
   parent: GraphNode;
   group: number;
   name: string; // column name or time unit
   value: string | number;
   info: string; // i.e. count
}
