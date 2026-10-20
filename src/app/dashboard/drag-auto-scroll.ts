type PointerEventConstructor = new (type: string, init: MouseEvent | TouchEvent) => Event;

/**
 * scrolls the scroller while the pointer of a drag is near its top or bottom edge, as CDK scrolls only drop lists;
 * the pointer move is replayed after each step, so the dragged element follows the scrolled content
 */
export class DragAutoScroll {

  static readonly EDGE_PX = 48;
  static readonly STEP_PX = 12;

  private event: MouseEvent | TouchEvent;
  private direction = 0;
  private frame: number;

  constructor(private readonly scroller: HTMLElement) { }

  follow(event: MouseEvent | TouchEvent): void {
    this.event = event;
    this.direction = this.directionAt(this.clientYOf(event));
    if (this.direction !== 0 && this.frame === undefined) {
      this.frame = requestAnimationFrame(() => this.step());
    }
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = undefined;
  }

  private step(): void {
    this.frame = undefined;
    const scrollTop = this.scroller.scrollTop;
    this.scroller.scrollBy(0, this.direction * DragAutoScroll.STEP_PX);
    if (this.scroller.scrollTop !== scrollTop) {
      const event = this.event;
      document.dispatchEvent(new (event.constructor as PointerEventConstructor)(event.type, event));
    }
  }

  private directionAt(clientY: number): number {
    const rect = this.scroller.getBoundingClientRect();
    if (clientY < rect.top + DragAutoScroll.EDGE_PX) {
      return -1;
    }
    return clientY > rect.bottom - DragAutoScroll.EDGE_PX ? 1 : 0;
  }

  private clientYOf(event: MouseEvent | TouchEvent): number {
    return 'targetTouches' in event ? (event.targetTouches[0] ?? event.changedTouches[0]).clientY : event.clientY;
  }
}
