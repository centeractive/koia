import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';
import { Column, ContextInfo, Query, Page } from '../../../model';
import { CommonUtils } from '../../../utils';
import { JSQueryFactory } from './js-query-factory';

@Injectable()
export class RawDataService {

  private static readonly PAGING_BASE_URL = 'http://localhost:3000/';
  static readonly PAGING_COLUMNS_URL = RawDataService.PAGING_BASE_URL + 'columns';
  static readonly PAGING_ENTRIES_URL = RawDataService.PAGING_BASE_URL + 'entries';

  private static readonly BASE_URL = 'http://localhost:3001/';
  static readonly CONTEXT_URL = RawDataService.BASE_URL + 'context';
  static readonly COLUMNS_URL = RawDataService.BASE_URL + 'columns';
  static readonly ENTRIES_URL = RawDataService.BASE_URL + 'entries';

  private static readonly INSTANCES = 1;

  private jsQueryFactory = new JSQueryFactory();
  private entries$: Observable<Object[]>;
  private lastEntriesQuery: Query;

  constructor(private http: HttpClient) { }

  getContext(): Observable<ContextInfo[]> {
    return this.http.get<ContextInfo[]>(RawDataService.CONTEXT_URL);
  }

  getPagingColumns(): Observable<Column[]> {
    return this.http.get<Column[]>(RawDataService.PAGING_COLUMNS_URL);
  }

  getColumns(): Observable<Column[]> {
    return this.http.get<Column[]>(RawDataService.COLUMNS_URL);
  }

  requestEntriesPage(query: Query): Promise<Page> {
    const url = CommonUtils.encodeURL(RawDataService.PAGING_ENTRIES_URL + query);
    return this.http.get<Object[]>(url, { observe: 'response' }).pipe(
      map(resp => {
        console.log('HTTP Header', JSON.stringify(resp.headers));
        return {
          query: query.clone(),
          entries: resp.body,
          totalRowCount: Number(resp.headers.get('x-total-count'))
        }
      })
    ).toPromise();
  }

  getEntries(query: Query): Observable<Object[]> {
    if (!this.entries$ || query !== this.lastEntriesQuery) {
      this.entries$ = this.requestEntries(query).pipe(
        shareReplay(RawDataService.INSTANCES)
      );
    }
    return this.entries$;
  }

  private requestEntries(query: Query): Observable<Object[]> {
    const url = CommonUtils.encodeURL(RawDataService.ENTRIES_URL + this.jsQueryFactory.create(query));
    this.lastEntriesQuery = query;
    return this.http.get<Object[]>(url);
  }

  clear() {
    this.entries$ = null;
  }
}
