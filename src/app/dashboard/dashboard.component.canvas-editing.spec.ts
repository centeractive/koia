import { ComponentFixture, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { CanvasPaging, ElementContext, Route, SummaryContext, TextBoxContext } from 'app/shared/model';
import { DashboardComponent } from './dashboard.component';
import { configureDashboardTestBed, createDashboardHarness, DashboardHarness, useRenderedViewport } from './dashboard.component.spec-harness';

describe('DashboardComponent canvas editing', () => {

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

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach(c => c.replaceChildren());
    vi.restoreAllMocks();
  });

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

  function selectionBox(): HTMLElement {
    return fixture.nativeElement.querySelector('.div_selection_bounds');
  }

  function rectsOf(contexts: ElementContext[]): number[][] {
    return contexts.map(c => [c.x, c.y, c.width, c.height]);
  }

  function select(contexts: ElementContext[]): void {
    component.tileSelection.selectAll(contexts, false);
    fixture.detectChanges();
  }

  function pressKey(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, code: 'Key' + key.toUpperCase(), bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  }

  function openContextMenu(target: Element): MouseEvent {
    const rect = target.getBoundingClientRect();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: rect.left + 5, clientY: rect.top + 5 });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  /**
   * @returns the item of the menu opened last, the panels of closed menus may still be detached
   */
  function menuItem(selector: string): HTMLButtonElement {
    return Array.from(document.querySelectorAll<HTMLButtonElement>('.cdk-overlay-container ' + selector)).at(-1);
  }

  function chooseMenuItem(selector: string): void {
    const item = menuItem(selector);
    item.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    item.click();
    fixture.detectChanges();
  }

  describe('tile press', () => {

    it('mousedown on content handling the pointer should not reach the tile', () => {

      // given
      render([[0, 0, 300, 200]]);
      const reached: Event[] = [];
      canvasTiles()[0].addEventListener('mousedown', e => reached.push(e));
      const canvas = document.createElement('canvas');
      canvasTiles()[0].querySelector('.div_tile_body').appendChild(canvas);

      // when
      canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      // then
      expect(reached).toEqual([]);
    });

    it('mousedown beside content handling the pointer should reach the tile, which it moves', () => {

      // given
      render([[0, 0, 300, 200]]);
      const reached: Event[] = [];
      canvasTiles()[0].addEventListener('mousedown', e => reached.push(e));
      const empty = document.createElement('div');
      canvasTiles()[0].querySelector('.div_tile_body').appendChild(empty);

      // when
      empty.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      // then
      expect(reached.length).toBe(1);
    });

    it('additive mousedown on content handling the pointer should prevent text selection', () => {

      // given
      render([[0, 0, 300, 200]]);
      const canvas = document.createElement('canvas');
      canvasTiles()[0].querySelector('.div_tile_body').appendChild(canvas);
      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, shiftKey: true });

      // when
      canvas.dispatchEvent(event);

      // then
      expect(event.defaultPrevented).toBe(true);
    });

    it('content should show move cursor beside the content handling the pointer', () => {

      // given
      render([[0, 0, 300, 200]]);
      const body = canvasTiles()[0].querySelector('.div_tile_body');
      const table = document.createElement('table');
      body.appendChild(table);

      // when
      const cursors = [getComputedStyle(body.firstElementChild).cursor, getComputedStyle(table).cursor];

      // then
      expect(cursors).toEqual(['move', 'auto']);
    });

    it('additive mousedown on tile content should prevent text selection and move the focus away', () => {

      // given
      render([[0, 0, 300, 200]]);
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, shiftKey: true });

      // when
      canvasTiles()[0].querySelector('.div_tile_body').dispatchEvent(event);

      // then
      button.remove();
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(document.body);
    });

    it('#onFreeMoveStarted should move the focus away from a title focused by the press', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      const title = document.createElement('textarea');
      canvasTiles()[0].appendChild(title);
      title.focus();

      // when
      component.onFreeMoveStarted(first);

      // then
      expect(document.activeElement).toBe(document.body);
    });

    it('click without moving on member of selection should select it alone', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);

      // when
      harness.clickTile(canvasTiles()[1].querySelector('.div_element'));

      // then
      expect(component.tileSelection.tiles()).toEqual([second]);
    });

    it('click on header control of selected tile should keep the selection for the menu of the header', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);
      const button = document.createElement('button');
      canvasTiles()[0].querySelector('koia-element-header').appendChild(button);

      // when
      harness.clickTile(button);

      // then
      expect(component.tileSelection.tiles()).toEqual([first, second]);
    });

    it('click on control in content of selected tile should clear the selection', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);
      const button = document.createElement('button');
      canvasTiles()[0].querySelector('.div_tile_body').appendChild(button);

      // when
      harness.clickTile(button);

      // then
      expect(component.tileSelection.tiles()).toEqual([]);
    });

    it('#onMarqueeEnd should select tiles touched by area of Alt marquee', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200], [700, 0, 300, 200]]);
      const pages = harness.pagesRect();
      const scale = harness.canvasScale();
      const left = pages.left + harness.layerX(200) * scale;
      const top = pages.top + harness.layerY(100) * scale;

      // when
      component.onMarqueeEnd({ rect: { left, top, right: left + 200 * scale, bottom: top + 10 * scale }, additive: false, touching: true });

      // then
      expect(component.tileSelection.tiles()).toEqual([first, second]);
    });
  });

  describe('selection box', () => {

    it('should be drawn with handles around several selected tiles', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);

      // when
      select([first, second]);

      // then
      expect(selectionBox()).toBeTruthy();
      expect(selectionBox().querySelector('koia-resize-handles')).toBeTruthy();
    });

    it('should be drawn without handles around tiles on several pages', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 1000, 300, 200]]);

      // when
      select([first, second]);

      // then
      expect(selectionBox()).toBeTruthy();
      expect(selectionBox().querySelector('koia-resize-handles')).toBeNull();
    });

    it('should be as large as the selected tiles, its outline adding nothing to the resized rect', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);

      // when
      select([first, second]);

      // then
      const scale = harness.canvasScale();
      expect(Math.abs(selectionBox().offsetWidth - 610 * scale)).toBeLessThanOrEqual(1);
      expect(Math.abs(selectionBox().offsetHeight - 200 * scale)).toBeLessThanOrEqual(1);
    });

    it('should not be drawn around a single selected tile', () => {

      // given
      const [first] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);

      // when
      select([first]);

      // then
      expect(selectionBox()).toBeNull();
    });

    it('#selectionBounds should be undefined in grid and while selected tiles are moved', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);
      component.onFreeMoveStarted(first);
      const whileMoved = component.selectionBounds();
      component.onFreeMoveEnded(first, harness.dragEnd());

      // when
      component.setLayout(Route.GRID);
      component.tileSelection.selectAll(component.elementContexts, false);

      // then
      expect(whileMoved).toBeUndefined();
      expect(component.selectionBounds()).toBeUndefined();
    });

    it('press on handle of box should keep selection', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);

      // when
      selectionBox().querySelector('koia-resize-handles').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

      // then
      expect(component.tileSelection.tiles()).toEqual([first, second]);
    });
  });

  describe('group resize', () => {

    it('should keep box and members unraised while resized', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);

      // when
      component.onGroupResizeStart();
      fixture.detectChanges();

      // then
      expect(selectionBox()).toBeTruthy();
      expect([component.isGroupFollower(second), component.shiftTranslateOf(second)]).toEqual([false, undefined]);
    });

    it('#onGroupResizing should preview resized box', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);
      const scale = harness.canvasScale();
      component.onGroupResizeStart();

      // when
      component.onGroupResizing(harness.resizeEvent(1220 * scale, 200 * scale, 0, 0, { right: 610 * scale }));

      // then
      expect(component.resizePreview.width).toBeCloseTo(1220 * scale, 5);
      expect(component.resizePreview.height).toBeCloseTo(200 * scale, 5);
    });

    it('#onGroupResizing should preview box grown by text tile', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      const textTile = addTextTile(310, 0, 300, 100, 300);
      select([first, textTile]);
      const scale = harness.canvasScale();
      component.onGroupResizeStart();

      // when
      component.onGroupResizing(harness.resizeEvent(610 * scale, 300 * scale, 0, 0, { right: 0 }));

      // then
      expect(component.resizePreview.height).toBeCloseTo(300 * scale, 5);
      expect(component.canvasGuides.every(g => g.axis === 'x')).toBe(true);
    });

    it('#onGroupResizeEnd should scale members, bring them to front and push covered tiles down', () => {

      // given
      const [first, second, below] = render([[0, 0, 300, 200], [310, 0, 300, 200], [0, 300, 300, 200]], false);
      select([first, second]);
      const scale = harness.canvasScale();
      component.onGroupResizeStart();

      // when
      component.onGroupResizeEnd(harness.resizeEvent(1220 * scale, 400 * scale, 0, 0, { right: 610 * scale, bottom: 200 * scale }));

      // then
      expect(rectsOf([first, second])).toEqual([[0, 0, 600, 400], [620, 0, 600, 400]]);
      expect([below.x, below.y]).toEqual([0, 410]);
      expect(Math.min(first.z, second.z)).toBeGreaterThan(below.z);
      expect(component.resizePreview).toBeUndefined();
      expect(component.selectionBounds()).toBeDefined();
    });

    it('#onGroupResizeEnd should keep members when no edge moved', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);
      component.onGroupResizeStart();

      // when
      component.onGroupResizeEnd(harness.resizeEvent(610, 200, 0, 0, { right: 0, bottom: 0 }));

      // then
      expect(rectsOf([first, second])).toEqual([[0, 0, 300, 200], [310, 0, 300, 200]]);
    });

    it('#onFreeResizeEnd should bring resized tile only to front', () => {

      // given
      const [first, second, third] = render([[0, 0, 300, 200], [310, 0, 300, 200], [620, 0, 300, 200]]);
      select([first, second]);
      component.onFreeResizeStart(first);
      const scale = harness.canvasScale();

      // when
      component.onFreeResizeEnd(first, harness.resizeEvent(300 * scale, 250 * scale, 0, 0, { bottom: 50 * scale }));

      // then
      expect(first.z).toBeGreaterThan(third.z);
      expect(second.z).toBeLessThan(third.z);
    });
  });

  describe('context menu', () => {

    it('align bottom should keep the aligned tiles in place and push a tile between them down', () => {

      // given
      const [first, between, third] = render([[0, 250, 300, 200], [310, 150, 300, 200], [400, 0, 300, 140]], false);

      // when
      component.editor.align([first, third], 'bottom');

      // then
      expect(rectsOf([third, between])).toEqual([[400, 310, 300, 140], [310, 460, 300, 200]]);
    });

    it('on unselected tile should select it alone and offer tile items', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first]);

      // when
      openContextMenu(canvasTiles()[1].querySelector('.div_element'));

      // then
      expect(component.contextMenuTiles).toEqual([second]);
      expect(component.tileSelection.tiles()).toEqual([second]);
      expect(menuItem('.menu_item_bring_forward')).toBeTruthy();
      expect(menuItem('.menu_item_align').disabled).toBe(true);
    });

    it('on selected tile should act on the whole selection', () => {

      // given
      const [first, second, third] = render([[0, 0, 300, 200], [310, 100, 300, 200], [620, 200, 300, 200]]);
      select([first, second, third]);
      openContextMenu(canvasTiles()[1].querySelector('.div_element'));

      // when
      chooseMenuItem('.menu_item_align');
      chooseMenuItem('.menu_item_align_top');

      // then
      expect([first.y, second.y, third.y]).toEqual([0, 0, 0]);
      expect(component.tileSelection.tiles()).toEqual([first, second, third]);
    });

    it.each([
      { item: '.menu_item_to_front', zs: [3, 1, 2] },
      { item: '.menu_item_to_back', zs: [1, 2, 3] },
      { item: '.menu_item_bring_forward', zs: [2, 1, 3] },
      { item: '.menu_item_send_backward', zs: [1, 2, 3] }
    ])('$item should restack the tiles', ({ item, zs }) => {

      // given
      const contexts = render([[0, 0, 300, 200], [100, 0, 300, 200], [200, 0, 300, 200]]);
      openContextMenu(canvasTiles()[0].querySelector('.div_element'));

      // when
      chooseMenuItem(item);

      // then
      expect(contexts.map(c => c.z)).toEqual(zs);
    });

    it('should distribute three selected tiles', () => {

      // given
      const contexts = render([[0, 0, 100, 100], [150, 200, 100, 100], [600, 400, 100, 100]]);
      select(contexts);
      openContextMenu(canvasTiles()[0].querySelector('.div_element'));

      // when
      chooseMenuItem('.menu_item_distribute');
      chooseMenuItem('.menu_item_distribute_x');

      // then
      expect(contexts.map(c => c.x)).toEqual([0, 300, 600]);
    });

    it('should copy and paste tiles at the pointer from the background menu', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      openContextMenu(canvasTiles()[0].querySelector('.div_element'));
      chooseMenuItem('.menu_item_copy');
      const pages = harness.pagesRect();
      const scale = harness.canvasScale();
      const target = fixture.nativeElement.querySelector('.div_canvas_page_content');
      const clientX = pages.left + harness.layerX(500) * scale;
      const clientY = pages.top + harness.layerY(300) * scale;
      target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX, clientY }));
      fixture.detectChanges();

      // when
      chooseMenuItem('.menu_item_paste');

      // then
      const pasted = component.elementContexts[1];
      expect(component.contextMenuTiles).toBeUndefined();
      expect(pasted.x).toBeCloseTo(500, -1);
      expect(pasted.y).toBeCloseTo(300, -1);
      expect(component.tileSelection.tiles()).toEqual([pasted]);
      expect(first.z).toBeLessThan(pasted.z);
    });

    it('should cut, duplicate and delete tiles', fakeAsync(() => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      openContextMenu(canvasTiles()[0].querySelector('.div_element'));
      chooseMenuItem('.menu_item_duplicate');
      openContextMenu(canvasTiles()[1].querySelector('.div_element'));
      chooseMenuItem('.menu_item_cut');
      const duplicate = component.elementContexts.find(c => c !== first);

      // when
      openContextMenu(canvasTiles()[0].querySelector('.div_element'));
      chooseMenuItem('.menu_item_delete');
      flush();

      // then
      expect(component.elementContexts).toEqual([duplicate]);
      expect(component.elementContexts).not.toContain(second);
      expect(component.editor.canPaste()).toBe(true);
    }));

    it('should select all tiles', () => {

      // given
      const contexts = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      openContextMenu(fixture.nativeElement.querySelector('.div_canvas_page_content'));

      // when
      chooseMenuItem('.menu_item_select_all');

      // then
      expect(component.tileSelection.tiles()).toEqual(contexts);
    });

    it('in text of text box should leave the menu to the browser and close the canvas menu', () => {

      // given
      render([[0, 0, 300, 200]]);
      addTextTile(400, 0, 300, 200);
      openContextMenu(canvasTiles()[0].querySelector('.div_element'));

      // when
      const event = openContextMenu(fixture.nativeElement.querySelector('#div_canvas koia-text-box'));

      // then
      expect(event.defaultPrevented).toBe(false);
      expect(component.contextMenuTiles).toBeUndefined();
    });

    it('press within the menu should keep the selection on the canvas', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first, second]);
      openContextMenu(canvasTiles()[0].querySelector('.div_element'));

      // when
      menuItem('.menu_item_copy').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      pressKey('Escape', {}, menuItem('.menu_item_copy'));

      // then
      expect(component.tileSelection.tiles()).toEqual([first, second]);
    });

    it('press within an overlay should end the selection in grid', () => {

      // given
      component.elementContexts = [new SummaryContext(harness.scene.columns)];
      fixture.detectChanges();
      component.tileSelection.select(component.elementContexts[0]);
      const overlay = document.createElement('div');
      overlay.className = 'cdk-overlay-container';
      document.body.appendChild(overlay);

      // when
      overlay.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

      // then
      overlay.remove();
      expect(component.tileSelection.tiles()).toEqual([]);
    });

    it('#bringToFront of header should bring the selection to front', () => {

      // given
      const [first, second, third] = render([[0, 0, 300, 200], [310, 0, 300, 200], [620, 0, 300, 200]]);
      select([first, second]);

      // when
      component.bringToFront(second);

      // then
      expect([first.z, second.z, third.z]).toEqual([2, 3, 1]);
    });
  });

  describe('keyboard', () => {

    it('Delete should remove selected tiles and prevent the default', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      select([first]);

      // when
      const event = pressKey('Delete');

      // then
      expect(component.elementContexts).toEqual([second]);
      expect(event.defaultPrevented).toBe(true);
    });

    it('arrow should nudge selected tiles', () => {

      // given
      const [first] = render([[100, 100, 300, 200]]);
      select([first]);

      // when
      pressKey('ArrowLeft', { shiftKey: true });

      // then
      expect([first.x, first.y]).toEqual([90, 100]);
    });

    it('should handle keys after shift click moved the focus away from a toolbar button', () => {

      // given
      const [first, second] = render([[0, 0, 300, 200], [310, 0, 300, 200]]);
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      canvasTiles()[1].querySelector('.div_tile_body').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, shiftKey: true }));
      select([second]);

      // when
      pressKey('Delete');

      // then
      button.remove();
      expect(component.elementContexts).toEqual([first]);
    });

    it('should not handle keys with the focus outside the canvas', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      select([first]);
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      // when
      const event = pressKey('Delete', {}, button);

      // then
      button.remove();
      expect(component.elementContexts).toEqual([first]);
      expect(event.defaultPrevented).toBe(false);
    });

    it('should not handle keys of hidden dashboard', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      select([first]);
      component.divContentRef.nativeElement.style.display = 'none';

      // when
      pressKey('Delete');

      // then
      expect(component.elementContexts).toEqual([first]);
    });

    it('should not handle keys in grid', () => {

      // given
      component.elementContexts = [new SummaryContext(harness.scene.columns)];
      fixture.detectChanges();
      component.tileSelection.select(component.elementContexts[0]);

      // when
      pressKey('Delete');

      // then
      expect(component.elementContexts.length).toBe(1);
    });

    it('should not prevent keys not handled', () => {

      // given
      render([[0, 0, 300, 200]]);

      // when
      const event = pressKey('Delete');

      // then
      expect(event.defaultPrevented).toBe(false);
    });

    it('should not handle keys before the dashboard is rendered', () => {

      // given
      const [first] = render([[0, 0, 300, 200]]);
      select([first]);
      component.divContentRef = undefined;

      // when
      pressKey('Delete');

      // then
      expect(component.elementContexts).toEqual([first]);
    });
  });
});
