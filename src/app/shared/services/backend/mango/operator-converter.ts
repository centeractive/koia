import { Operator } from 'app/shared/model';

export class OperatorConverter {

   toMangoOperator(operator: Operator): string {
      switch (operator) {
         case Operator.CONTAINS:
            return '$regex';
         case Operator.LESS_THAN:
            return '$lt';
         case Operator.LESS_THAN_OR_EQUAL:
            return '$lte';
         case Operator.EQUAL:
            return '$eq';
         case Operator.NOT_EQUAL:
            return '$ne';
         case Operator.GREATER_THAN_OR_EQUAL:
            return '$gte';
         case Operator.GREATER_THAN:
            return '$gt';
         case Operator.EMPTY:
            return '$exists';
         case Operator.NOT_EMPTY:
            return '$gt';
         case Operator.ANY_OF:
            return '$in';
         case Operator.NONE_OF:
            return '$nin';
         default:
            throw new Error('operator ' + operator + ' is not yet supported');
      }
   }
}