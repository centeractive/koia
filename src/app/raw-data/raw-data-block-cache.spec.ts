import { Page, Query } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import type { Mock } from 'vitest';
import { RawDataBlockCache, RawDataBlockCacheListener } from './raw-data-block-cache';

describe('RawDataBlockCache', () => {

  let dbService: DBService;
  let query: Query;
  let listener: RawDataBlockCacheListener;
  let cache: RawDataBlockCache;
  let requestEntriesPageSpy: Mock;
  let total: number;

  beforeEach(() => {
    total = 1234;
    dbService = new DBService(null);
    query = new Query();
    listener = {
      onLoading: vi.fn(),
      onBlockLoaded: vi.fn(),
      onError: vi.fn()
    };
    cache = new RawDataBlockCache(dbService, () => query, listener);
    requestEntriesPageSpy = vi.spyOn(dbService, 'requestEntriesPage').mockImplementation(pageOf);
  });

  function pageOf(q: Query): Promise<Page> {
    const start = q.getPageIndex() * q.getRowsPerPage();
    const count = Math.max(0, Math.min(q.getRowsPerPage(), total - start));
    const entries = Array.from({ length: count }, (_, i) => ({ _id: String(start + i) }));
    return Promise.resolve({ query: q, entries, totalRowCount: total });
  }

  function requestedBlocks(): number[] {
    return requestEntriesPageSpy.mock.calls.map(call => (call[0] as Query).getPageIndex());
  }

  function flushPromises(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve));
  }

  async function loadedCache(): Promise<void> {
    cache.reset();
    await flushPromises();
  }

  it('#reset should load first block', async () => {

    // when
    cache.reset();
    await flushPromises();

    // then
    expect(requestedBlocks()).toEqual([0]);
    const requestedQuery: Query = requestEntriesPageSpy.mock.calls[0][0];
    expect(requestedQuery.getRowsPerPage()).toBe(RawDataBlockCache.BLOCK_SIZE);
    expect(cache.totalRowCount).toBe(1234);
  });

  it('#reset should clear cached blocks and total row count', async () => {

    // given
    await loadedCache();
    requestEntriesPageSpy.mockReturnValue(new Promise(() => undefined));

    // when
    cache.reset();

    // then
    expect(cache.rowAt(0)).toBeUndefined();
    expect(cache.totalRowCount).toBeUndefined();
  });

  it('#requestRange should load first missing block of range', async () => {

    // given
    await loadedCache();

    // when
    cache.requestRange(510, 530);
    await flushPromises();

    // then
    expect(requestedBlocks()).toEqual([0, 5]);
  });

  it('#requestRange should load next missing block after previous loaded', async () => {

    // given
    await loadedCache();

    // when
    cache.requestRange(190, 310);
    await flushPromises();

    // then
    expect(requestedBlocks()).toEqual([0, 1, 2, 3]);
  });

  it('#requestRange should load nothing while loading', async () => {

    // given
    await loadedCache();
    requestEntriesPageSpy.mockReturnValue(new Promise(() => undefined));
    cache.requestRange(150, 160);

    // when
    cache.requestRange(250, 260);

    // then
    expect(requestedBlocks()).toEqual([0, 1]);
  });

  it('#requestRange should prefer newest range over skipped blocks', async () => {

    // given
    await loadedCache();
    let resolveBlock1: (page: Page) => void;
    requestEntriesPageSpy.mockImplementationOnce(() => new Promise(resolve => resolveBlock1 = resolve));
    cache.requestRange(150, 160);
    cache.requestRange(1200, 1233);

    // when
    resolveBlock1(await pageOf(blockQuery(1)));
    await flushPromises();

    // then
    expect(requestedBlocks()).toEqual([0, 1, 12]);
  });

  function blockQuery(blockIndex: number): Query {
    const q = new Query();
    q.setPageDefinition(blockIndex, RawDataBlockCache.BLOCK_SIZE);
    return q;
  }

  it('#requestRange should not load beyond total row count', async () => {

    // given
    await loadedCache();

    // when
    cache.requestRange(1300, 1400);
    await flushPromises();

    // then
    expect(requestedBlocks()).toEqual([0]);
  });

  it('#requestRange should load nothing when total row count is zero', async () => {

    // given
    requestEntriesPageSpy.mockResolvedValue({ query, entries: [], totalRowCount: 0 });
    await loadedCache();

    // when
    cache.requestRange(0, 10);
    await flushPromises();

    // then
    expect(requestedBlocks()).toEqual([0]);
  });

  it('#requestRange should pass previous page', async () => {

    // given
    await loadedCache();
    const firstPage: Page = await requestEntriesPageSpy.mock.results[0].value;

    // when
    cache.requestRange(100, 110);
    await flushPromises();

    // then
    expect(requestEntriesPageSpy.mock.calls[0][1]).toBeUndefined();
    expect(requestEntriesPageSpy.mock.calls[1][1]).toBe(firstPage);
  });

  it('#rowAt should return row of loaded block', async () => {

    // given
    await loadedCache();
    cache.requestRange(250, 260);
    await flushPromises();

    // when
    const row = cache.rowAt(257);

    // then
    expect(row).toEqual({ _id: '257' });
  });

  it('#rowAt should return undefined for missing block', async () => {

    // given
    await loadedCache();

    // when
    const row = cache.rowAt(257);

    // then
    expect(row).toBeUndefined();
  });

  it('#loadedRows should return rows of cached blocks', async () => {

    // given
    await loadedCache();
    cache.requestRange(1200, 1233);
    await flushPromises();

    // when
    const rows = cache.loadedRows();

    // then
    expect(rows.length).toBe(100 + 34);
    expect(rows[0]).toEqual({ _id: '0' });
    expect(rows[133]).toEqual({ _id: '1233' });
  });

  it('should evict least recently used block outside wanted range when full', async () => {

    // given
    total = 6000;
    await loadedCache();
    for (let block = 1; block < RawDataBlockCache.MAX_BLOCKS; block++) {
      cache.requestRange(block * 100, block * 100);
      await flushPromises();
    }
    cache.rowAt(0);

    // when
    cache.requestRange(5000, 5000);
    await flushPromises();

    // then
    expect(cache.rowAt(0)).toEqual({ _id: '0' });
    expect(cache.rowAt(100)).toBeUndefined();
    expect(cache.rowAt(5000)).toEqual({ _id: '5000' });
  });

  it('should keep blocks inside wanted range when full', async () => {

    // given
    total = 6000;
    await loadedCache();
    for (let block = 1; block < RawDataBlockCache.MAX_BLOCKS; block++) {
      cache.requestRange(block * 100, block * 100);
      await flushPromises();
    }

    // when
    cache.requestRange(0, 5099);
    await flushPromises();

    // then
    expect(cache.loadedRows().length).toBe((RawDataBlockCache.MAX_BLOCKS + 1) * 100);
  });

  it('should report first block only once per reset', async () => {

    // given
    await loadedCache();

    // when
    cache.requestRange(100, 110);
    await flushPromises();

    // then
    expect(vi.mocked(listener.onBlockLoaded).mock.calls.map(call => call[1])).toEqual([true, false]);
  });

  it('should ignore response after reset', async () => {

    // given
    let resolveFirst: (page: Page) => void;
    requestEntriesPageSpy.mockImplementationOnce(() => new Promise(resolve => resolveFirst = resolve));
    cache.reset();
    cache.reset();
    await flushPromises();
    vi.mocked(listener.onBlockLoaded).mockClear();

    // when
    resolveFirst({ query, entries: [{ _id: 'stale' }], totalRowCount: 1 });
    await flushPromises();

    // then
    expect(listener.onBlockLoaded).not.toHaveBeenCalled();
    expect(cache.rowAt(0)).toEqual({ _id: '0' });
  });

  it('should ignore error after reset', async () => {

    // given
    let rejectFirst: (error: string) => void;
    requestEntriesPageSpy.mockImplementationOnce(() => new Promise((_, reject) => rejectFirst = reject));
    cache.reset();
    cache.reset();
    await flushPromises();

    // when
    rejectFirst('stale error');
    await flushPromises();

    // then
    expect(listener.onError).not.toHaveBeenCalled();
  });

  it('#cancel should ignore pending response', async () => {

    // given
    let resolveFirst: (page: Page) => void;
    requestEntriesPageSpy.mockImplementationOnce(() => new Promise(resolve => resolveFirst = resolve));
    cache.reset();

    // when
    cache.cancel();
    resolveFirst({ query, entries: [{ _id: '0' }], totalRowCount: 1 });
    await flushPromises();

    // then
    expect(listener.onBlockLoaded).not.toHaveBeenCalled();
    expect(cache.rowAt(0)).toBeUndefined();
  });

  it('should report error and not retry failed block until reset', async () => {

    // given
    requestEntriesPageSpy.mockRejectedValueOnce('db down');
    cache.reset();
    await flushPromises();

    // when
    cache.requestRange(0, 10);
    await flushPromises();

    // then
    expect(listener.onError).toHaveBeenCalledWith('db down');
    expect(requestedBlocks()).toEqual([0]);
  });

  it('#reset should retry failed block', async () => {

    // given
    requestEntriesPageSpy.mockRejectedValueOnce('db down');
    cache.reset();
    await flushPromises();

    // when
    cache.reset();
    await flushPromises();

    // then
    expect(requestedBlocks()).toEqual([0, 0]);
    expect(cache.rowAt(0)).toEqual({ _id: '0' });
  });

  it('should report loading', async () => {

    // when
    cache.reset();
    await flushPromises();

    // then
    expect(vi.mocked(listener.onLoading).mock.calls.map(call => call[0])).toEqual([false, true, false]);
  });

  it('should report loading end when request fails', async () => {

    // given
    requestEntriesPageSpy.mockRejectedValueOnce('db down');

    // when
    cache.reset();
    await flushPromises();

    // then
    expect(vi.mocked(listener.onLoading).mock.calls.map(call => call[0])).toEqual([false, true, false]);
  });

  it('should leave provider query untouched', async () => {

    // when
    await loadedCache();

    // then
    expect(requestEntriesPageSpy.mock.calls[0][0]).not.toBe(query);
    expect(query.getPageIndex()).toBeUndefined();
  });
});
