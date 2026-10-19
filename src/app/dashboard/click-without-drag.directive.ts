import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

/**
 * emits clicks of a drag handle that did not move the pointer far enough to start a drag
 */
@Directive({
  selector: '[koiaClickWithoutDrag]',
  standalone: false
})
export class ClickWithoutDragDirective {

  /** the default drag start threshold of the CDK */
  static readonly DRAG_THRESHOLD_PX = 5;

  @Output() clickWithoutDrag = new EventEmitter<void>();

  private pressX: number;
  private pressY: number;

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.pressX = event.clientX;
    this.pressY = event.clientY;
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const distance = Math.max(Math.abs(event.clientX - this.pressX), Math.abs(event.clientY - this.pressY));
    if (distance < ClickWithoutDragDirective.DRAG_THRESHOLD_PX) {
      this.clickWithoutDrag.emit();
    }
  }
}
