import { Point } from '@angular/cdk/drag-drop';
import { ElementContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import { CommonUtils } from 'app/shared/utils';
import { Alignment, Axis, CanvasArrange } from './canvas-arrange';
import { CanvasClipboard } from './canvas-clipboard';
import { commandOf, nudgeOf } from './canvas-shortcuts';
import { boundsOf, FreeLayout, Rect } from './free-layout';
import { OverlapResolver } from './overlap-resolver';
import { RowRoom } from './row-room';
import { TileSelection } from './tile-selection';
import { WidthScale } from './width-scale';
import { ZOrder } from './z-order';

export interface CanvasEditorHost {
  readonly selection: TileSelection<ElementContext>;
  contexts(): ElementContext[];
  remove(context: ElementContext): void;
  toViewElements(contexts: ElementContext[]): ViewElement[];
  /**
   * @returns the contexts restored from the elements and added to the canvas
   */
  append(elements: ViewElement[]): ElementContext[];
  /**
   * @param changedPage the contexts moved onto another page or added, which are rendered again
   * @param fixed the tiles keeping their position while covered tiles are pushed down
   */
  arranged(changedPage: ElementContext[], fixed: ElementContext[]): void;
  reordered(): void;
  sceneId(): string;
  /**
   * @returns whether tiles may cover each other
   */
  overlapAllowed(): boolean;
}

/**
 * the editing commands of the canvas, the selection stays after every command
 */
export class CanvasEditor {

  private readonly arrange: CanvasArrange;
  private readonly overlapResolver: OverlapResolver;
  private readonly rowRoom: RowRoom;
  private readonly zOrder = new ZOrder();

  constructor(private readonly host: CanvasEditorHost, private readonly clipboard: CanvasClipboard, private readonly layout: FreeLayout) {
    this.arrange = new CanvasArrange(layout);
    this.overlapResolver = new OverlapResolver(layout);
    this.rowRoom = new RowRoom(layout);
  }

  /**
   * @returns the selected tiles when the context is selected or omitted, the context alone otherwise
   */
  targetsOf(context?: ElementContext): ElementContext[] {
    return !context || this.host.selection.isSelected(context) ? this.host.selection.tiles() : [context];
  }

  toFront(targets: ElementContext[]): void {
    this.zOrder.toFront(targets, this.host.contexts());
    this.host.reordered();
  }

  toBack(targets: ElementContext[]): void {
    this.zOrder.toBack(targets, this.host.contexts());
    this.host.reordered();
  }

  forward(targets: ElementContext[]): void {
    this.zOrder.forward(targets, this.host.contexts());
    this.host.reordered();
  }

  backward(targets: ElementContext[]): void {
    this.zOrder.backward(targets, this.host.contexts());
    this.host.reordered();
  }

  align(targets: ElementContext[], alignment: Alignment): void {
    this.placeArranged(targets, this.arrange.align(this.rectsOf(targets), alignment));
  }

  distribute(targets: ElementContext[], axis: Axis): void {
    this.placeArranged(targets, this.arrange.distribute(this.rectsOf(targets), axis));
  }

  /**
   * while overlapping is prevented, the arranged tiles keep their place, covering each other the lower ones go below
   */
  private placeArranged(targets: ElementContext[], rects: Rect[]): void {
    if (this.host.overlapAllowed()) {
      this.place(targets, rects, []);
    } else {
      this.place(targets, this.overlapResolver.separated(targets, rects), targets.filter(c => !c.isOverlay()));
    }
  }

  /**
   * while overlapping is prevented, a single tile nudged makes room in its row
   */
  nudge(targets: ElementContext[], dx: number, dy: number): void {
    const nudged = this.arrange.nudge(this.rectsOf(targets), dx, dy);
    const tiles = targets.filter(c => !c.isOverlay());
    if (this.host.overlapAllowed() || tiles.length !== 1) {
      this.place(targets, nudged, tiles);
    } else {
      this.nudgeInRow(targets, nudged, tiles[0]);
    }
  }

  /**
   * @param nudged the rects of the targets nudged, the overlays among them keep theirs
   */
  private nudgeInRow(targets: ElementContext[], nudged: Rect[], tile: ElementContext): void {
    const others = this.host.contexts().filter(c => c !== tile && !c.isOverlay());
    const before = this.layout.arrangedRectOf(tile);
    const { x, y } = nudged[targets.indexOf(tile)];
    const arrangement = this.rowRoom.makeRoom({ ...before, x, y }, before, others.map(c => this.layout.arrangedRectOf(c)), 'move');
    const changedPage = this.layout.contextsMovedToOtherPage([...targets, ...others], () => {
      targets.forEach((c, i) => c.setPosition(nudged[i].x, nudged[i].y));
      tile.setPosition(arrangement.target.x, arrangement.target.y);
      others.forEach((c, i) => c.setPosition(arrangement.rects[i].x, arrangement.rects[i].y));
    });
    this.host.arranged(changedPage, [tile, ...others]);
  }

  delete(targets: ElementContext[]): void {
    targets.forEach(c => this.host.remove(c));
  }

  copy(targets: ElementContext[]): void {
    this.clipboard.copy(this.host.sceneId(), this.host.toViewElements(targets), this.layout.pageFormat.width, false);
  }

  cut(targets: ElementContext[]): void {
    this.clipboard.copy(this.host.sceneId(), this.host.toViewElements(targets), this.layout.pageFormat.width, true);
    this.delete(targets);
  }

  duplicate(targets: ElementContext[]): void {
    const elements = CommonUtils.clone(this.host.toViewElements(targets)) as ViewElement[];
    this.add(elements, this.layout.pageFormat.width, () => ({ x: FreeLayout.STEP, y: FreeLayout.STEP }));
  }

  canPaste(): boolean {
    return this.clipboard.has(this.host.sceneId());
  }

  /**
   * @param at the layout point to paste the top left corner of the copied tiles at, offset from the copied tiles otherwise
   */
  paste(at?: Point): void {
    const { elements, pageWidth, steps } = this.clipboard.paste();
    this.add(elements, pageWidth, bounds => at ? { x: at.x - bounds.x, y: at.y - bounds.y } : { x: steps * FreeLayout.STEP, y: steps * FreeLayout.STEP });
  }

  selectAll(): void {
    this.host.selection.selectAll(this.host.contexts(), false);
  }

  /**
   * @returns whether the key was handled, the keys acting on selected tiles are not while none are selected, copying and cutting
   * neither while a text is selected
   */
  handleKey(event: KeyboardEvent): boolean {
    const command = commandOf(event);
    const nudge = nudgeOf(event);
    const targets = this.host.selection.tiles();
    if (command === 'selectAll') {
      this.selectAll();
      return true;
    }
    if (command === 'paste') {
      const pastable = this.canPaste();
      if (pastable) {
        this.paste();
      }
      return pastable;
    }
    if (!targets.length || ((command === 'copy' || command === 'cut') && document.getSelection()?.isCollapsed === false)) {
      return false;
    }
    if (nudge) {
      this.nudge(targets, nudge.x, nudge.y);
      return true;
    }
    const action = command && this.targetActions()[command];
    action?.(targets);
    return !!action;
  }

  private targetActions(): Record<string, (targets: ElementContext[]) => void> {
    return {
      copy: t => this.copy(t),
      cut: t => this.cut(t),
      duplicate: t => this.duplicate(t),
      delete: t => this.delete(t),
      toFront: t => this.toFront(t),
      toBack: t => this.toBack(t),
      forward: t => this.forward(t),
      backward: t => this.backward(t)
    };
  }

  private rectsOf(contexts: ElementContext[]): Rect[] {
    return contexts.map(c => this.layout.rectOf(c));
  }

  private place(targets: ElementContext[], rects: Rect[], fixed: ElementContext[]): void {
    const changedPage = this.layout.contextsMovedToOtherPage(targets, () => targets.forEach((c, i) => c.setPosition(rects[i].x, rects[i].y)));
    this.host.arranged(changedPage, fixed);
  }

  /**
   * @param pageWidth width of the pages the elements were copied from, the tiles are scaled to the width of the canvas pages
   * @param offsetOf the offset of the tiles from their copied position, given their bounds
   */
  private add(elements: ViewElement[], pageWidth: number, offsetOf: (bounds: Rect) => Point): void {
    const others = this.host.contexts();
    const added = this.host.append(elements);
    const widthScale = new WidthScale(pageWidth, this.layout.pageFormat.width);
    added.forEach(c => {
      // the rect on the pages copied from, rectOf would clip it to the width of the pages pasted into
      const scaled = widthScale.scale({ x: c.x, y: c.y, width: c.width, height: c.height }, this.layout.minSizeOf(c).width);
      c.setPosition(scaled.x, scaled.y);
      c.setSize(scaled.width, scaled.height);
    });
    const rects = this.rectsOf(added);
    const offset = offsetOf(boundsOf(rects));
    this.arrange.moveBy(rects, offset.x, offset.y).forEach((r, i) => added[i].setPosition(r.x, r.y));
    this.zOrder.toFront(added, this.host.contexts());
    this.host.selection.selectAll(added, false);
    this.host.arranged(added, others.filter(c => !c.isOverlay()));
  }
}
