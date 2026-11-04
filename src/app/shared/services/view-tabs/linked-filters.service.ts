import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Query, Route } from '../../model';
import { LinkedFilters } from '../../model/view-config';
import { QueryUtils } from '../../utils/query-utils';
import { queryDefToQuery } from '../view-persistence/filter/filter-to-query-converter';
import { filtersOf, withoutPendingKey } from './linked-filters';
import { ViewTabsService } from './view-tabs.service';

/**
 * shares the filters among all tabs of the active scene; a view takes the linked filters when it is created or activated
 */
@Injectable({
   providedIn: 'root'
})
export class LinkedFiltersService {

   private applied = new Set<string>();
   private appliedOf: LinkedFilters;

   constructor(private viewTabsService: ViewTabsService) { }

   get ready(): boolean {
      return this.viewTabsService.ready;
   }

   get loaded$(): Observable<void> {
      return this.viewTabsService.loaded$;
   }

   isLinked(): boolean {
      const linkedFilters = this.viewTabsService.linkedFilters;
      return !!linkedFilters && !linkedFilters.pendingKeys;
   }

   /**
    * @param key the key of the view showing the filters (tab id, 'rawdata' for raw data)
    */
   link(query: Query, key: string): void {
      this.viewTabsService.setLinkedFilters({ query: filtersOf(query) });
      this.appliedKeys().add(key);
   }

   update(query: Query, key: string): void {
      if (this.isLinked() && !QueryUtils.areFiltersEqual(query, queryDefToQuery(this.viewTabsService.linkedFilters.query))) {
         this.link(query, key);
      }
   }

   /**
    * views that do not show the linked filters yet still take them over once they are created or activated
    */
   unlink(): void {
      const linkedFilters = this.viewTabsService.linkedFilters;
      const applied = this.appliedKeys();
      const pendingKeys = [Route.RAWDATA.toString(), ...this.viewTabsService.tabs.map(t => t.id)].filter(k => !applied.has(k));
      this.viewTabsService.setLinkedFilters(pendingKeys.length ? { ...linkedFilters, pendingKeys } : undefined);
   }

   /**
    * @returns the filters the view of the specified key has to show, undefined if it keeps its own filters
    */
   takeFilters(key: string): Query | undefined {
      const linkedFilters = this.viewTabsService.linkedFilters;
      if (!linkedFilters) {
         return undefined;
      }
      if (linkedFilters.pendingKeys) {
         if (!linkedFilters.pendingKeys.includes(key)) {
            return undefined;
         }
         this.viewTabsService.setLinkedFilters(withoutPendingKey(linkedFilters, key));
      } else {
         this.appliedKeys().add(key);
      }
      return queryDefToQuery(linkedFilters.query);
   }

   private appliedKeys(): Set<string> {
      const linkedFilters = this.viewTabsService.linkedFilters;
      if (linkedFilters !== this.appliedOf) {
         this.appliedOf = linkedFilters;
         this.applied = new Set();
      }
      return this.applied;
   }
}
