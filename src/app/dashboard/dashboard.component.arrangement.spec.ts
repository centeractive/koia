import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { ComponentFixture, fakeAsync, waitForAsync } from '@angular/core/testing';
import { CanvasPaging, ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { intersects } from './free-layout';
import { DashboardComponent } from './dashboard.component';
import { configureDashboardTestBed, createDashboardHarness, DashboardHarness, useRenderedViewport } from './dashboard.component.spec-harness';

describe('DashboardComponent arrangement', () => {

  useRenderedViewport();

  let harness: DashboardHarness;
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  beforeEach(waitForAsync(() => {
    harness = createDashboardHarness();
    configureDashboardTestBed(harness);
  }));

  beforeEach(fakeAsync(() => {
    harness.createComponent();
    ({ fixture, component } = harness);
    harness.init();
  }));

  afterEach(() => vi.restoreAllMocks());

  function render(rects: number[][], overlapAllowed = false): SummaryContext[] {
    component.canvasOverlapAllowed = overlapAllowed;
    return harness.renderCanvasSummaries(rects, CanvasPaging.LANDSCAPE);
  }

  function rectsOf(contexts: ElementContext[]): number[][] {
    return contexts.map(c => [c.x, c.y, c.width, c.height]);
  }

  function canvasTiles(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('#div_canvas .div_tile'));
  }

  /**
   * @param end ends the interaction showing the tile shifted
   */
  function expectDroppedWhereShown(tile: ElementContext, end: () => void): void {
    const scale = harness.canvasScale();
    const [, dy] = component.shiftTranslateOf(tile).split(' ').map(parseFloat);
    const shownLayerY = harness.layerY(tile.y) + dy / scale;
    end();
    expect(harness.layerY(tile.y)).toBeCloseTo(shownLayerY, 3);
  }

  function renderChartsSpy(): ReturnType<typeof vi.spyOn> {
    return vi.spyOn(component as unknown as { renderChartsOnceCreated: (c: ElementContext[]) => void }, 'renderChartsOnceCreated');
  }

  describe('canvas row insertion', () => {

    it('should shift the tiles of the row live while a tile is moved into it, others staying', () => {

      // given
      const [first, moved, aside] = render([[0, 0, 300, 200], [310, 300, 300, 200], [900, 600, 300, 200]]);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 0);

      // when
      component.onFreeMoving(harness.moveEventInMiddle());
      fixture.detectChanges();

      // then
      const [dx, dy] = component.shiftTranslateOf(first).split(' ').map(parseFloat);
      expect(dx).toBeCloseTo(310 * harness.canvasScale(), 5);
      expect(dy).toBe(0);
      expect(canvasTiles()[0].classList).toContain('div_row_shifting');
      expect(component.resizePreview.left).toBeCloseTo(harness.layerX(0) * harness.canvasScale(), 5);
      expect(component.canvasGuides).toEqual([]);
      expect(component.shiftTranslateOf(aside)).toBeUndefined();
    });

    it('should apply the arrangement on drop and bring the moved tile to front', () => {

      // given
      const [first, moved] = render([[0, 0, 300, 200], [310, 300, 300, 200]]);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 0);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect(rectsOf([moved, first])).toEqual([[0, 0, 300, 200], [310, 0, 300, 200]]);
      expect(moved.z).toBeGreaterThan(first.z);
      expect(component.resizePreview).toBeUndefined();
      expect(component.shiftTranslateOf(first)).toBeUndefined();
    });

    it('should render charts again of tiles wrapped onto the next page', () => {

      // given
      const contexts = render([[0, 750, 260, 190], [270, 750, 260, 190], [540, 750, 260, 190], [810, 750, 260, 190], [1080, 750, 260, 190],
        [0, 0, 260, 190]]);
      const moved = contexts[5];
      const renderCharts = renderChartsSpy();
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 750);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect(renderCharts).toHaveBeenCalledWith([contexts[4]]);
      expect([contexts[4].x, contexts[4].y]).toEqual([0, 960]);
    });

    it('should shift the tiles pushed down below a taller inserted tile', () => {

      // given
      const [first, below, moved] = render([[0, 0, 300, 200], [0, 210, 300, 200], [700, 500, 300, 400]]);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 0);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect([[moved.x, moved.y], [first.x, first.y], [below.x, below.y]]).toEqual([[0, 0], [310, 0], [0, 410]]);
    });

    it('should keep the own width of a moved tile clipped at the page edge', () => {

      // given
      const [first, moved] = render([[0, 0, 700, 200], [900, 300, 600, 200]]);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 0);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect([moved.x, first.x]).toEqual([0, 610]);
    });

    it('should not insert while overlapping is allowed', () => {

      // given
      const [first, moved] = render([[0, 0, 300, 200], [310, 300, 300, 200]], true);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 0);

      // when
      component.onFreeMoving(harness.moveEventInMiddle());

      // then
      expect(component.shiftTranslateOf(first)).toBeUndefined();
      expect(component.isRowShifting(first)).toBe(false);
      expect(component.resizePreview).toBeUndefined();
    });

    it('should push the tile covered by tiles moved together while they are dragged, where it lands when dropped', () => {

      // given
      const [first, moved, follower] = render([[0, 0, 300, 200], [310, 300, 300, 200], [620, 300, 300, 200]]);
      component.tileSelection.selectAll([moved, follower], false);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 0);

      // when
      component.onFreeMoving(harness.moveEventInMiddle());

      // then
      expect([component.isRowShifting(first), component.isRowShifting(moved), component.isRowShifting(follower)]).toEqual([true, false, false]);
      expect(component.resizePreview).toBeUndefined();
      expectDroppedWhereShown(first, () => component.onFreeMoveEnded(moved, harness.dragEnd()));
    });

    it('should push the tile covered by a tile not fitting the page of its row while it is dragged, where it lands when dropped', () => {

      // given
      const pageHeight = PageFormat.LANDSCAPE.height;
      const [covered, moved] = render([[0, pageHeight - 250, 400, 200], [0, 50, 400, 400]]);
      component.onFreeMoveStarted(moved);

      // when
      harness.constrainMoveTo(100, pageHeight - 230);
      component.onFreeMoving(harness.moveEventInMiddle());

      // then
      expect(component.isRowShifting(covered)).toBe(true);
      expectDroppedWhereShown(covered, () => component.onFreeMoveEnded(moved, harness.dragEnd()));
      expect(covered.y).toBeGreaterThanOrEqual(pageHeight);
    });

    it('should push nothing while overlapping is allowed', () => {

      // given
      const [first, moved] = render([[0, 0, 300, 200], [310, 300, 300, 200]], true);
      component.onFreeMoveStarted(moved);

      // when
      harness.constrainMoveTo(0, 0);

      // then
      expect([component.isRowShifting(first), component.shiftTranslateOf(first)]).toEqual([false, undefined]);
    });

    it('should push the tile covered by tiles resized together while they are resized, where it lands when the resize ends', () => {

      // given
      const [, , below] = render([[0, 0, 300, 200], [310, 0, 300, 200], [0, 300, 300, 200]]);
      component.tileSelection.selectAll(component.elementContexts.slice(0, 2), false);
      fixture.detectChanges();
      const scale = harness.canvasScale();
      const resize = harness.resizeEvent(610 * scale, 400 * scale, 0, 0, { bottom: 200 * scale });
      component.onGroupResizeStart();

      // when
      component.onGroupResizing(resize);

      // then
      expect(component.isRowShifting(below)).toBe(true);
      expectDroppedWhereShown(below, () => component.onGroupResizeEnd(resize));
      expect(below.y).toBe(410);
    });

    it('should keep the scroll position of the screen view when a tile dragged below the content is dropped', () => {

      // given
      const [tile] = harness.renderCanvasSummaries([[0, 0, 300, 200]], CanvasPaging.NONE);
      const scale = harness.canvasScale();
      const content = component.divContentRef.nativeElement;
      const tileElement = canvasTiles()[0];
      component.onFreeMoveStarted(tile);
      harness.constrainMoveTo(0, 3000);
      tileElement.style.transform = 'translateY(' + 3000 * scale + 'px)';
      content.scrollTop = content.scrollHeight - content.clientHeight;
      const scrollTop = content.scrollTop;
      const dragEnd = {
        source: {
          reset: (): void => {
            tileElement.style.transform = '';
            expect(content.scrollHeight).toBeGreaterThan(0);
          }
        }
      } as unknown as CdkDragEnd;

      // when
      component.onFreeMoveEnded(tile, dragEnd);

      // then
      expect(tile.y).toBe(3000);
      expect(content.scrollTop).toBe(scrollTop);
    });

    it('should not insert a moved note', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      const note = harness.addNoteContext(400, 400, 0);
      component.onFreeMoveStarted(note);
      harness.constrainMoveTo(0, 0);

      // when
      component.onFreeMoving(harness.moveEventInMiddle());

      // then
      expect(component.shiftTranslateOf(first)).toBeUndefined();
      expect(component.isRowShifting(note)).toBe(false);
    });

    it('should not shift the moved tile nor notes', () => {

      // given
      const [, moved] = render([[0, 0, 300, 200], [310, 300, 300, 200]]);
      const note = harness.addNoteContext(400, 400, 0);
      component.onFreeMoveStarted(moved);

      // when
      harness.constrainMoveTo(0, 0);

      // then
      expect([component.isRowShifting(moved), component.isRowShifting(note)]).toEqual([false, false]);
    });

