import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClickWithoutDragDirective } from './click-without-drag.directive';

@Component({
  template: '<div koiaClickWithoutDrag (clickWithoutDrag)="clicks = clicks + 1; lastClick = $event"></div>',
  standalone: false
})
class HostComponent {
  clicks = 0;
  lastClick: MouseEvent;
}

describe('ClickWithoutDragDirective', () => {

  let fixture: ComponentFixture<HostComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [HostComponent, ClickWithoutDragDirective] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    element = fixture.nativeElement.querySelector('div');
  });

  afterEach(() => vi.restoreAllMocks());

  function press(): void {
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }));
  }

  function move(dx: number, dy: number): void {
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 100 + dx, clientY: 100 + dy }));
  }

  function release(type = 'pointerup'): void {
    document.dispatchEvent(new PointerEvent(type, { bubbles: true }));
  }

  function removedEventNames(removed: { mock: { calls: unknown[][] } }): unknown[] {
    return removed.mock.calls.map(c => c[0]);
  }

  function click(dx: number, dy: number): MouseEvent {
    const event = new MouseEvent('click', { bubbles: true, clientX: 100 + dx, clientY: 100 + dy });
    element.dispatchEvent(event);
    return event;
  }

  it.each([
    { dx: 0, dy: 0 },
    { dx: 2, dy: -2 }
  ])('should emit click moved by $dx, $dy', ({ dx, dy }) => {

    // given
    press();

    // when
    click(dx, dy);

    // then
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it.each([
    { dx: 5, dy: 0 },
    { dx: 0, dy: -5 },
    { dx: 3, dy: 3 }
  ])('should not emit click ending drag moved by $dx, $dy', ({ dx, dy }) => {

    // given
    press();

    // when
    click(dx, dy);

    // then
    expect(fixture.componentInstance.clicks).toBe(0);
  });

  it('should emit click', () => {

    // given
    press();

    // when
    const event = click(0, 0);

    // then
    expect(fixture.componentInstance.lastClick).toBe(event);
  });

  it('should not emit click without press', () => {

    // when
    click(0, 0);

    // then
    expect(fixture.componentInstance.clicks).toBe(0);
  });

  it('should not emit click after pointer moved beyond drag threshold and back', () => {

    // given
    press();
    move(6, 0);
    move(0, 0);

    // when
    click(0, 0);

    // then
    expect(fixture.componentInstance.clicks).toBe(0);
  });

  it('should emit click after pointer moved within drag threshold', () => {

    // given
    press();
    move(4, 0);

    // when
    click(0, 0);

    // then
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it.each(['pointerup', 'pointercancel'])('should ignore pointer moves after %s', type => {

    // given
    press();
    release(type);
    move(6, 0);

    // when
    click(0, 0);

    // then
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('should forget drag of previous press', () => {

    // given
    press();
    move(6, 0);
    release();
    press();

    // when
    click(0, 0);

    // then
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('should stop following previous press on next press', () => {

    // given
    press();
    const removed = vi.spyOn(document, 'removeEventListener');

    // when
    press();

    // then
    expect(removedEventNames(removed)).toEqual(expect.arrayContaining(['pointermove', 'pointerup', 'pointercancel']));
  });

  it('should stop following pointer when destroyed', () => {

    // given
    press();
    const removed = vi.spyOn(document, 'removeEventListener');

    // when
    fixture.destroy();

    // then
    expect(removedEventNames(removed)).toEqual(expect.arrayContaining(['pointermove', 'pointerup', 'pointercancel']));
  });
});
