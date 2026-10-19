import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClickWithoutDragDirective } from './click-without-drag.directive';

@Component({
  template: '<div koiaClickWithoutDrag (clickWithoutDrag)="clicks = clicks + 1"></div>',
  standalone: false
})
class HostComponent {
  clicks = 0;
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

  function pressAndClick(dx: number, dy: number): void {
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 100 }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100 + dx, clientY: 100 + dy }));
  }

  it.each([
    { dx: 0, dy: 0 },
    { dx: 4, dy: -4 }
  ])('should emit click moved by $dx, $dy', ({ dx, dy }) => {

    // when
    pressAndClick(dx, dy);

    // then
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it.each([
    { dx: 5, dy: 0 },
    { dx: 0, dy: -5 }
  ])('should not emit click ending drag moved by $dx, $dy', ({ dx, dy }) => {

    // when
    pressAndClick(dx, dy);

    // then
    expect(fixture.componentInstance.clicks).toBe(0);
  });
});
