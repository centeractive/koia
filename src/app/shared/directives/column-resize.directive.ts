import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[koiaColumnResize]',
  standalone: false
})
export class ColumnResizeDirective {

  @Output() resizing = new EventEmitter<number>();
  @Output() resized = new EventEmitter<void>();

  private startX: number | undefined;
  private scale = 1;

  constructor(private elementRef: ElementRef<HTMLElement>) { }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    const handle = this.elementRef.nativeElement;
    handle.setPointerCapture(event.pointerId);
    this.startX = event.clientX;
    this.scale = handle.offsetWidth ? handle.getBoundingClientRect().width / handle.offsetWidth : 1;
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.startX !== undefined) {
      this.resizing.emit((event.clientX - this.startX) / this.scale);
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
