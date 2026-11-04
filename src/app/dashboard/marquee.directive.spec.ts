import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DragAutoScroll } from './drag-auto-scroll';
import { MarqueeDirective, MarqueeEnd } from './marquee.directive';

@Component({
  template: `
    <div class="div_host" koiaMarquee (marqueeStart)="starts.push($event)" (marqueeEnd)="ends.push($event)"
      style="position: fixed; left: 0; top: 0; width: 300px; height: 200px; overflow: scroll">
      <div class="div_tile" style="width: 50px; height: 50px"><button></button></div>
      <div class="div_selection_bounds" style="width: 50px; height: 50px"></div>
      <div style="height: 1000px"></div>
    </div>`,
  standalone: false
})
class HostComponent {
  starts: boolean[] = [];
  ends: MarqueeEnd[] = [];
}

describe('MarqueeDirective', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [HostComponent, MarqueeDirective] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    host = fixture.nativeElement.querySelector('.div_host');
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  function press(x: number, y: number, init: PointerEventInit = {}, target: Element = host): void {
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, ...init }));
  }

  function move(x: number, y: number): void {
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y }));
  }

  function release(x: number, y: number): void {
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y }));
  }

  function marquee(): HTMLElement {
    return document.querySelector('.' + MarqueeDirective.MARQUEE_CLASS);
  }

  it('should emit start of press beside tiles', () => {

    // when
    press(100, 100, { shiftKey: true });

    // then
    expect(fixture.componentInstance.starts).toEqual([true]);
  });

  it.each([
    { case: 'press on tile', init: {}, onTile: true, beside: undefined },
    { case: 'secondary button', init: { button: 2 }, onTile: false, beside: undefined },
    { case: 'touch', init: { pointerType: 'touch' }, onTile: false, beside: undefined },
    { case: 'vertical scrollbar', init: {}, onTile: false, beside: 'x' },
    { case: 'horizontal scrollbar', init: {}, onTile: false, beside: 'y' },
    { case: 'selection box', init: { altKey: true }, onTile: false, beside: 'bounds' }
  ])('should not start on $case', ({ init, onTile, beside }) => {

    // given
    const x = beside === 'x' ? host.clientLeft + host.clientWidth + 1 : 20;
    const y = beside === 'y' ? host.clientTop + host.clientHeight + 1 : 20;

    // when
    const target = onTile ? host.querySelector('.div_tile') : beside === 'bounds' ? host.querySelector('.div_selection_bounds') : host;
    press(x, y, init, target);
    move(x + 50, y + 50);
    release(x + 50, y + 50);

    // then
    expect(fixture.componentInstance.starts).toEqual([]);
    expect(fixture.componentInstance.ends).toEqual([]);
  });

  it('should not emit end of move below drag threshold', () => {

    // given
    press(100, 100);

    // when
    move(103, 104);
    release(103, 104);

    // then
    expect(fixture.componentInstance.ends).toEqual([]);
    expect(marquee()).toBeNull();
  });

  it('should emit marked client rect and whether it adds to the selection', () => {

    // given
    press(150, 120, { ctrlKey: true });
    move(60, 40);

    // when
    release(60, 40);

    // then
    expect(fixture.componentInstance.ends).toEqual([{ rect: { left: 60, top: 40, right: 150, bottom: 120 }, additive: true, touching: false }]);
  });

  it('should draw marquee while dragging and disable text selection of host', () => {

    // given
    press(100, 100);

    // when
    move(150, 160);

    // then
    const drawn = marquee();
    expect([drawn.style.left, drawn.style.top, drawn.style.width, drawn.style.height]).toEqual(['100px', '100px', '50px', '60px']);
    expect(host.style.userSelect).toBe('none');
  });

  it('should remove marquee and restore text selection of host on release', () => {

    // given
    press(100, 100);
    move(150, 160);

    // when
    release(150, 160);

    // then
    expect(marquee()).toBeNull();
    expect(host.style.userSelect).toBe('');
  });

  it('should remove marquee without emitting end on cancel', () => {

    // given
    press(100, 100);
    move(150, 160);

    // when
    document.dispatchEvent(new PointerEvent('pointercancel'));
    release(150, 160);

    // then
    expect(marquee()).toBeNull();
    expect(fixture.componentInstance.ends).toEqual([]);
  });

  it('should remove marquee on destroy', () => {

    // given
    press(100, 100);
    move(150, 160);

    // when
    fixture.destroy();

    // then
    expect(marquee()).toBeNull();
  });

  it('should clear text selection once marquee is drawn', () => {

    // given
    const range = document.createRange();
    range.selectNodeContents(host);
    document.getSelection().addRange(range);
    press(100, 100);

    // when
    move(150, 160);

    // then
    expect(document.getSelection().rangeCount).toBe(0);
  });

  it('should prevent text selection only while pressed', () => {

    // given
    press(100, 100);
    const whilePressed = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(whilePressed);
    release(100, 100);

    // when
    const afterRelease = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(afterRelease);

    // then
    expect(whilePressed.defaultPrevented).toBe(true);
    expect(afterRelease.defaultPrevented).toBe(false);
  });

  it('should keep start of drawn marquee at its spot while content scrolls', () => {

    // given
    press(100, 100);
    move(150, 160);
    host.scrollTop = 50;

    // when
    release(150, 160);

    // then
    expect(fixture.componentInstance.ends[0].rect).toEqual({ left: 100, top: 50, right: 150, bottom: 160 });
  });

  it('should scroll content while pointer is near its edge and stop on release', () => {

    // given
    const follow = vi.spyOn(DragAutoScroll.prototype, 'follow');
    const stop = vi.spyOn(DragAutoScroll.prototype, 'stop');
    press(100, 100);

    // when
    move(100, 190);
    release(100, 190);

    // then
    expect(follow).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
  });

  describe('with Alt on a tile', () => {

    let tile: HTMLElement;
    let button: HTMLButtonElement;

    beforeEach(() => {
      tile = host.querySelector('.div_tile');
      button = tile.querySelector('button');
    });

    function pressTile(init: PointerEventInit = {}): void {
      press(20, 20, { altKey: true, ...init }, button);
    }

    it('should start marquee marking touched tiles', () => {

      // given
      pressTile();
      move(80, 90);

      // when
      release(80, 90);

      // then
      expect(fixture.componentInstance.starts).toEqual([false]);
      expect(fixture.componentInstance.ends).toEqual([{ rect: { left: 20, top: 20, right: 80, bottom: 90 }, additive: false, touching: true }]);
    });

    it('should let the press reach the tile', () => {

      // given
      const presses: Event[] = [];
      tile.addEventListener('pointerdown', e => presses.push(e));

      // when
      pressTile();

      // then
      expect(presses.length).toBe(1);
    });

    it('should keep mousedown and click from the tile', () => {

      // given
      const reached: Event[] = [];
      tile.addEventListener('mousedown', e => reached.push(e));
      tile.addEventListener('click', e => reached.push(e));
      pressTile();
      const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      const click = new MouseEvent('click', { bubbles: true, cancelable: true });

      // when
      button.dispatchEvent(mousedown);
      button.dispatchEvent(click);

      // then
      expect(reached).toEqual([]);
      expect([mousedown.defaultPrevented, click.defaultPrevented]).toEqual([true, true]);
    });

    it('should blur focused element on kept mousedown', () => {

      // given
      button.focus();
      pressTile();

      // when
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

      // then
      expect(document.activeElement).toBe(document.body);
    });

    it('should let next click and following presses reach the tile', () => {

      // given
      const reached: Event[] = [];
      pressTile();
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      tile.addEventListener('mousedown', e => reached.push(e));
      tile.addEventListener('click', e => reached.push(e));
      press(20, 20, {}, button);

      // when
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // then
      expect(reached.length).toBe(2);
    });

    it('should stop keeping events from tiles on destroy', () => {

      // given
      const removed = vi.spyOn(host, 'removeEventListener');

      // when
      fixture.destroy();

      // then
      expect(removed.mock.calls.filter(c => c[2] === true).map(c => c[0])).toEqual(['pointerdown', 'mousedown', 'click']);
    });
  });

  it('should let mousedown reach a tile pressed without Alt', () => {

    // given
    const reached: Event[] = [];
    const tile = host.querySelector('.div_tile');
    tile.addEventListener('mousedown', e => reached.push(e));
    press(20, 20, {}, tile);

    // when
    tile.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    // then
    expect(reached.length).toBe(1);
  });
});
