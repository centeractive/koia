export interface TextExtent {
  width: number;
  height: number;
}

/**
 * reports the height in pixels the enclosing tile needs to show the whole editor content
 */
export class TextFit {

  static readonly SLACK_PX = 1;

  private readonly observer = new ResizeObserver(() => this.scheduleUpdate());
  private frame: number;

  /**
   * @param tile the element whose padding surrounds the host
   * @param host the element filling the content box of the tile
   * @param content the editor content, its last child ending the text
   */
  constructor(private readonly tile: Element, private readonly host: Element, private readonly content: HTMLElement,
    private readonly onFitHeight: (height: number) => void) {
    this.observer.observe(content);
  }

  /**
   * defers the update to the next frame, as the reported height changes the layout of the observed content,
   * skipped while the tile is dragged, since it is then measured outside of its layout
   */
  private scheduleUpdate(): void {
    cancelAnimationFrame(this.frame);
    if (!this.tile.classList.contains('cdk-drag-dragging')) {
      this.frame = requestAnimationFrame(() => this.update());
    }
  }

  update(): void {
    this.onFitHeight(this.fitHeight());
  }

  /**
   * measures the content up to its last child, as the content itself may be stretched to the tile
   */
  fitHeight(): number {
    const textBottom = this.content.lastElementChild.getBoundingClientRect().bottom - this.content.getBoundingClientRect().top;
    const paddingBottom = parseFloat(getComputedStyle(this.content).paddingBottom);
    return Math.ceil(textBottom + paddingBottom + this.tile.clientHeight - this.host.clientHeight);
  }

  /**
   * measures each text node on its own, as a range over the content would include the full width paragraphs,
   * 0 when there is no text
   */
  fitWidth(): number {
    const range = document.createRange();
    const walker = document.createTreeWalker(this.content, NodeFilter.SHOW_TEXT);
    let left = Infinity;
    let right = -Infinity;
    while (walker.nextNode()) {
      range.selectNodeContents(walker.currentNode);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0) {
        left = Math.min(left, rect.left);
        right = Math.max(right, rect.right);
      }
    }
    if (right < left) {
      return 0;
    }
    const style = getComputedStyle(this.content);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    return Math.ceil(right - left + padding + this.tile.clientWidth - this.host.clientWidth) + TextFit.SLACK_PX;
  }

  fitExtent(): TextExtent {
    return { width: this.fitWidth(), height: this.fitHeight() };
  }

  disconnect(): void {
    this.observer.disconnect();
    cancelAnimationFrame(this.frame);
  }
}
