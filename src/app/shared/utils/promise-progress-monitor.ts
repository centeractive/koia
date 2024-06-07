import EventEmitter from "events";

export class PromiseProgressMonitor {
  private _tasksCount = 0;
  private _settledTasksCount = 0
  private _lastSettledTask = undefined;
  private _eventEmitter = new EventEmitter();

  add<T>(taskName: string, promise : Promise<T>) {
    return new PromiseProgressMonitor.Chain<T>(
      this,
      this.addUnchained(taskName, promise));
  }

  addUnchained<T>(taskName: string, promise : Promise<T>) : Promise<T> {
    this._tasksCount++;
    this._eventEmitter.emit('progressChange', this);
    return promise.finally(() => {
      this._settledTasksCount++;
      this._lastSettledTask = taskName;
      this._eventEmitter.emit('progressChange', this);
    });
  }

  onProgressChange(listener : ((value: PromiseProgressMonitor) => void) ){
    this._eventEmitter.on("progressChange", listener);
  }

  get settled() : number {
    return this._settledTasksCount;
  }

  get count() : number {
    return this._tasksCount;
  }

  get lastSettledTask() : string | undefined {
    return this._lastSettledTask;
  }

  get settledPercent() : number {
    return this.count == 0 ? 0 : this.settled * 100 / this.count;
  }

  public static Chain = class<T> {
    constructor(private _tracker : PromiseProgressMonitor, private _promise : Promise<T>) {
    }

    then<TResult = T>(taskName: string, onfulfilled: ((value: T) => TResult | PromiseLike<TResult>)) : InstanceType<typeof PromiseProgressMonitor.Chain<TResult>> {
      return new PromiseProgressMonitor.Chain<TResult>(
        this._tracker,
        this._tracker.addUnchained(taskName, this._promise.then(onfulfilled)));
    }

    unwrap() : Promise<T> {
      return this._promise;
    }
  }
}
