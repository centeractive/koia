import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, fakeAsync, waitForAsync } from '@angular/core/testing';
import { ElementContext, TextBoxContext } from 'app/shared/model';
import { DashboardComponent } from './dashboard.component';
import { configureDashboardTestBed, createDashboardHarness, DashboardHarness, useRenderedViewport } from './dashboard.component.spec-harness';

describe('DashboardComponent grid move', () => {

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

  function cells(): HTMLElement {
    return component.gridCellsRef.nativeElement;
  }

  function gridTiles(): HTMLElement[] {
    return Array.from(cells().querySelectorAll(':scope > .div_tile:not(.cdk-drag-placeholder)'));
  }

  function placeholder(): HTMLElement {
    return cells().querySelector('.cdk-drag-placeholder');
  }

  function pointerAt(x: number, y: number): MouseEventInit {
    return { bubbles: true, button: 0, buttons: 1, detail: 1, clientX: x, clientY: y };
  }

  /**
   * presses the tile beside its title and moves the pointer far enough to start the drag
   *
   * @returns the press position within the tile
   */
  function startDrag(tile: HTMLElement): { x: number, y: number } {
    const rect = tile.getBoundingClientRect();
    tile.dispatchEvent(new MouseEvent('mousedown', pointerAt(rect.left + 20, rect.top + 20)));
    document.dispatchEvent(new MouseEvent('mousemove', pointerAt(rect.left + 30, rect.top + 20)));
    return { x: 20, y: 20 };
  }

  function moveTo(x: number, y: number): void {
    document.dispatchEvent(new MouseEvent('mousemove', pointerAt(x, y)));
    fixture.detectChanges();
  }

  function releaseAt(x: number, y: number): void {
    document.dispatchEvent(new MouseEvent('mouseup', pointerAt(x, y)));
  }

  it('should make room where a tile dragged left beside a tall tile lands, and drop it there', async () => {

    // given
    const contexts = [...harness.renderGridSummaries(4, [[1, 1], [2, 2], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]])];
    const [dragged, neighbour] = [gridTiles()[4], gridTiles()[3]];
    const target = neighbour.getBoundingClientRect();
    const pickup = startDrag(dragged);

    // when
    moveTo(target.left + pickup.x, target.top + pickup.y);
    moveTo(target.left + pickup.x + 6, target.top + pickup.y);

    // then
    expect(placeholder().nextElementSibling).toBe(neighbour);
    releaseAt(target.left + pickup.x + 6, target.top + pickup.y);
    await vi.waitFor(() => expect(component.elementContexts.indexOf(contexts[4])).toBe(3));
    expect(component.elementContexts.indexOf(contexts[3])).toBe(4);
  });

  it.each([
    { edge: 'left', x: -2000 },
    { edge: 'right', x: 5000 }
  ])('should keep a tile dragged beyond the $edge edge within the grid', async ({ edge, x }) => {

    // given
    harness.renderGridSummaries(3, [[1, 1], [1, 1], [1, 1]]);
    const tile = gridTiles()[1];
    const top = tile.getBoundingClientRect().top;
    startDrag(tile);

    // when
    moveTo(x, top + 20);

    // then
    const preview = document.querySelector('.cdk-drag-preview').getBoundingClientRect();
    const grid = cells().getBoundingClientRect();
    expect(edge === 'left' ? preview.left : preview.right).toBeCloseTo(edge === 'left' ? grid.left : grid.right, 0);
    releaseAt(x, top + 20);
    await vi.waitFor(() => expect(document.querySelector('.cdk-drag-preview')).toBeNull());
  });

  it('should move the focus away from a title being edited when a text tile of the grid is dragged', () => {

    // given
    harness.renderGridSummaries(3, [[1, 1]]);
    const textTile = new TextBoxContext(harness.scene.columns, true);
    component.elementContexts = component.elementContexts.concat([textTile]);
    fixture.detectChanges();
    const title = document.createElement('textarea');
    document.body.appendChild(title);
    title.focus();

    // when
    component.onGridMoveStarted(textTile, harness.dragStart(document.createElement('div')));

    // then
    title.remove();
    expect(document.activeElement).toBe(document.body);
  });

  it('should drop a tile where its move lands it and drop a later tile by the indexes of the drop', () => {

    // given
    const contexts: ElementContext[] = [...harness.renderGridSummaries(3, [[1, 1], [1, 1], [1, 1]])];
    const first = cells().getBoundingClientRect();
    component.onGridMoveStarted(contexts[2], harness.dragStart(document.createElement('div')));
    component.constrainGridMove({ x: first.left + 10, y: first.top + 10 }, null, { width: 100 } as DOMRect, { x: 10, y: 10 });

    // when
    component.drop({ previousIndex: 2, currentIndex: 2 } as CdkDragDrop<object>);
    component.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<object>);

    // then
    expect(component.elementContexts).toEqual([contexts[0], contexts[2], contexts[1]]);
  });
});
