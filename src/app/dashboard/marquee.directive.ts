import { Point } from '@angular/cdk/drag-drop';
import { Directive, ElementRef, EventEmitter, HostListener, inject, NgZone, OnDestroy, Output, Renderer2 } from '@angular/core';
import { listenToDocumentOutsideAngular } from 'app/shared/ui/document-listener';
import { ClientRect } from './canvas-layer-mapping';
import { ClickWithoutDragDirective } from './click-without-drag.directive';
import { DragAutoScroll } from './drag-auto-scroll';
import { blurActiveElement, isAdditiveClick } from './selecting-click';

export interface MarqueeEnd {
  /** the marked area in client pixels */
  rect: ClientRect;
  additive: boolean;
  /** whether the tiles touched by the area are marked, otherwise those lying within */
  touching: boolean;
}

/**
 * marks an area by dragging the pointer from a press beside the tiles, or with Alt from anywhere, the content scrolls while the
 * pointer is near its top or bottom edge
 */
@Directive({
  selector: '[koiaMarquee]',
  standalone: false
})
export class MarqueeDirective implements OnDestroy {

  static readonly MARQUEE_CLASS = 'koia-marquee';

  /** emits whether the press adds to the selection */
  @Output() marqueeStart = new EventEmitter<boolean>();
  @Output() marqueeEnd = new EventEmitter<MarqueeEnd>();

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private readonly renderer = inject(Renderer2);
  private readonly removeCaptureListeners: (() => void)[];
  private removeListeners: (() => void)[] = [];
  private autoScroll: DragAutoScroll;
  private marquee: HTMLElement;
  private press: Point;
  /** the press in content coordinates, it stays at its spot while the content scrolls */
  private start: Point;
  private additive: boolean;
  private touching: boolean;
  /** whether the press on a tile starting the marquee is kept from the tile, neither dragging nor clicking it */
  private swallowTilePress = false;

  constructor() {
    this.removeCaptureListeners = this.zone.runOutsideAngular(() => [
      this.listenCapturing('pointerdown', () => this.swallowTilePress = false),
      this.listenCapturing('mousedown', event => {
        if (this.swallowTilePress) {
          this.swallow(event);
          blurActiveElement();
        }
      }),
      this.listenCapturing('click', event => {
        if (this.swallowTilePress) {
          this.swallow(event);
          this.swallowTilePress = false;
        }
      })
    ]);
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (this.isMarqueePress(event)) {
      this.end();
      const rect = this.host.getBoundingClientRect();
      this.press = { x: event.clientX, y: event.clientY };
      this.start = { x: event.clientX - rect.left + this.host.scrollLeft, y: event.clientY - rect.top + this.host.scrollTop };
      this.additive = isAdditiveClick(event);
      this.touching = event.altKey;
      this.swallowTilePress = this.isTilePress(event);
      this.autoScroll = new DragAutoScroll(this.host);
      this.removeListeners = [
        this.listen('pointermove', event => this.onPointerMove(event as PointerEvent)),
        this.listen('pointerup', event => this.onPointerUp(event as PointerEvent)),
        this.listen('pointercancel', () => this.end()),
        this.listen('selectstart', event => event.preventDefault())
      ];
      this.marqueeStart.emit(this.additive);
    }
  }

  ngOnDestroy(): void {
    this.end();
    this.removeCaptureListeners.forEach(remove => remove());
  }

  /**
   * a press on the scrollbars or by touch, which scrolls, starts no marquee, neither one on the selection box
   */
  private isMarqueePress(event: PointerEvent): boolean {
    const rect = this.host.getBoundingClientRect();
    return event.button === 0 && event.pointerType !== 'touch' && (event.altKey || !this.isTilePress(event))
      && !(event.target as Element).closest('.div_selection_bounds')
      && event.clientX < rect.left + this.host.clientLeft + this.host.clientWidth
      && event.clientY < rect.top + this.host.clientTop + this.host.clientHeight;
  }

  private isTilePress(event: PointerEvent): boolean {
    return !!(event.target as Element).closest('.div_tile');
  }

  private listenCapturing(eventName: string, handler: (event: Event) => void): () => void {
    this.host.addEventListener(eventName, handler, true);
    return () => this.host.removeEventListener(eventName, handler, true);
  }

  private swallow(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }

  private listen(eventName: string, handler: (event: Event) => void): () => void {
    return listenToDocumentOutsideAngular(this.zone, this.renderer, eventName, handler);
  }

  private onPointerMove(event: PointerEvent): void {
    this.autoScroll.follow(event);
    const distance = Math.max(Math.abs(event.clientX - this.press.x), Math.abs(event.clientY - this.press.y));
    if (!this.marquee && distance >= ClickWithoutDragDirective.DRAG_THRESHOLD_PX) {
      document.getSelection()?.removeAllRanges();
      this.marquee = this.renderer.createElement('div');
      this.renderer.addClass(this.marquee, MarqueeDirective.MARQUEE_CLASS);
      this.renderer.appendChild(document.body, this.marquee);
      this.renderer.setStyle(this.host, 'user-select', 'none');
    }
    if (this.marquee) {
      const rect = this.rectTo(event);
      this.renderer.setStyle(this.marquee, 'left', rect.left + 'px');
      this.renderer.setStyle(this.marquee, 'top', rect.top + 'px');
      this.renderer.setStyle(this.marquee, 'width', rect.right - rect.left + 'px');
      this.renderer.setStyle(this.marquee, 'height', rect.bottom - rect.top + 'px');
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.marquee) {
      const end = { rect: this.rectTo(event), additive: this.additive, touching: this.touching };
      this.zone.run(() => this.marqueeEnd.emit(end));
    }
    this.end();
  }

  private rectTo(event: PointerEvent): ClientRect {
    const hostRect = this.host.getBoundingClientRect();
    const startX = hostRect.left + this.start.x - this.host.scrollLeft;
    const startY = hostRect.top + this.start.y - this.host.scrollTop;
    return {
      left: Math.min(startX, event.clientX),
      top: Math.min(startY, event.clientY),
      right: Math.max(startX, event.clientX),
      bottom: Math.max(startY, event.clientY)
    };
  }

  private end(): void {
    this.autoScroll?.stop();
    this.autoScroll = undefined;
    this.removeListeners.forEach(remove => remove());
    this.removeListeners = [];
    if (this.marquee) {
      this.marquee.remove();
      this.marquee = undefined;
      this.renderer.removeStyle(this.host, 'user-select');
    }
  }
}
