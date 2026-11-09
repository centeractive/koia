import { Directive, EventEmitter, HostListener, inject, NgZone, OnDestroy, Output, Renderer2 } from '@angular/core';
import { listenToDocumentOutsideAngular } from 'app/shared/ui/document-listener';

/**
 * emits clicks of a drag handle whose pointer never moved far enough from the press to start a drag, along its whole path,
 * the distance measured as the CDK does
 */
@Directive({
  selector: '[koiaClickWithoutDrag]',
  standalone: false
})
export class ClickWithoutDragDirective implements OnDestroy {

  /** the default drag start threshold of the CDK */
  static readonly DRAG_THRESHOLD_PX = 5;

  @Output() clickWithoutDrag = new EventEmitter<MouseEvent>();

  private readonly zone = inject(NgZone);
  private readonly renderer = inject(Renderer2);
  private removeListeners: (() => void)[] = [];
  private pressX: number;
  private pressY: number;
  private dragged = false;

  /**
   * the press is taken from the pointer event, as content within the handle may stop the mouse event
   */
  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    this.stopFollowing();
    this.pressX = event.clientX;
    this.pressY = event.clientY;
    this.dragged = false;
    this.removeListeners = [
      this.listen('pointermove', e => this.followMove(e as PointerEvent)),
      this.listen('pointerup', () => this.stopFollowing()),
      this.listen('pointercancel', () => this.stopFollowing())
    ];
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.dragged && this.distanceTo(event) < ClickWithoutDragDirective.DRAG_THRESHOLD_PX) {
      this.clickWithoutDrag.emit(event);
    }
  }

  ngOnDestroy(): void {
    this.stopFollowing();
  }

  private listen(eventName: string, handler: (event: Event) => void): () => void {
    return listenToDocumentOutsideAngular(this.zone, this.renderer, eventName, handler);
  }

  private followMove(event: PointerEvent): void {
    if (this.distanceTo(event) >= ClickWithoutDragDirective.DRAG_THRESHOLD_PX) {
      this.dragged = true;
    }
  }

  private distanceTo(event: MouseEvent): number {
    return Math.abs(event.clientX - this.pressX) + Math.abs(event.clientY - this.pressY);
  }

  private stopFollowing(): void {
    this.removeListeners.forEach(remove => remove());
    this.removeListeners = [];
  }
}
