import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResizableDirective, ResizeEvent, ResizeHandleDirective } from 'angular-resizable-element';
import { RESIZE_CURSORS, RESIZE_HANDLES, ResizeHandlesComponent } from './resize-handles.component';

@Component({
  template: `<div class="div_tile" mwlResizable [resizeCursors]="cursors" (resizeStart)="resizeStart = $event"
    style="position: relative; width: 200px; height: 100px">
    <koia-resize-handles [squaresOnly]="squaresOnly" />
  </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  readonly cursors = RESIZE_CURSORS;
  squaresOnly = false;
  resizeStart: ResizeEvent;
}

describe('ResizeHandlesComponent', () => {

  const GRIP = 8;

  let fixture: ComponentFixture<HostComponent>;
  let tile: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, ResizeHandlesComponent],
      imports: [ResizableDirective, ResizeHandleDirective]
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tile = fixture.nativeElement.querySelector('.div_tile');
  });

  afterEach(() => document.dispatchEvent(new MouseEvent('mouseup')));

  function handle(name: string): HTMLElement {
    return tile.querySelector('.div_resize_handle_' + name);
  }

  function rectOf(name: string): { left: number, top: number, width: number, height: number } {
    const tileRect = tile.getBoundingClientRect();
    const rect = handle(name).getBoundingClientRect();
    return { left: rect.left - tileRect.left, top: rect.top - tileRect.top, width: rect.width, height: rect.height };
  }

  it('should render 8 handles named after their position', () => {

    // when
    const handles = Array.from(tile.querySelectorAll('.div_resize_handle'));

    // then
    expect(handles.map(h => h.classList[1])).toEqual(RESIZE_HANDLES.map(h => 'div_resize_handle_' + h.name));
  });

  it.each([
    { name: 'top_left', cursor: 'nwse-resize' },
    { name: 'top', cursor: 'ns-resize' },
    { name: 'top_right', cursor: 'nesw-resize' },
    { name: 'right', cursor: 'ew-resize' },
    { name: 'bottom_right', cursor: 'nwse-resize' },
    { name: 'bottom', cursor: 'ns-resize' },
    { name: 'bottom_left', cursor: 'nesw-resize' },
    { name: 'left', cursor: 'ew-resize' }
  ])('should show resize cursor $cursor on $name handle', ({ name, cursor }) => {

    // when
    const style = getComputedStyle(handle(name));

    // then
    expect(style.cursor).toBe(cursor);
  });

  it('handles should lie on the edges and corners of the tile', () => {

    // when
    const rects = RESIZE_HANDLES.map(h => rectOf(h.name));

    // then
    expect(rects).toEqual([
      { left: 0, top: 0, width: GRIP, height: GRIP },
      { left: GRIP, top: 0, width: 200 - 2 * GRIP, height: GRIP },
      { left: 200 - GRIP, top: 0, width: GRIP, height: GRIP },
      { left: 200 - GRIP, top: GRIP, width: GRIP, height: 100 - 2 * GRIP },
      { left: 200 - GRIP, top: 100 - GRIP, width: GRIP, height: GRIP },
      { left: GRIP, top: 100 - GRIP, width: 200 - 2 * GRIP, height: GRIP },
      { left: 0, top: 100 - GRIP, width: GRIP, height: GRIP },
      { left: 0, top: GRIP, width: GRIP, height: 100 - 2 * GRIP }
    ]);
  });

  it('edge handles should shrink to their squares when squares only', () => {

    // given
    fixture.componentInstance.squaresOnly = true;

    // when
    fixture.detectChanges();

    // then
    expect(['top', 'right', 'bottom', 'left'].map(name => rectOf(name))).toEqual([
      { left: 100 - GRIP / 2, top: 0, width: GRIP, height: GRIP },
      { left: 200 - GRIP, top: 50 - GRIP / 2, width: GRIP, height: GRIP },
      { left: 100 - GRIP / 2, top: 100 - GRIP, width: GRIP, height: GRIP },
      { left: 0, top: 50 - GRIP / 2, width: GRIP, height: GRIP }
    ]);
  });

  it('handles should be above tile border', () => {

    // when
    const style = getComputedStyle(handle('top'));

    // then
    expect(style.position).toBe('absolute');
    expect(style.zIndex).toBe('11');
  });

  it.each(RESIZE_HANDLES.map(h => h.name))('%s handle should draw an accent square in its middle', name => {

    // given
    const accent = document.createElement('div');
    accent.style.color = 'var(--koia-accent)';
    document.body.appendChild(accent);

    // when
    const square = getComputedStyle(handle(name), '::after');

    // then
    const rect = handle(name).getBoundingClientRect();
    expect([square.width, square.height]).toEqual([GRIP + 'px', GRIP + 'px']);
    expect(square.borderTopColor).toBe(getComputedStyle(accent).color);
    expect(parseFloat(square.left) + GRIP / 2).toBeCloseTo(rect.width / 2, 5);
    expect(parseFloat(square.top) + GRIP / 2).toBeCloseTo(rect.height / 2, 5);
    accent.remove();
  });

  it.each(['mousedown', 'touchstart'])('should not propagate %s to tile', type => {

    // given
    const tileListener = vi.fn();
    tile.addEventListener(type, tileListener);

    // when
    handle('left').dispatchEvent(new Event(type, { bubbles: true }));

    // then
    expect(tileListener).not.toHaveBeenCalled();
  });

  it.each(RESIZE_HANDLES)('pressing $name handle should resize the tile by its edges', ({ name, edges }) => {

    // when
    handle(name).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));

    // then
    expect(Object.keys(fixture.componentInstance.resizeStart.edges).sort()).toEqual(Object.keys(edges).sort());
  });

  it('resizing should show cursor of handle on body', () => {

    // when
    handle('top_left').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));

    // then
    expect(document.body.style.cursor).toBe('nwse-resize');
  });
});
