import { Subject } from 'rxjs';
import { Query } from '../model';

/**
 * stands in for LinkedFiltersService, its members are spies
 */
export class LinkedFiltersServiceMock {

   ready = true;
   readonly loaded$ = new Subject<void>();
   readonly isLinked = vi.fn<() => boolean>(() => false);
   readonly link = vi.fn<(query: Query, key: string) => void>();
   readonly update = vi.fn<(query: Query, key: string) => void>();
   readonly unlink = vi.fn<() => void>();
   readonly takeFilters = vi.fn<(key: string) => Query | undefined>(() => undefined);
}
