import { Page, Query } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';

export interface RawDataBlockCacheListener {
  onLoading(loading: boolean): void;
  onBlockLoaded(page: Page, firstBlock: boolean): void;
  onError(error: string | object): void;
}

export class RawDataBlockCache {

  static readonly BLOCK_SIZE = 100;
  static readonly MAX_BLOCKS = 50;

  totalRowCount: number | undefined;

  private blocks = new Map<number, object[]>();
  private failed = new Set<number>();
  private generation = 0;
  private loadingBlock: number | undefined;
  private lastPage: Page | undefined;
  private wanted = { first: 0, last: 0 };

  constructor(private dbService: DBService, private queryProvider: () => Query, private listener: RawDataBlockCacheListener) { }

  cancel(): void {
    this.generation++;
    this.loadingBlock = undefined;
  }

  reset(): void {
    this.cancel();
    this.blocks.clear();
    this.failed.clear();
    this.totalRowCount = undefined;
    this.lastPage = undefined;
    this.listener.onLoading(false);
    this.requestRange(0, 0);
  }

  requestRange(first: number, last: number): void {
    this.wanted = { first, last };
    this.loadNextMissing();
  }

  rowAt(index: number): object | undefined {
    const blockIndex = Math.floor(index / RawDataBlockCache.BLOCK_SIZE);
    const block = this.blocks.get(blockIndex);
    if (!block) {
      return undefined;
    }
    this.blocks.delete(blockIndex);
    this.blocks.set(blockIndex, block);
    return block[index % RawDataBlockCache.BLOCK_SIZE];
  }

  loadedRows(): object[] {
    return Array.from(this.blocks.values()).flat();
  }

  private loadNextMissing(): void {
    if (this.loadingBlock !== undefined) {
      return;
    }
    const blockIndex = this.firstMissingBlock();
    if (blockIndex === undefined) {
      return;
    }
    const generation = this.generation;
    this.loadingBlock = blockIndex;
    this.listener.onLoading(true);
    const query = this.queryProvider().clone();
    query.setPageDefinition(blockIndex, RawDataBlockCache.BLOCK_SIZE);
    this.dbService.requestEntriesPage(query, this.lastPage)
      .then(page => {
        if (generation === this.generation) {
          this.onPageLoaded(blockIndex, page);
        }
      })
      .catch(error => {
        if (generation === this.generation) {
          this.failed.add(blockIndex);
          this.loadingBlock = undefined;
          this.listener.onLoading(false);
          this.listener.onError(error);
        }
      });
  }

  private onPageLoaded(blockIndex: number, page: Page): void {
    const firstBlock = !this.lastPage;
    this.lastPage = page;
    this.totalRowCount = page.totalRowCount;
    this.blocks.set(blockIndex, page.entries);
    this.evict();
    this.loadingBlock = undefined;
    this.listener.onLoading(false);
    this.listener.onBlockLoaded(page, firstBlock);
    this.loadNextMissing();
  }

  private firstMissingBlock(): number | undefined {
    const blockCount = this.totalRowCount === undefined ? Infinity : Math.ceil(this.totalRowCount / RawDataBlockCache.BLOCK_SIZE);
    const lastBlock = Math.min(this.blockOf(this.wanted.last), blockCount - 1);
    for (let blockIndex = this.blockOf(this.wanted.first); blockIndex <= lastBlock; blockIndex++) {
      if (!this.blocks.has(blockIndex) && !this.failed.has(blockIndex)) {
        return blockIndex;
      }
    }
    return undefined;
  }

  private evict(): void {
    for (const blockIndex of Array.from(this.blocks.keys())) {
      if (this.blocks.size <= RawDataBlockCache.MAX_BLOCKS) {
        return;
      }
      if (blockIndex < this.blockOf(this.wanted.first) || blockIndex > this.blockOf(this.wanted.last)) {
        this.blocks.delete(blockIndex);
      }
    }
  }

  private blockOf(rowIndex: number): number {
    return Math.floor(rowIndex / RawDataBlockCache.BLOCK_SIZE);
  }
}
