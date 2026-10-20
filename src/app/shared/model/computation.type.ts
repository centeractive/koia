import { ComputeOperator } from './compute-operator.enum';

export interface Computation {
   leftColumn: string;
   operator: ComputeOperator;
   rightColumn: string;
}
