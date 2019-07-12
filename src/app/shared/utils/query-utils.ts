import { Params } from '@angular/router';
import { Query } from '../model/query';
import { ParamOp } from '../model/param-op.enum';
import { PropertyFilter } from '../model/property-filter';
import { Operator } from '../model/operator.enum';

export class QueryUtils {

   /**
    * TODO: property filters must be checked differently since thay may appear in different order
    */
   static isFilterIdentical(query: Query, otherQuery: Query): boolean {
      return query.getFullTextFilter() === otherQuery.getFullTextFilter() && //
         JSON.stringify(query.getPropertyFilters()) === JSON.stringify(otherQuery.getPropertyFilters());
   }

   static queryFromParams(params: Params): Query {
      const query = new Query;
      if (params) {
         Object.keys(params).forEach(name => QueryUtils.addParameter(query, name, params[name]));
      }
      return query;
   }

   private static addParameter(query: Query, name: string, value: string | number) {
      switch (name) {
         case 'q':
            query.setFullTextFilter(<string>value);
            break;
         default:
            query.addPropertyFilter(QueryUtils.createPropertyFilter(name, value));
            break;
      }
   }

   private static createPropertyFilter(paramName: string, paramValue: string | number): PropertyFilter {
      let operator = Operator.EQUAL;
      const empty = '';
      if (paramName.endsWith(ParamOp._LIKE)) {
         paramName = paramName.replace(ParamOp._LIKE, empty);
         operator = Operator.CONTAINS;
      } else if (paramName.endsWith(ParamOp._NE)) {
         paramName = paramName.replace(ParamOp._NE, empty);
         operator = Operator.NOT_EQUAL;
      } else if (paramName.endsWith(ParamOp._LT)) {
         paramName = paramName.replace(ParamOp._LT, empty);
         operator = Operator.LESS_THAN;
      } else if (paramName.endsWith(ParamOp._LTE)) {
         paramName = paramName.replace(ParamOp._LTE, empty);
         operator = Operator.LESS_THAN_OR_EQUAL;
      } else if (paramName.endsWith(ParamOp._GTE)) {
         paramName = paramName.replace(ParamOp._GTE, empty);
         operator = paramValue === empty ? Operator.NOT_EMPTY : Operator.GREATER_THAN_OR_EQUAL;
      } else if (paramName.endsWith(ParamOp._GT)) {
         paramName = paramName.replace(ParamOp._GT, empty);
         operator = Operator.GREATER_THAN;
      }
      return new PropertyFilter(paramName, operator, paramValue);
   }
}