it('should keep a tile reaching past the page edge in its row while a tile before it moves left', () => {

      // given
      const [, moved, last] = render([[0, 0, 466, 200], [476, 0, 456, 200], [942, 0, 459, 200]]);
      component.onFreeMoveStarted(moved);

      // when
      harness.constrainMoveTo(400, 0);

      // then
      expect(component.shiftTranslateOf(last)).toBeUndefined();
    });

    it('should move a tile after the last of a row ending at the page edge with the pointer beyond it', () => {

      // given
      const [, moved, last] = render([[0, 10, 460, 200], [470, 10, 460, 200], [940, 10, 460, 200]]);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(1100, 10);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect([moved.x, last.x]).toEqual([940, 470]);
    });

    it('should keep tiles moved together across a page break from covering each other', () => {

      // given
      const [upper, lower] = render([[0, 700, 300, 240], [0, 960, 300, 800]]);
      component.tileSelection.selectAll([upper, lower], false);
      component.onFreeMoveStarted(lower);
      harness.constrainMoveTo(0, 1110);

      // when
      component.onFreeMoveEnded(lower, harness.dragEnd());

      // then
      expect(intersects(component.freeLayout.rectOf(upper), component.freeLayout.rectOf(lower))).toBe(false);
    });

    it('#onFreeMoveStarted should move the focus away from a title being edited', () => {

      // given
      const [tile] = render([[0, 0, 300, 200]]);
      const title = document.createElement('textarea');
      document.body.appendChild(title);
      title.focus();

      // when
      component.onFreeMoveStarted(tile);

      // then
      title.remove();
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('canvas resize making room', () => {

    function rightEdgeEvent(width: number): ReturnType<typeof harness.resizeEvent> {
      const scale = harness.canvasScale();
      return harness.resizeEvent(width * scale, 200 * scale, 0, 0, { right: (width - 300) * scale });
    }

    it('#onFreeResizing should shift the right neighbour live and preview the resized tile', () => {

      // given
      const [resized, neighbour] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      component.onFreeResizeStart(resized);

      // when
      component.onFreeResizing(resized, rightEdgeEvent(400));

      // then
      const [dx] = component.shiftTranslateOf(neighbour).split(' ').map(parseFloat);
      expect(dx).toBeCloseTo(100 * harness.canvasScale(), 5);
      expect(component.resizePreview.width).toBeCloseTo(400 * harness.canvasScale(), 5);
    });

    it('#onFreeResizeEnd should apply the arrangement previewed', () => {

      // given
      const [resized, neighbour] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      component.onFreeResizeStart(resized);
      component.onFreeResizing(resized, rightEdgeEvent(400));
      const persist = harness.requestPersistSpy();

      // when
      component.onFreeResizeEnd(resized, rightEdgeEvent(400));

      // then
      expect(rectsOf([resized, neighbour])).toEqual([[0, 0, 400, 200], [410, 0, 300, 200]]);
      expect(persist).toHaveBeenCalled();
      expect(component.resizePreview).toBeUndefined();
    });

    it('#onFreeResizing should show no guides for an edge stopped at the left neighbour', () => {

      // given
      const [, resized] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      component.onFreeResizeStart(resized);
      const scale = harness.canvasScale();

      // when
      component.onFreeResizing(resized, harness.resizeEvent(410 * scale, 200 * scale, 200 * scale, 0, { left: -110 * scale }));

      // then
      expect(component.canvasGuides).toEqual([]);
      expect(component.resizePreview.left).toBeCloseTo(harness.layerX(310) * scale, 5);
    });

    it('#onFreeResizing should not shift the neighbour while overlapping is allowed', () => {

      // given
      const [resized, neighbour] = render([[0, 0, 300, 200], [310, 0, 300, 200]], true);
      component.onFreeResizeStart(resized);

      // when
      component.onFreeResizing(resized, rightEdgeEvent(400));

      // then
      expect(component.shiftTranslateOf(neighbour)).toBeUndefined();
    });

    it('#onFreeResizeEnd should keep the own bottom of a grown text tile resized taller than its fit height', () => {

      // given
      render([]);
      const textTile = new TextBoxContext(harness.scene.columns, true);
      textTile.setPosition(0, 0);
      textTile.setSize(300, 100);
      textTile.fitHeight = 150;
      component.elementContexts = [textTile];
      fixture.detectChanges();
      component.onFreeResizeStart(textTile);
      const scale = harness.canvasScale();

      // when
      component.onFreeResizeEnd(textTile, harness.resizeEvent(300 * scale, 250 * scale, 0, 0, { bottom: 100 * scale }));

      // then
      expect(rectsOf([textTile])).toEqual([[0, 0, 300, 200]]);
    });

    it('#onFreeResizeEnd should change nothing without a moved edge', () => {

      // given
      const [resized, neighbour] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      component.onFreeResizeStart(resized);
      const persist = harness.requestPersistSpy();

      // when
      component.onFreeResizeEnd(resized, harness.resizeEvent(300 * harness.canvasScale(), 200 * harness.canvasScale(), 0, 0, { right: 0 }));

      // then
      expect(rectsOf([resized, neighbour])).toEqual([[0, 0, 300, 200], [310, 0, 300, 200]]);
      expect(persist).not.toHaveBeenCalled();
    });
  });

  describe('grid resize over the left neighbour', () => {

    let contexts: SummaryContext[];
    let tiles: HTMLElement[];

    beforeEach(() => {
      contexts = [new SummaryContext(harness.scene.columns), new SummaryContext(harness.scene.columns), new SummaryContext(harness.scene.columns)];
      component.elementContexts = contexts;
      fixture.detectChanges();
      tiles = Array.from(fixture.nativeElement.querySelectorAll('#div_grid .div_tile'));
    });

    function leftEdgeEvent(left: number): ReturnType<typeof harness.resizeEvent> {
      const third = tiles[2];
      return harness.resizeEvent(third.offsetLeft + third.offsetWidth - left, third.offsetHeight, left, 0, { left: left - third.offsetLeft });
    }

    it('#onGridResizing should move the tile before the neighbour it passes, live and without changing the model', () => {

      // given
      const [first, second, third] = contexts;
      component.onGridResizeStart(third);
      const persist = harness.requestPersistSpy();
      const sizeChanged = vi.spyOn(third, 'fireSizeChanged');

      // when
      component.onGridResizing(third, leftEdgeEvent(tiles[1].offsetLeft));

      // then
      expect(component.elementContexts).toEqual([first, third, second]);
      expect(component.gridCellStyleOf(third)).toEqual({ 'grid-column': 'auto / span 2', 'grid-row': 'auto / span 1' });
      expect(third.gridColumnSpan).toBe(1);
      expect(Math.abs(component.resizePreview.left - tiles[1].offsetLeft)).toBeLessThanOrEqual(1);
      expect(persist).not.toHaveBeenCalled();
      expect(sizeChanged).not.toHaveBeenCalled();
    });

    it('#onGridResizing should restore the order once the edge goes back', () => {

      // given
      const [, , third] = contexts;
      component.onGridResizeStart(third);
      component.onGridResizing(third, leftEdgeEvent(tiles[1].offsetLeft));

      // when
      component.onGridResizing(third, leftEdgeEvent(tiles[2].offsetLeft));

      // then
      expect(component.elementContexts).toEqual(contexts);
      expect(component.gridCellStyleOf(third)).toEqual({ 'grid-column': 'auto / span 1', 'grid-row': 'auto / span 1' });
    });

    it('#onGridResizeEnd should store order and span, persist and refresh the position of the configured tile', () => {

      // given
      const [first, second, third] = contexts;
      component.selectedContext = second;
      component.selectedContextPosition = 2;
      component.onGridResizeStart(third);
      const persist = harness.requestPersistSpy();

      // when
      component.onGridResizeEnd(third, leftEdgeEvent(tiles[1].offsetLeft));

      // then
      expect(component.elementContexts).toEqual([first, third, second]);
      expect(third.gridColumnSpan).toBe(2);
      expect(component.selectedContextPosition).toBe(3);
      expect(persist).toHaveBeenCalled();
      expect(component.gridCellStyleOf(third)).toEqual({ 'grid-column': 'auto / span 2', 'grid-row': 'auto / span 1' });
    });

    it('#onGridResizeEnd should not refresh a position without configured tile', () => {

      // given
      const [, , third] = contexts;
      component.onGridResizeStart(third);

      // when
      component.onGridResizeEnd(third, leftEdgeEvent(tiles[1].offsetLeft));

      // then
      expect(component.selectedContextPosition).toBeUndefined();
    });
  });
});
