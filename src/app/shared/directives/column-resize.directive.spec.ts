import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColumnResizeDirective } from './column-resize.directive';

@Component({
  template: `<div (click)="headerClicks = headerClicks + 1">
               <span koiaColumnResize (resizing)="deltas.push($event)" (resized)="resizedCount = resizedCount + 1"></span>
             </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  deltas: number[] = [];
  resizedCount = 0;
  headerClicks = 0;
}

describe('ColumnResizeDirective', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let handle: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, ColumnResizeDirective]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    handle = fixture.nativeElement.querySelector('[koiaColumnResize]');
  });

  function pointer(type: string, clientX: number): void {
    handle.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX, bubbles: true }));
  }

  it('should emit delta while dragging', () => {

    // given
    pointer('pointerdown', 100);

    // when
    pointer('pointermove', 130);
    pointer('pointermove', 80);

    // then
    expect(host.deltas).toEqual([30, -20]);
  });

  it('should emit delta in unscaled pixels of scaled handle', () => {

    // given
    handle.style.display = 'inline-block';
    handle.style.width = '10px';
    handle.parentElement.style.transform = 'scale(2)';
    pointer('pointerdown', 100);

    // when
    pointer('pointermove', 130);

    // then
    expect(host.deltas).toEqual([15]);
  });

  it('should not emit when moving without drag', () => {

    // when
    pointer('pointermove', 130);

    // then
    expect(host.deltas).toEqual([]);
  });

  it('should emit resized on pointerup', () => {

    // given
    vi.spyOn(handle, 'releasePointerCapture');
    pointer('pointerdown', 100);
    pointer('pointermove', 130);

    // when
    pointer('pointerup', 130);

    // then
    expect(host.resizedCount).toBe(1);
    expect(handle.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it('should end drag on pointerup', () => {

    // given
    pointer('pointerdown', 100);
    pointer('pointerup', 110);

    // when
    pointer('pointermove', 150);

    // then
    expect(host.deltas).toEqual([]);
  });

  it('should end drag on pointercancel', () => {

    // given
    pointer('pointerdown', 100);

    // when
    pointer('pointercancel', 100);
    pointer('pointermove', 150);

    // then
    expect(host.resizedCount).toBe(1);
    expect(host.deltas).toEqual([]);
  });

  it('should not emit resized on pointerup without drag', () => {

    // when
    pointer('pointerup', 100);

    // then
    expect(host.resizedCount).toBe(0);
  });

  it('should capture pointer on pointerdown', () => {

    // given
    vi.spyOn(handle, 'setPointerCapture');

    // when
    pointer('pointerdown', 100);

    // then
    expect(handle.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('should stop click propagation', () => {

    // when
    handle.click();

    // then
    expect(host.headerClicks).toBe(0);
  });
});
