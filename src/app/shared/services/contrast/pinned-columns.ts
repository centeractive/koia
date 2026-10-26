import { Query } from 'app/shared/model';
import { QuerySanitizer } from 'app/shared/utils';

/**
 * @returns the names of the columns whose applicable filters differ between both queries, the values of these columns are
 * determined by the selection itself and are therefore not worth explaining. Property filters are compared by name, operator
 * and value only since filters of charts and graphs lack the data type. The full text filter is not related to any column.
 */
export function pinnedColumnsOf(selection: Query, base: Query): Set<string> {
   const selectionConditions = conditionsOf(selection);
   const baseConditions = conditionsOf(base);
   const pinned = new Set<string>();
   for (const name of new Set([...selectionConditions.keys(), ...baseConditions.keys()])) {
      if (!sameConditions(selectionConditions.get(name), baseConditions.get(name))) {
         pinned.add(name);
      }
   }
   return pinned;
}

function conditionsOf(query: Query): Map<string, Set<string>> {
   const sanitized = new QuerySanitizer(query).sanitize();
   const conditions = new Map<string, Set<string>>();
   const add = (name: string, condition: string) => {
      if (!conditions.has(name)) {
         conditions.set(name, new Set());
      }
      conditions.get(name).add(condition);
   };
   sanitized.getPropertyFilters()
      .filter(f => f.isApplicable())
      .forEach(f => add(f.name, JSON.stringify(['p', f.operator, f.value])));
   sanitized.getValueRangeFilters()
      .filter(f => f.isApplicable())
      .forEach(f => add(f.name, JSON.stringify(['r', f.valueRange.min, f.valueRange.max, !!f.valueRange.maxExcluding, f.inverted])));
   return conditions;
}

function sameConditions(c1: Set<string>, c2: Set<string>): boolean {
   if (!c1 || !c2) {
      return false;
   }
   return c1.size === c2.size && [...c1].every(c => c2.has(c));
}
