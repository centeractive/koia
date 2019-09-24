import { DBService } from 'app/shared/services/backend';
import { ProgressMonitor } from './progress-monitor.type';
import { Document } from 'app/shared/model';

/**
 * Queues posted entries and delivers them as batches to the [[DbService]] in order to be written to the CouchDB.
 * Batches of equal size are delivered as soon - and as long - as the number of queued entries reaches the specified batch size.
 * To have remaining data delivered (which is smaller than the batch size), the [[postingComplete]] method needs to be invoked.
 */
export class EntryPersister {

  private data: Object[] = []
  private postLocked = false
  private posted = 0;
  private submitted = 0;
  private successful = 0;

  constructor(private dbService: DBService, private database: string, private batchSize: number, private monitor: ProgressMonitor) { }

  /**
   * resets this [[EntryPersister]] to be ready from having new entries posted
   */
  reset() {
    this.data = [];
    this.postLocked = false;
    this.posted = 0;
    this.submitted = 0;
    this.successful = 0;
  }

  /**
   * posts new entries to be queued, entries are submitted to [[DbService#writeEntries]] as soon - and as long - as the number
   * of queued entries reaches the specified batch size.
   */
  post(entries: Document[]): void {
    if (this.postLocked) {
      throw new Error('Posting was completed and is now locked');
    }
    console.log('posting ' + entries.length + ' items to be persisted');
    this.posted += entries.length;
    this.data.push(...entries);
    while (this.data.length >= this.batchSize) {
      this.submit(this.data.splice(0, this.batchSize));
    }
    this.notifyProgress();
  }

  getPosted(): number {
    return this.posted;
  }

  private submit(entries: Document[]): void {
    console.log('submitting ' + entries.length + ' items to the database');
    this.submitted += entries.length;
    this.dbService.writeEntries(this.database, entries)
      .then(r => this.onWriteSuccess(entries.length))
      .catch(e => this.onError(e));
  }

  private onError(error: any) {
    this.monitor.onError(error);
    this.monitor.onComplete('data persisting aborted due to error: ' + error);
    this.postingComplete(false);
  }

  /**
   * optionally submits queued entries to be written to the database and lockes this [[EntryPersister]] from further posting new entries
   * untile [[reset]] is invoked
   */
  postingComplete(submitQueuedEntries: boolean): void {
    this.postLocked = true;
    if (submitQueuedEntries && this.data.length > 0) {
      this.submit(this.data);
      this.data = [];
    } else if (this.submitted === this.successful) {
      this.monitor.onComplete(this.successful.toLocaleString() + ' items have been persisted in the database');
    }
  }

  isPostingComplete() {
    return this.postLocked;
  }

  private onWriteSuccess(count: number): void {
    console.log(count + ' items persisted');
    this.successful += count;
    this.notifyProgress();
    if (this.postLocked && this.successful === this.submitted) {
      this.monitor.onComplete(this.successful.toLocaleString() + ' items have been persisted in the database');
    }
  }

  private notifyProgress(): void {
    const percent = Math.floor(100 / (this.data.length + this.submitted) * this.successful);
    if (this.isPostingComplete()) {
      this.monitor.onProgress(percent, this.successful.toLocaleString() + ' of ' + this.posted.toLocaleString() +
        ' items persisted (' + percent + '%)');
    } else {
      let message = this.posted.toLocaleString() + ' items read';
      if (this.successful !== 0) {
        message += ' / ' + this.successful.toLocaleString() + ' persisted';
      }
      this.monitor.onProgress(percent, message);
    }
  }
}
