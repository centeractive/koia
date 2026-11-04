import { Subject } from 'rxjs';
import { DataType, Operator, PropertyFilter, Query, Route } from '../../model';
import { LinkedFilters, TabDef, ViewType } from '../../model/view-config';
import { filtersOf } from './linked-filters';
import { LinkedFiltersService } from './linked-filters.service';
import { ViewTabsService } from './view-tabs.service';

describe('LinkedFiltersService', () => {

   let loaded: Subject<void>;
   let viewTabs: { ready: boolean, loaded$: Subject<void>, tabs: TabDef[], linkedFilters: LinkedFilters, setLinkedFilters: (lf: LinkedFilters) => void };
   let service: LinkedFiltersService;

   beforeEach(() => {
      loaded = new Subject<void>();
      viewTabs = {
         ready: true,
         loaded$: loaded,
         tabs: [tab('tab1'), tab('tab2')],
         linkedFilters: undefined,
         setLinkedFilters: lf => viewTabs.linkedFilters = lf
      };
      vi.spyOn(viewTabs, 'setLinkedFilters');
      service = new LinkedFiltersService(viewTabs as unknown as ViewTabsService);
   });

   it('#ready given tabs ready then is true', () => {
      expect(service.ready).toBe(true);
   });

   it('#loaded$ given tabs loaded then emits', () => {

      // given
      const emitted = vi.fn();
      service.loaded$.subscribe(emitted);

      // when
      loaded.next();

      // then
      expect(emitted).toHaveBeenCalled();
   });

   it('#isLinked given no linked filters then is false', () => {
      expect(service.isLinked()).toBe(false);
   });

   it('#isLinked given pending keys then is false', () => {

      // given
      viewTabs.linkedFilters = { query: filtersOf(levelQuery('ERROR')), pendingKeys: ['tab1'] };

      // then
      expect(service.isLinked()).toBe(false);
   });

   it('#link given query with sort when linked then stores filters without sort and paging', () => {

      // given
      const query = levelQuery('ERROR');
      query.setSort({ active: 'Level', direction: 'desc' });

      // when
      service.link(query, Route.RAWDATA);

      // then
      expect(service.isLinked()).toBe(true);
      expect(viewTabs.linkedFilters).toEqual({ query: filtersOf(levelQuery('ERROR')) });
   });

   it('#update given filters not linked when updated then stores nothing', () => {

      // when
      service.update(levelQuery('ERROR'), 'tab1');

      // then
      expect(viewTabs.setLinkedFilters).not.toHaveBeenCalled();
   });

   it('#update given equal filters when updated then stores nothing', () => {

      // given
      service.link(levelQuery('ERROR'), Route.RAWDATA);
      vi.mocked(viewTabs.setLinkedFilters).mockClear();

      // when
      service.update(levelQuery('ERROR'), 'tab1');

      // then
      expect(viewTabs.setLinkedFilters).not.toHaveBeenCalled();
   });

   it('#update given linked filters when changed then stores the new filters', () => {

      // given
      service.link(levelQuery('ERROR'), Route.RAWDATA);

      // when
      service.update(levelQuery('WARN'), 'tab1');

      // then
      expect(viewTabs.linkedFilters).toEqual({ query: filtersOf(levelQuery('WARN')) });
   });

   it('#takeFilters given not linked then returns undefined', () => {
      expect(service.takeFilters('tab1')).toBeUndefined();
   });

   it('#takeFilters given linked then returns a new query on each call', () => {

      // given
      service.link(levelQuery('ERROR'), Route.RAWDATA);

      // when
      const first = service.takeFilters('tab1');
      const second = service.takeFilters('tab1');

      // then
      expect(first.getPropertyFilters()).toEqual(levelQuery('ERROR').getPropertyFilters());
      expect(second).toEqual(first);
      expect(second).not.toBe(first);
   });

   it('#unlink given raw data and one tab took the filters when unlinked then only the other tab is pending', () => {

      // given
      service.link(levelQuery('ERROR'), Route.RAWDATA);
      service.takeFilters('tab1');

      // when
      service.unlink();

      // then
      expect(viewTabs.linkedFilters).toEqual({ query: filtersOf(levelQuery('ERROR')), pendingKeys: ['tab2'] });
      expect(service.isLinked()).toBe(false);
   });

   it('#unlink given every view took the filters when unlinked then forgets the filters', () => {

      // given
      service.link(levelQuery('ERROR'), Route.RAWDATA);
      service.takeFilters('tab1');
      service.takeFilters('tab2');

      // when
      service.unlink();

      // then
      expect(viewTabs.linkedFilters).toBeUndefined();
   });

   it('#unlink given filters changed after a view took them when unlinked then that view is pending', () => {

      // given
      service.link(levelQuery('ERROR'), Route.RAWDATA);
      service.takeFilters('tab1');
      service.update(levelQuery('WARN'), 'tab2');

      // when
      service.unlink();

      // then
      expect(viewTabs.linkedFilters.pendingKeys).toEqual([Route.RAWDATA, 'tab1']);
   });

   it('#unlink given linked filters replaced since a view took them when unlinked then that view is pending', () => {

      // given
      service.link(levelQuery('ERROR'), Route.RAWDATA);
      service.takeFilters('tab1');
      viewTabs.linkedFilters = { query: filtersOf(levelQuery('WARN')) };

      // when
      service.unlink();

      // then
      expect(viewTabs.linkedFilters.pendingKeys).toEqual([Route.RAWDATA, 'tab1', 'tab2']);
   });

   it('#takeFilters given pending key then returns the filters and removes the key', () => {

      // given
      viewTabs.linkedFilters = { query: filtersOf(levelQuery('ERROR')), pendingKeys: [Route.RAWDATA, 'tab1'] };

      // when
      const filters = service.takeFilters('tab1');

      // then
      expect(filters.getPropertyFilters()).toEqual(levelQuery('ERROR').getPropertyFilters());
      expect(viewTabs.linkedFilters.pendingKeys).toEqual([Route.RAWDATA]);
   });

   it('#takeFilters given last pending key then forgets the filters', () => {

      // given
      viewTabs.linkedFilters = { query: filtersOf(levelQuery('ERROR')), pendingKeys: ['tab1'] };

      // when
      service.takeFilters('tab1');

      // then
      expect(viewTabs.linkedFilters).toBeUndefined();
   });

   it('#takeFilters given key not pending then returns undefined', () => {

      // given
      viewTabs.linkedFilters = { query: filtersOf(levelQuery('ERROR')), pendingKeys: ['tab1'] };

      // when
      const filters = service.takeFilters('tab2');

      // then
      expect(filters).toBeUndefined();
      expect(viewTabs.setLinkedFilters).not.toHaveBeenCalled();
   });

   function levelQuery(level: string): Query {
      return new Query(new PropertyFilter('Level', Operator.EQUAL, level, DataType.TEXT));
   }

   function tab(id: string): TabDef {
      return { id, type: ViewType.PIVOT, title: id };
   }
});
