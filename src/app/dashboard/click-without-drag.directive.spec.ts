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

  function press(): void {
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }));
  }

  function click(dx: number, dy: number): MouseEvent {
    const event = new MouseEvent('click', { bubbles: true, clientX: 100 + dx, clientY: 100 + dy });
    element.dispatchEvent(event);
    return event;
  }

  it.each([
    { dx: 0, dy: 0 },
    { dx: 4, dy: -4 }
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
    { dx: 0, dy: -5 }
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
});
