import { TestBed, getTestBed } from '@angular/core/testing';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { RawDataService } from './raw-data.service';
import { ContextInfo, Column, Query, PropertyFilter, Operator, DataType } from '../../../model';

describe('RawDataService', () => {

  let rawDataService: RawDataService;
  let httpMock: HttpTestingController;
  let query: Query;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RawDataService],
      imports: [HttpClientTestingModule]
    });
    const injector = getTestBed();
    rawDataService = injector.get(RawDataService);
    httpMock = injector.get(HttpTestingController);
    query = new Query();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('#getContext should return context info', () => {

    // given
    const context: ContextInfo[] = [
      { name: 'Profile', value: 'Test' },
      { name: 'Search Criteria', value: 'contains "xyz"' }
    ];

    // when/then
    rawDataService.getContext().subscribe(data => expect(data).toBe(context));
    const request = httpMock.expectOne(RawDataService.CONTEXT_URL);
    expect(request.request.method).toBe('GET');

    // answer HTTP request
    request.flush(context);
  });

  it('#getPagingColumns should return all columns', () => {

    // given
    const columns: Column[] = [
      { name: 'ID', dataType: DataType.NUMBER, width: 20, format: null },
      { name: 'Time', dataType: DataType.TIME, width: 135, format: 'yyyy-MM-dd HH:mm:ss,SSS' },
      { name: 'Level', dataType: DataType.TEXT, width: 80, format: null },
      { name: 'Data', dataType: DataType.TEXT, width: 400, format: null }
    ];

    // when/then
    rawDataService.getPagingColumns().subscribe(data => expect(data).toBe(columns));
    const request = httpMock.expectOne(RawDataService.PAGING_COLUMNS_URL);
    expect(request.request.method).toBe('GET');

    // answer HTTP request
    request.flush(columns);
  });

  it('#getColumns should return all columns', () => {

    // given
    const columns: Column[] = [
      { name: 'ID', dataType: DataType.NUMBER, width: 20, format: null },
      { name: 'Time', dataType: DataType.TIME, width: 135, format: 'yyyy-MM-dd HH:mm:ss,SSS' },
      { name: 'Level', dataType: DataType.TEXT, width: 80, format: null }
    ];

    // when/then
    rawDataService.getColumns().subscribe(data => expect(data).toBe(columns));
    const request = httpMock.expectOne(RawDataService.COLUMNS_URL);
    expect(request.request.method).toBe('GET');

    // answer HTTP request
    request.flush(columns);
  });

  it('#getEntries should return all entries when query is void', () => {

    // given
    const entries = [
      { ID: 1, Time: 1420053116000, Level: 'INFO', Data: 'INFO line one', Host: 'local drive', Path: 'C:/temp/log/logLevels/info.log' },
      { ID: 2, Time: 1420053117000, Level: 'WARN', Data: 'WARN line one', Host: 'local drive', Path: 'C:/temp/log/logLevels/warn.log' },
      { ID: 3, Time: 1420053118000, Level: 'ERROR', Data: 'ERROR line one', Host: 'local drive', Path: 'C:/temp/log/logLevels/error.log' }
    ];

    // when/then
    rawDataService.getEntries(query).subscribe(data => expect(data).toBe(entries));
    const request = httpMock.expectOne(RawDataService.ENTRIES_URL);
    expect(request.request.method).toBe('GET');

    // answer HTTP request
    request.flush(entries);
  });

  it('#getEntries should return matching entries when query is defined', () => {

    // given
    const entries = [
      { ID: 2, Time: 1420053117000, Level: 'WARN', Data: 'WARN line one', Host: 'local drive', Path: 'C:/temp/log/logLevels/warn.log' }
    ];
    query.setPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'WARN'));

    // when/then
    rawDataService.getEntries(query).subscribe(data => expect(data).toBe(entries));
    const request = httpMock.expectOne(RawDataService.ENTRIES_URL + '?Level=WARN');
    expect(request.request.method).toBe('GET');

    // answer HTTP request
    request.flush(entries);
  });

  it('#getEntries should return cached observable of entries when query is unchanged', () => {

    // given
    query.setPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'WARN'));
    const firstEntries$ = rawDataService.getEntries(query);

    // when
    const secondEntries$ = rawDataService.getEntries(query);

    // then
    expect(secondEntries$).toBeTruthy();
    expect(secondEntries$).toBe(firstEntries$);
  });

  /*
  it('#requestEntriesPage should return page', () => {

    // given
    const entries = [
      { ID: 11, Time: 1420053117000, Level: 'WARN', Data: 'line x', Host: 'local drive', Path: 'C:/temp/server.log' },
      { ID: 12, Time: 1420053117000, Level: 'ERROR', Data: 'line y', Host: 'local drive', Path: 'C:/temp/server.log' }
    ];
    query.setPageDefinition(4, 2);

    // when/then
    rawDataService.requestEntriesPage(query).then(response => {
      expect(response.entries).toBe(entries);
    });
    const request = httpMock.expectOne(RawDataService.PAGING_ENTRIES_URL + '?_page=5&_limit=2');
    expect(request.request.method).toBe('GET');

    // answer HTTP request
    request.flush(entries);
  });
  */
});
