import { PromiseProgressMonitor } from "./promise-progress-monitor";

describe('PromiseProgressMonitor', () => {
  it('#initialize', () => {
    const promiseProgressMonitor = new PromiseProgressMonitor();
    expect(promiseProgressMonitor.count).toEqual(0);
    expect(promiseProgressMonitor.settled).toEqual(0);
    expect(promiseProgressMonitor.settledPercent).toEqual(0);
    expect(promiseProgressMonitor.lastSettledTask).toBeUndefined();
  });

  it('#add should increment the tasks count', () => {
    const promiseProgressMonitor = new PromiseProgressMonitor();

    promiseProgressMonitor.add("task0", new Promise(() => { }));
    expect(promiseProgressMonitor.count).toEqual(1);

    promiseProgressMonitor.add("task1", new Promise(() => { }));
    expect(promiseProgressMonitor.count).toEqual(2);
  });

  it('#add chained should increment the tasks count', () => {
    const promiseProgressMonitor = new PromiseProgressMonitor();

    promiseProgressMonitor
      .add("task0", new Promise(() => { }))
      .then("task1", () => new Promise(() => { }))
      .then("task2", () => new Promise(() => { }));

      expect(promiseProgressMonitor.count).toEqual(3);
  });

  it('#add should raise onProgressChange event', () => {
    const promiseProgressMonitor = new PromiseProgressMonitor();

    const onProgressEventListener = jasmine.createSpy();

    promiseProgressMonitor.onProgressChange(onProgressEventListener);
    expect(onProgressEventListener).not.toHaveBeenCalled();

    promiseProgressMonitor.add("task0", new Promise(() => { }));
    expect(onProgressEventListener).toHaveBeenCalledTimes(1);

    promiseProgressMonitor.add("task1", new Promise(() => { }));
    expect(onProgressEventListener).toHaveBeenCalledTimes(2);
  });

  it('completed promises should increase settled tasks', async () => {
    const promiseProgressMonitor = new PromiseProgressMonitor();

    let deferredTask0;
    let deferredTask1;
    let deferredTask2;

    promiseProgressMonitor
      .add("task0", new Promise((resolve) => { deferredTask0 = resolve}))
      .then("task1", () => new Promise((resolve) => { deferredTask1 = resolve}))
      .then("task2", () => new Promise((resolve) => { deferredTask2 = resolve}));

      expect(promiseProgressMonitor.settled).toEqual(0);
      expect(promiseProgressMonitor.settledPercent).toEqual(0);
      expect(promiseProgressMonitor.lastSettledTask).toBeUndefined();

      deferredTask0();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(promiseProgressMonitor.settled).toEqual(1);
      expect(promiseProgressMonitor.settledPercent).toEqual(100 / 3);
      expect(promiseProgressMonitor.lastSettledTask).toEqual("task0");

      deferredTask1();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(promiseProgressMonitor.settled).toEqual(2);
      expect(promiseProgressMonitor.settledPercent).toEqual(2 * 100 / 3);
      expect(promiseProgressMonitor.lastSettledTask).toEqual("task1");

      deferredTask2();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(promiseProgressMonitor.settled).toEqual(3);
      expect(promiseProgressMonitor.settledPercent).toEqual(100);
      expect(promiseProgressMonitor.lastSettledTask).toEqual("task2");
  });

  it('completed promises should raise onProgressChange event', async () => {
    const promiseProgressMonitor = new PromiseProgressMonitor();

    let deferredTask0;
    let deferredTask1;
    let deferredTask2;

    promiseProgressMonitor
      .add("task0", new Promise((resolve) => { deferredTask0 = resolve}))
      .then("task1", () => new Promise((resolve) => { deferredTask1 = resolve}))
      .then("task2", () => new Promise((resolve) => { deferredTask2 = resolve}));

    let expectedSettled = 1;
    let expectedPercent = 100 / 3;
    let expectedLastSettledTask = "task0";

    promiseProgressMonitor.onProgressChange((monitor) => {
      expect(promiseProgressMonitor.settled).toEqual(expectedSettled);
      expect(promiseProgressMonitor.settledPercent).toEqual(expectedPercent);
      expect(promiseProgressMonitor.lastSettledTask).toEqual(expectedLastSettledTask);
    });

    deferredTask0();

    await new Promise(resolve => setTimeout(resolve, 0));

    expectedSettled = 2;
    expectedPercent = 2 * 100 / 3;
    expectedLastSettledTask = "task1";
    deferredTask1();

    await new Promise(resolve => setTimeout(resolve, 0));

    expectedSettled = 3;
    expectedPercent = 100;
    expectedLastSettledTask = "task2";
    deferredTask2();
  });
});
