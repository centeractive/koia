import * as _ from 'lodash';
import { Operator, PropertyFilter } from 'app/shared/model';
import { ValueRangeFilter } from 'app/shared/value-range/model';
import { OperatorConverter } from './operator-converter';

/**
 * the filters not matching the rows lacking a value, split for PouchDB, which mishandles several conditions on the same field,
 * into those outside of the '$nor' of MangoQueryBuilder and those it needs inside of it
 */
export class PouchDBFilters {

   private static readonly UPPER_BOUND_OPERATORS = [Operator.LESS_THAN, Operator.LESS_THAN_OR_EQUAL];

   /**
    * operators of the filters on a field that make PouchDB drop the rows lacking it when using its index, or that define '$exists'
    */
   private static readonly LOWER_BOUND_OR_EXISTS_OPERATORS = [Operator.GREATER_THAN, Operator.GREATER_THAN_OR_EQUAL, Operator.EMPTY,
      Operator.NOT_EMPTY];

   /**
    * per operator, the operators on the same field PouchDB merges wrongly with it: it keeps only the last '$eq', '$in', '$nin' or
    * '$exists' of a field and drops the bounds of a field having '$eq'
    */
   private static readonly CONFLICTING_OPERATORS: Record<string, string[]> = {
      $eq: ['$eq', '$gt', '$gte', '$lt', '$lte'], $gt: ['$eq'], $gte: ['$eq'], $lt: ['$eq'], $lte: ['$eq'],
      $in: ['$in'], $nin: ['$nin'], $exists: ['$exists']
   };

   /**
    * the filters outside of the '$nor', where they can use the index of their field:
    * - the first filter of each field and each further one PouchDB merges correctly with all filters of that field already outside;
    * - an inverted range with a single bound not matching the rows lacking a value as its single filter;
    * - a NOT_EMPTY filter ('$exists: true') per field filtered by '$lt' or '$lte' but neither by '$gt', '$gte' nor '$exists', since
    *   the index of a field holds the rows lacking it under null, below any value, and '$gt: null' fails on such an index
    */
   readonly outside: PropertyFilter[];

   /**
    * the filters PouchDB would merge wrongly with a filter outside of the '$nor' on the same field, double negated inside of it
    */
   readonly doubleNegated: PropertyFilter[] = [];

   /**
    * the inverted ranges with two or no bounds or matching the rows lacking a value, whose values the '$nor' excludes
    */
   readonly norRangeFilters: ValueRangeFilter[];

   /**
    * the fields whose missing rows the '$nor' drops: those of the '$nor' ranges not matching these rows and of NOT_EMPTY filters
    * contradicting an EMPTY filter, whose '$exists' PouchDB would merge into the one written last
    */
   readonly missingFieldNames: string[];

   constructor(propertyFilters: PropertyFilter[], invertedRangeFilters: ValueRangeFilter[]) {
      const operatorConverter = new OperatorConverter();
      const mangoOperatorOf = (filter: PropertyFilter) => operatorConverter.toPouchDBMangoOperator(filter.operator);
      const notEmptyFiltersOfEmptyFields = propertyFilters.filter(pf => pf.operator === Operator.NOT_EMPTY &&
         propertyFilters.some(f => f.name === pf.name && f.operator === Operator.EMPTY));
      const [singleBoundRanges, norRanges] = _.partition(invertedRangeFilters, f => !f.orEmpty && f.toPropertyFilters().length === 1);
      const outside: PropertyFilter[] = [];
      for (const filter of [...propertyFilters.filter(pf => !notEmptyFiltersOfEmptyFields.includes(pf)),
         ...singleBoundRanges.flatMap(f => f.toPropertyFilters())]) {
         const conflictingOperators = PouchDBFilters.CONFLICTING_OPERATORS[mangoOperatorOf(filter)] ?? [];
         const conflicts = outside.some(pf => pf.name === filter.name && conflictingOperators.includes(mangoOperatorOf(pf)));
         (conflicts ? this.doubleNegated : outside).push(filter);
      }
      this.outside = [...outside, ...PouchDBFilters.requiredFieldFilters(outside)];
      this.norRangeFilters = norRanges;
      this.missingFieldNames = _.uniq([...norRanges.filter(f => !f.orEmpty), ...notEmptyFiltersOfEmptyFields].map(f => f.name));
   }

   private static requiredFieldFilters(filters: PropertyFilter[]): PropertyFilter[] {
      return _.uniq(filters.filter(pf => PouchDBFilters.UPPER_BOUND_OPERATORS.includes(pf.operator)).map(pf => pf.name))
         .filter(name => !filters.some(pf => pf.name === name && PouchDBFilters.LOWER_BOUND_OR_EXISTS_OPERATORS.includes(pf.operator)))
         .map(name => new PropertyFilter(name, Operator.NOT_EMPTY, ''));
   }
}
