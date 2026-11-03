import { Query } from '../../model';
import { LinkedFilters } from '../../model/view-config';
import { QueryDef } from '../../model/view-config/query/query-def.type';
import { queryToQueryDef } from '../view-persistence/filter/query-to-filter-converter';

/**
 * @returns the filters of the query, without its sort and page definition
 */
export function filtersOf(query: Query): QueryDef {
   const filters = query.clone();
   filters.clearSort();
   filters.clearPageDefinition();
   return queryToQueryDef(filters);
}

/**
 * @returns the linked filters without the pending key, undefined once no key is pending anymore
 */
export function withoutPendingKey(linkedFilters: LinkedFilters, key: string): LinkedFilters | undefined {
   const pendingKeys = linkedFilters.pendingKeys.filter(k => k !== key);
   return pendingKeys.length ? { ...linkedFilters, pendingKeys } : undefined;
}
