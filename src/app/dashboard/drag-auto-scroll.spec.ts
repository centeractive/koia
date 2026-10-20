import { DragAutoScroll } from './drag-auto-scroll';

describe('DragAutoScroll', () => {

  let scroller: HTMLDivElement;
  let autoScroll: DragAutoScroll;
  let replayed: Event[];
  const recordReplay = (event: Event): number => replayed.push(event);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    scroller = document.createElement('div');
    scroller.style.cssText = 'position: fixed; left: 0; top: 100px; width: 200px; height: 300px; overflow: auto';
    const content = document.createElement('div');
    content.style.height = '2000px';
    scroller.appendChild(content);
    document.body.appendChild(scroller);
    scroller.scrollTop = 500;
    autoScroll = new DragAutoScroll(scroller);
    replayed = [];
    document.addEventListener('mousemove', recordReplay);
    document.addEventListener('touchmove', recordReplay);
  });

  afterEach(() => {
    autoScroll.stop();
    document.removeEventListener('mousemove', recordReplay);
    document.removeEventListener('touchmove', recordReplay);
    scroller.remove();
    vi.useRealTimers();
  });

  function mouseMoveAt(clientY: number): MouseEvent {
    return new MouseEvent('mousemove', { clientX: 50, clientY, buttons: 1, cancelable: true });
  }

  function touch(clientY: number): Touch {
    return new Touch({ identifier: 1, target: scroller, clientX: 50, clientY });
  }

  it('should scroll down by a step and replay pointer move when pointer is near bottom edge', () => {

    // given
    autoScroll.follow(mouseMoveAt(390));

    // when
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(500 + DragAutoScroll.STEP_PX);
    expect(replayed.length).toBe(1);
    expect(replayed[0]).toBeInstanceOf(MouseEvent);
    expect((replayed[0] as MouseEvent).clientY).toBe(390);
  });

  it('should scroll up by a step when pointer is near top edge', () => {

    // given
    autoScroll.follow(mouseMoveAt(110));

    // when
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(500 - DragAutoScroll.STEP_PX);
  });

  it('should not scroll when pointer is in the middle', () => {

    // given
    autoScroll.follow(mouseMoveAt(250));

    // when
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(500);
    expect(replayed).toEqual([]);
  });

  it('should scroll once per frame however often the pointer moves', () => {

    // given
    autoScroll.follow(mouseMoveAt(390));
    autoScroll.follow(mouseMoveAt(395));

    // when
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(500 + DragAutoScroll.STEP_PX);
    expect((replayed[0] as MouseEvent).clientY).toBe(395);
  });

  it('should keep scrolling while replayed moves are followed', () => {

    // given
    document.addEventListener('mousemove', e => autoScroll.follow(e as MouseEvent), { once: true });
    autoScroll.follow(mouseMoveAt(390));
    vi.advanceTimersToNextFrame();

    // when
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(500 + 2 * DragAutoScroll.STEP_PX);
  });

  it('should not replay pointer move at scroll limit', () => {

    // given
    scroller.scrollTop = 0;
    autoScroll.follow(mouseMoveAt(110));

    // when
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(0);
    expect(replayed).toEqual([]);
  });

  it('should not scroll once stopped', () => {

    // given
    autoScroll.follow(mouseMoveAt(390));

    // when
    autoScroll.stop();
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(500);
  });

  it('should follow first target touch and replay touch move', () => {

    // given
    const t = touch(390);
    autoScroll.follow(new TouchEvent('touchmove', { touches: [t], targetTouches: [t], changedTouches: [t], cancelable: true }));

    // when
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(500 + DragAutoScroll.STEP_PX);
    expect(replayed[0]).toBeInstanceOf(TouchEvent);
    expect((replayed[0] as TouchEvent).targetTouches[0].clientY).toBe(390);
  });

  it('should follow changed touch when no touch is on the target', () => {

    // given
    autoScroll.follow(new TouchEvent('touchmove', { changedTouches: [touch(110)] }));

    // when
    vi.advanceTimersToNextFrame();

    // then
    expect(scroller.scrollTop).toBe(500 - DragAutoScroll.STEP_PX);
  });
});
