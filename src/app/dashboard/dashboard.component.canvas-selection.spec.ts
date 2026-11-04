import { ComponentFixture, fakeAsync, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CanvasPaging, ElementContext, Route, SummaryContext, TextBoxContext } from 'app/shared/model';
import { DashboardComponent } from './dashboard.component';
import {
  configureDashboardTestBed, createDashboardHarness, DashboardHarness, TextBoxComponent, useRenderedViewport
} from './dashboard.component.spec-harness';
import { DashboardGenerator } from './generator/dashboard-generator';

describe('DashboardComponent canvas selection', () => {

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
  }));

  afterEach(() => vi.restoreAllMocks());

  function render(rects: number[][], overlapAllowed = true, paging = CanvasPaging.LANDSCAPE): SummaryContext[] {
    component.canvasOverlapAllowed = overlapAllowed;
    return harness.renderCanvasSummaries(rects, paging);
  }

  function addTextTile(x: number, y: number, width: number, height: number, fitHeight = 0): TextBoxContext {
    const textTile = new TextBoxContext(harness.scene.columns, true);
    textTile.setPosition(x, y);
    textTile.setSize(width, height);
    textTile.fitHeight = fitHeight;
    textTile.z = 20;
    component.elementContexts = component.elementContexts.concat([textTile]);
    fixture.detectChanges();
    return textTile;
  }

  function canvasTiles(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('#div_canvas .div_tile'));
  }

  function textBoxTile(): HTMLElement {
    return fixture.nativeElement.querySelector('#div_canvas .div_text_box_tile');
  }

  function positionsOf(contexts: ElementContext[]): number[][] {
    return contexts.map(c => [c.x, c.y]);
  }

  /**
   * @returns the client rect around the given layout rect, grown by a few pixels
   */
  function marqueeAround(x: number, y: number, width: number, height: number): { left: number, top: number, right: number, bottom: number } {
    const pages = harness.pagesRect();
    const scale = harness.canvasScale();
    const left = pages.left + harness.layerX(x) * scale - 3;
    const top = pages.top + harness.layerY(y) * scale - 3;
    return { left, top, right: left + width * scale + 6, bottom: top + height * scale + 6 };
  }

  function pressDocument(): void {
    document.dispatchEvent(new PointerEvent('pointerdown'));
  }

  function persistSpy(): ReturnType<typeof harness.requestPersistSpy> {
    return harness.requestPersistSpy();
  }

  describe('multi-selection', () => {

    beforeEach(fakeAsync(() => harness.init()));

    it('#onMarqueeEnd should select tiles and notes lying fully inside marked area', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200], [700, 0, 300, 200]]);
      const note = harness.addNoteContext(50, 50, 0);

      // when
      component.onMarqueeEnd({ rect: marqueeAround(0, 0, 610, 200), additive: false, touching: false });

      // then
      expect(component.tileSelection.tiles()).toEqual([first, second, note]);
    });

    it('#onMarqueeEnd should replace selection when not additive', () => {

      // given
      const [first, , third] = render([[0, 0, 300, 200], [310, 0, 300, 200], [700, 0, 300, 200]]);
      component.tileSelection.select(third);

      // when
      component.onMarqueeEnd({ rect: marqueeAround(0, 0, 300, 200), additive: false, touching: false });

      // then
      expect(component.tileSelection.tiles()).toEqual([first]);
    });

    it('#onMarqueeEnd should add to selection when additive', () => {

      // given
      const [first, , third] = render([[0, 0, 300, 200], [310, 0, 300, 200], [700, 0, 300, 200]]);
      component.tileSelection.select(third);

      // when
      component.onMarqueeEnd({ rect: marqueeAround(0, 0, 300, 200), additive: true, touching: false });

      // then
      expect(component.tileSelection.tiles()).toEqual([third, first]);
    });

    it.each([
      { additive: true, kept: true },
      { additive: false, kept: false }
    ])('#onMarqueeStart with additive $additive should keep selection $kept once press reaches document', ({ additive, kept }) => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      component.tileSelection.select(first);

      // when
      component.onMarqueeStart(additive);
      pressDocument();

      // then
      expect(component.tileSelection.isSelected(first)).toBe(kept);
    });

    it('shift click should add tile to selection and remove it again on canvas', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      harness.clickTile(canvasTiles()[0]);

      // when
      harness.clickTile(canvasTiles()[1], 0, { shiftKey: true });
      const added = component.tileSelection.tiles();
      harness.clickTile(canvasTiles()[1], 0, { ctrlKey: true });

      // then
      expect(added).toEqual([first, second]);
      expect(component.tileSelection.tiles()).toEqual([first]);
    });

    it('shift click should select only clicked tile in grid', () => {

      // given
      component.elementContexts = [new SummaryContext(harness.scene.columns), new SummaryContext(harness.scene.columns)];
      fixture.detectChanges();
      const tiles: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('#div_grid .div_tile'));
      harness.clickTile(tiles[0]);

      // when
      harness.clickTile(tiles[1], 0, { shiftKey: true });

      // then
      expect(component.tileSelection.tiles()).toEqual([component.elementContexts[1]]);
    });

    it('shift click on control of tile should not toggle tile', () => {

      // given
      const [first] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      component.tileSelection.select(first);
      const button = document.createElement('button');
      canvasTiles()[1].querySelector('.div_element').appendChild(button);

      // when
      harness.clickTile(button, 0, { shiftKey: true });

      // then
      expect(component.tileSelection.tiles()).toEqual([]);
    });

    it('shift click on frame of text tile should add it to selection', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      const textTile = addTextTile(400, 0, 300, 200);
      component.tileSelection.select(first);

      // when
      harness.clickTile(textBoxTile(), 0, { shiftKey: true });

      // then
      expect(component.tileSelection.tiles()).toEqual([first, textTile]);
      expect(textBoxTile().classList).toContain('div_text_box_selected');
    });

    it('plain click on frame of text tile should clear selection', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      const textTile = addTextTile(400, 0, 300, 200);
      component.tileSelection.selectAll([first, textTile], false);

      // when
      harness.clickTile(textBoxTile());

      // then
      expect(component.tileSelection.tiles()).toEqual([]);
    });

    it('shift click on text of text tile should leave selection to the text box', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      addTextTile(400, 0, 300, 200);
      component.tileSelection.select(first);

      // when
      harness.clickTile(textBoxTile().querySelector('.p_line'), 0, { shiftKey: true });

      // then
      expect(component.tileSelection.tiles()).toEqual([first]);
    });

    it('shift click on move zone of text tile should select it instead of starting to edit', () => {

      // given
      render([]);
      const textTile = addTextTile(400, 0, 300, 200);
      const textBox = fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance as TextBoxComponent;

      // when
      harness.clickTile(textBoxTile().querySelector('.div_move_zone'), 0, { shiftKey: true });

      // then
      expect(textBox.startEditing).not.toHaveBeenCalled();
      expect(component.tileSelection.tiles()).toEqual([textTile]);
    });

    it('plain click on move zone of text tile should start editing', () => {

      // given
      render([]);
      addTextTile(400, 0, 300, 200);
      const textBox = fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance as TextBoxComponent;

      // when
      harness.clickTile(textBoxTile().querySelector('.div_move_zone'));

      // then
      expect(textBox.startEditing).toHaveBeenCalled();
    });

    it('shift click on move zone of grid text tile should start editing', () => {

      // given
      component.elementContexts = [new TextBoxContext(harness.scene.columns, true)];
      fixture.detectChanges();
      const textBox = fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance as TextBoxComponent;

      // when
      harness.clickTile(fixture.nativeElement.querySelector('#div_grid .div_move_zone'), 0, { shiftKey: true });

      // then
      expect(textBox.startEditing).toHaveBeenCalled();
    });

    it.each([
      { case: 'additive press beside text', modifiers: { shiftKey: true }, target: '.div_element', prevented: true },
      { case: 'plain press', modifiers: {}, target: '.div_element', prevented: false },
      { case: 'additive press on text', modifiers: { shiftKey: true }, target: '.p_line', prevented: false },
      { case: 'additive press on control', modifiers: { shiftKey: true }, target: 'button', prevented: false }
    ])('mousedown should prevent text selection only on $case', ({ modifiers, target, prevented }) => {

      // given
      render([]);
      addTextTile(400, 0, 300, 200);
      textBoxTile().querySelector('.div_element').appendChild(document.createElement('button'));
      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, ...modifiers });

      // when
      textBoxTile().querySelector(target).dispatchEvent(event);

      // then
      expect(event.defaultPrevented).toBe(prevented);
    });

    it('#showsResizeHandles should be true for sole selected tile only', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      component.tileSelection.selectAll([first, second], false);
      const several = component.showsResizeHandles(first);

      // when
      component.tileSelection.select(first);

      // then
      expect(several).toBe(false);
      expect(component.showsResizeHandles(first)).toBe(true);
    });

    it('#removeElement should drop removed tile from selection', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      component.tileSelection.selectAll([first, second], false);

      // when
      component.removeElement(first);

      // then
      expect(component.tileSelection.tiles()).toEqual([second]);
    });

    it('#showCanvas should clear selection', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      component.tileSelection.select(first);

      // when
      component.showCanvas(CanvasPaging.PORTRAIT);

      // then
      expect(component.tileSelection.tiles()).toEqual([]);
    });
  });

  describe('group move', () => {

    beforeEach(fakeAsync(() => harness.init()));

    it('#onFreeMoveEnded should move selected tiles together and keep them selected', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [400, 0, 300, 200]]);
      component.tileSelection.selectAll([first, second], false);
      component.onFreeMoveStarted(first);
      harness.constrainMoveTo(100, 300);

      // when
      component.onFreeMoveEnded(first, harness.dragEnd());

      // then
      expect(positionsOf([first, second])).toEqual([[100, 300], [500, 300]]);
      expect(component.tileSelection.tiles()).toEqual([first, second]);
    });

    it('#onFreeMoveEnded should bring moved tiles to front keeping their stacking order', () => {

      // given
      const [first, second, other] = render([[0, 0, 300, 200], [400, 0, 300, 200], [800, 0, 300, 200]]);
      first.z = undefined;
      component.tileSelection.selectAll([second, first], false);
      component.onFreeMoveStarted(first);
      harness.constrainMoveTo(100, 300);

      // when
      component.onFreeMoveEnded(first, harness.dragEnd());

      // then
      expect(other.z).toBeLessThan(first.z);
      expect(first.z).toBeLessThan(second.z);
    });

    it('#onFreeMoveStarted should move unselected tile alone', () => {

      // given
      const [first, second, third] = render([[0, 0, 300, 200], [400, 0, 300, 200], [800, 0, 300, 200]]);
      component.tileSelection.selectAll([first, second], false);
      component.onFreeMoveStarted(third);
      harness.constrainMoveTo(800, 300);

      // when
      component.onFreeMoveEnded(third, harness.dragEnd());

      // then
      expect(positionsOf([first, second, third])).toEqual([[0, 0], [400, 0], [800, 300]]);
    });

    it('#groupTranslateOf should shift follower by distance moved in pixels', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [400, 0, 300, 200]]);
      component.tileSelection.selectAll([first, second], false);
      component.onFreeMoveStarted(first);
      const scale = harness.canvasScale();

      // when
      harness.constrainMoveTo(100, 300);

      // then
      const [dx, dy] = component.shiftTranslateOf(second).split(' ').map(parseFloat);
      expect(dx).toBeCloseTo(100 * scale, 5);
      expect(dy).toBeCloseTo(300 * scale, 5);
      expect(component.shiftTranslateOf(first)).toBeUndefined();
      expect([component.isGroupFollower(first), component.isGroupFollower(second)]).toEqual([false, true]);
    });

    it('follower should be drawn shifted above other tiles while moved', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [400, 0, 300, 200]]);
      component.tileSelection.selectAll([first, second], false);
      component.onFreeMoveStarted(first);
      harness.constrainMoveTo(100, 300);

      // when
      fixture.detectChanges();

      // then
      const follower = canvasTiles()[1];
      expect(follower.style.translate).not.toBe('');
      expect(getComputedStyle(follower).zIndex).toBe('100000');
    });

    it('#onFreeMoveEnded should render charts again of tiles moved onto another page', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [400, 700, 300, 200]]);
      component.tileSelection.selectAll([first, second], false);
      const renderCharts = vi.spyOn(component as unknown as { renderChartsOnceCreated: (c: ElementContext[]) => void }, 'renderChartsOnceCreated');
      component.onFreeMoveStarted(first);
      harness.constrainMoveTo(0, 500);

      // when
      component.onFreeMoveEnded(first, harness.dragEnd());

      // then
      expect(renderCharts).toHaveBeenCalledWith([first, second]);
      expect(positionsOf([first, second])).toEqual([[0, 950], [400, 1650]]);
    });

    it('#onFreeMoving should show x guides only for group with grown text tile', () => {

      // given
      const [, member] = render([[0, 0, 300, 200], [400, 300, 300, 200]]);
      const textTile = addTextTile(800, 300, 200, 100, 300);
      component.tileSelection.selectAll([member, textTile], false);
      component.onFreeMoveStarted(member);
      harness.constrainMoveTo(312, 3);

      // when
      component.onFreeMoving(harness.moveEventInMiddle());

      // then
      expect(component.canvasGuides.map(g => g.axis)).toEqual(['x']);
    });
  });

  describe('overlap', () => {

    beforeEach(fakeAsync(() => harness.init()));

    it('#onFreeMoveEnded should insert moved tile into the row of the tile it covers when overlapping is prevented', () => {

      // given
      const [moved, covered] = render([[0, 0, 300, 200], [0, 300, 300, 200]], false);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 250);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect(positionsOf([moved, covered])).toEqual([[0, 300], [310, 300]]);
    });

    it('#onFreeMoveEnded should push tile covered by tiles moved together down when overlapping is prevented', () => {

      // given
      const [moved, follower, covered] = render([[0, 0, 300, 200], [310, 0, 300, 200], [0, 300, 300, 200]], false);
      component.tileSelection.selectAll([moved, follower], false);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 250);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect(positionsOf([moved, follower, covered])).toEqual([[0, 250], [310, 250], [0, 460]]);
    });

    it('#onFreeMoveEnded should keep covered tile when overlapping is allowed', () => {

      // given
      const [moved, covered] = render([[0, 0, 300, 200], [0, 300, 300, 200]]);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 250);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect(positionsOf([covered])).toEqual([[0, 300]]);
    });

    it('#onFreeMoveEnded should never push notes', () => {

      // given
      const [moved] = render([[0, 0, 300, 200]], false);
      const note = harness.addNoteContext(0, 300, 0);
      component.onFreeMoveStarted(moved);
      harness.constrainMoveTo(0, 250);

      // when
      component.onFreeMoveEnded(moved, harness.dragEnd());

      // then
      expect(positionsOf([note])).toEqual([[0, 300]]);
    });

    it('#onFreeResizeEnd should push tile covered by resized tile down and persist', () => {

      // given
      const [resized, covered] = render([[0, 0, 300, 200], [0, 300, 300, 200]], false);
      component.onFreeResizeStart(resized);
      const scale = harness.canvasScale();
      const persist = persistSpy();

      // when
      component.onFreeResizeEnd(resized, harness.resizeEvent(300 * scale, 400 * scale, 0, 0, { bottom: 200 * scale }));

      // then
      expect(positionsOf([covered])).toEqual([[0, 410]]);
      expect(persist).toHaveBeenCalled();
    });

    it('#onFreeResizeEnd should not push tiles covered by resized note', () => {

      // given
      const [tile] = render([[0, 300, 300, 200]], false);
      const note = harness.addNoteContext(0, 0, 0);
      component.onFreeResizeStart(note);
      const scale = harness.canvasScale();

      // when
      component.onFreeResizeEnd(note, harness.resizeEvent(300 * scale, 400 * scale, 0, 0, { bottom: 300 * scale }));

      // then
      expect(positionsOf([tile])).toEqual([[0, 300]]);
    });

    it('#onTextFitHeight should push tile below text tile grown beyond its height', () => {

      // given
      const [below] = render([[0, 110, 300, 200]], false);
      const textTile = addTextTile(0, 0, 300, 100);

      // when
      component.onTextFitHeight(textTile, 300 * harness.canvasScale() - 0.001);

      // then
      expect(positionsOf([below])).toEqual([[0, 310]]);
    });

    it('#onTextFitHeight should push nothing while fit height stays below own height', () => {

      // given
      const [below] = render([[0, 110, 300, 200]], false);
      const textTile = addTextTile(0, 0, 300, 100);

      // when
      component.onTextFitHeight(textTile, 50 * harness.canvasScale() - 0.001);

      // then
      expect(positionsOf([below])).toEqual([[0, 110]]);
    });

    it('#onTextFitHeight should push nothing for grown note', () => {

      // given
      const [below] = render([[0, 110, 300, 200]], false);
      const note = harness.addNoteContext(0, 0, 0);

      // when
      component.onTextFitHeight(note, 300 * harness.canvasScale());

      // then
      expect(positionsOf([below])).toEqual([[0, 110]]);
    });

    it('#toggleOverlap should prevent overlapping, push overlapping tiles apart and persist', () => {

      // given
      const [top, overlapping] = render([[0, 0, 300, 200], [0, 100, 300, 200]]);
      const persist = persistSpy();

      // when
      component.toggleOverlap();

      // then
      expect(component.canvasOverlapAllowed).toBe(false);
      expect(positionsOf([top, overlapping])).toEqual([[0, 0], [0, 210]]);
      expect(persist).toHaveBeenCalled();
    });

    it('#toggleOverlap should allow overlapping', () => {

      // given
      render([], false);

      // when
      component.toggleOverlap();

      // then
      expect(component.canvasOverlapAllowed).toBe(true);
    });

    it('#showCanvas should push tiles apart overlapping after scaling when overlapping is prevented', () => {

      // given
      render([[0, 0, 100, 400], [110, 0, 100, 400]], false);

      // when
      component.showCanvas(CanvasPaging.PORTRAIT);

      // then
      const [scaledFirst, scaledSecond] = component.elementContexts;
      expect(positionsOf([scaledFirst, scaledSecond])).toEqual([[0, 10], [75, 420]]);
    });

    it('overlap button should be shown on canvas only and toggle overlapping', () => {

      // given
      const inGrid = fixture.nativeElement.querySelector('#but_allow_overlap');
      component.showCanvas(CanvasPaging.NONE);
      fixture.detectChanges();
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('#but_allow_overlap');

      // when
      button.click();
      fixture.detectChanges();

      // then
      expect(inGrid).toBeNull();
      expect(component.canvasOverlapAllowed).toBe(true);
      expect(button.classList).toContain('koia-toggle-active');
    });

    it('generated dashboard should prevent overlapping', () => {

      // given
      component.canvasOverlapAllowed = true;
      vi.spyOn(DashboardGenerator.prototype, 'generate')
        .mockReturnValue({ grid: { columns: 2, cellRatio: '1:1' }, elementContexts: [new SummaryContext(harness.scene.columns)] });

      // when
      component.generateDashboard();

      // then
      expect(component.canvasOverlapAllowed).toBe(false);
    });
  });

  describe('overlap option of view', () => {

    it('new dashboard should prevent overlapping', fakeAsync(() => {

      // when
      harness.init();

      // then
      expect(component.canvasOverlapAllowed).toBe(false);
    }));

    it('restored view without overlap option should allow overlapping', fakeAsync(() => {

      // given
      const view = harness.viewOf(Route.FLEX, [new SummaryContext(harness.scene.columns)]);

      // when
      harness.init(harness.dashboardTab(view));

      // then
      expect(component.canvasOverlapAllowed).toBe(true);
    }));

    it('restored view should keep its overlap option', fakeAsync(() => {

      // given
      const view = harness.viewOf(Route.FLEX, [new SummaryContext(harness.scene.columns)]);
      view.canvasOverlapAllowed = false;

      // when
      harness.init(harness.dashboardTab(view));

      // then
      expect(component.canvasOverlapAllowed).toBe(false);
    }));

    it.each([true, false])('#tabContent should save overlap option %s', allowed => fakeAsync(() => {

      // given
      harness.init(harness.dashboardTab());
      component.canvasOverlapAllowed = allowed;

      // when
      const content = component.tabContent();

      // then
      expect(content.view.canvasOverlapAllowed).toBe(allowed);
    })());
  });
});
