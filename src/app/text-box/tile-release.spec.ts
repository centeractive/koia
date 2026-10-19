import { NgZone, Renderer2, RendererFactory2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TileRelease } from './tile-release';

describe('TileRelease', () => {

  let zone: NgZone;
  let renderer: Renderer2;
  let tile: HTMLDivElement;
  let tileRelease: TileRelease;

  beforeEach(() => {
    zone = TestBed.inject(NgZone);
    renderer = TestBed.inject(RendererFactory2).createRenderer(null, null);
    tile = document.createElement('div');
    tileRelease = new TileRelease(zone, renderer, tile);
  });

  afterEach(() => tileRelease.cancel());

  function release(): void {
    document.dispatchEvent(new Event('pointerup'));
  }

  function nextMacrotask(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve));
  }

  it('should call back after release not resizing tile', async () => {

    // given
    const onRelease = vi.fn();
    tileRelease.awaitRelease(onRelease);

    // when
    release();
    await nextMacrotask();

    // then
    expect(onRelease).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('should call back after release of resized tile even when resize class is removed on later mouseup', async () => {

    // given
    const onRelease = vi.fn();
    tile.classList.add(TileRelease.RESIZE_ACTIVE_CLASS);
    tileRelease.awaitRelease(onRelease);

    // when
    release();
    tile.classList.remove(TileRelease.RESIZE_ACTIVE_CLASS);
    await nextMacrotask();

    // then
    expect(onRelease).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('should call back after handlers of release', () => {

    // given
    const onRelease = vi.fn();
    tileRelease.awaitRelease(onRelease);

    // when
    release();

    // then
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('should call back inside Angular zone', async () => {

    // given
    const onRelease = vi.fn(() => NgZone.isInAngularZone());
    tileRelease.awaitRelease(onRelease);

    // when
    release();
    await nextMacrotask();

    // then
    expect(onRelease).toHaveReturnedWith(true);
  });

  it('should listen to release outside Angular zone', () => {

    // given
    const runSpy = vi.spyOn(zone, 'run');
    tileRelease.awaitRelease(vi.fn());

    // when
    release();

    // then
    expect(runSpy).not.toHaveBeenCalled();
  });

  it('should call back once only', async () => {

    // given
    const onRelease = vi.fn();
    tileRelease.awaitRelease(onRelease);
    release();
    await nextMacrotask();

    // when
    release();
    await nextMacrotask();

    // then
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('should replace pending release', async () => {

    // given
    const first = vi.fn();
    const second = vi.fn();
    tileRelease.awaitRelease(first);

    // when
    tileRelease.awaitRelease(second);
    release();
    await nextMacrotask();

    // then
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('#cancel before release should prevent call back', async () => {

    // given
    const onRelease = vi.fn();
    tileRelease.awaitRelease(onRelease);

    // when
    tileRelease.cancel();
    release();
    await nextMacrotask();

    // then
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('#cancel after release should prevent pending call back', async () => {

    // given
    const onRelease = vi.fn();
    tileRelease.awaitRelease(onRelease);
    release();

    // when
    tileRelease.cancel();
    await nextMacrotask();

    // then
    expect(onRelease).not.toHaveBeenCalled();
  });
});
