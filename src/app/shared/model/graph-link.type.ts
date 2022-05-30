import { GraphNode } from '.';

export interface GraphLink {
    source: GraphNode;
    target: GraphNode;
}