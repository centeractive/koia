import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { Edges, ResizeCursors } from 'angular-resizable-element';

export interface ResizeHandle {
  name: string;
  edges: Edges;
}

export const RESIZE_HANDLES: ResizeHandle[] = [
  { name: 'top_left', edges: { top: true, left: true } },
  { name: 'top', edges: { top: true } },
  { name: 'top_right', edges: { top: true, right: true } },
  { name: 'right', edges: { right: true } },
  { name: 'bottom_right', edges: { bottom: true, right: true } },
  { name: 'bottom', edges: { bottom: true } },
  { name: 'bottom_left', edges: { bottom: true, left: true } },
  { name: 'left', edges: { left: true } }
];

/** cursors the resizable shows on the body while resizing, the same as the handles show */
export const RESIZE_CURSORS: ResizeCursors = {
  topLeft: 'nwse-resize',
  topRight: 'nesw-resize',
  bottomLeft: 'nesw-resize',
  bottomRight: 'nwse-resize',
  leftOrRight: 'ew-resize',
  topOrBottom: 'ns-resize'
};

/**
 * the handles resizing the tile around them by its edges and corners
 */
@Component({
  selector: 'koia-resize-handles',
  templateUrl: './resize-handles.component.html',
  styleUrls: ['./resize-handles.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ResizeHandlesComponent {

  readonly handles = RESIZE_HANDLES;

  /** shrinks the edge handles to their squares, leaving the edges to other uses */
  @Input() @HostBinding('class.koia-squares-only') squaresOnly = false;
}
