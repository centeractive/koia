import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[koiaColumnResize]',
  standalone: false
})
export class ColumnResizeDirective {

  @Output() resizing = new EventEmitter<number>();
  @Output() resized = new EventEmitter<void>();

  private startX: number | undefined;

  constructor(private elementRef: ElementRef<HTMLElement>) { }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    this.elementRef.nativeElement.setPointerCapture(event.pointerId);
    this.startX = event.clientX;
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.startX !== undefined) {
      this.resizing.emit(event.clientX - this.startX);
    }
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  onPointerUp(event: PointerEvent): void {
    if (this.startX !== undefined) {
      this.elementRef.nativeElement.releasePointerCapture(event.pointerId);
      this.startX = undefined;
      this.resized.emit();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
