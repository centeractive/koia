import { NgZone, Renderer2 } from '@angular/core';
import { listenToDocumentOutsideAngular } from 'app/shared/ui/document-listener';

/**
 * calls back once a press within the tile is released, after all handlers of that release, telling whether it resized the tile
 */
export class TileRelease {

  static readonly RESIZE_ACTIVE_CLASS = 'resize-active';

  private removeListener: () => void;
  private timer: ReturnType<typeof setTimeout>;

  constructor(private readonly zone: NgZone, private readonly renderer: Renderer2, private readonly tile: Element) { }

  /**
   * the resize class is read on pointerup, as the resizable removes it on the subsequent mouseup
   */
  awaitRelease(onRelease: (resized: boolean) => void): void {
    this.cancel();
    this.removeListener = listenToDocumentOutsideAngular(this.zone, this.renderer, 'pointerup', () => {
      this.removeReleaseListener();
      const resized = this.tile.classList.contains(TileRelease.RESIZE_ACTIVE_CLASS);
      this.timer = setTimeout(() => this.zone.run(() => onRelease(resized)));
    });
  }

  cancel(): void {
    this.removeReleaseListener();
    clearTimeout(this.timer);
  }

  private removeReleaseListener(): void {
    this.removeListener?.();
    this.removeListener = undefined;
  }
}
