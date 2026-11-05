import { ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { GridLayout } from './grid-layout';
import { GridMove } from './grid-move';
import { GridMovePreview } from './grid-move-preview';

describe('GridMovePreview', () => {

  const SMALL = { columns: 1, rows: 1 };
  const CELLS_WIDTH = 590;
  const PITCH = (CELLS_WIDTH + GridLayout.GAP_PX) / 3;

  let gridLayout: GridLayout;
  let cells: HTMLElement;
  let placeholder: HTMLElement;
  let contexts: ElementContext[];
  let elements: Map<ElementContext, HTMLElement>;

  beforeEach(() => {
    gridLayout = new GridLayout();
    cells = document.createElement('div');
    cells.style.cssText = `position: fixed; left: 100px; top: 50px; width: ${CELLS_WIDTH}px; height: 400px`;
    document.body.appendChild(cells);
    contexts = [new SummaryContext([]), new SummaryContext([]), new SummaryContext([])];
    elements = new Map(contexts.map(c => [c, cells.appendChild(document.createElement('div'))]));
    placeholder = document.createElement('span');
  });

  afterEach(() => cells.remove());

  function previewOf(dragged: ElementContext): GridMovePreview {
    elements.get(dragged).replaceWith(placeholder);
    return GridMovePreview.of(dragged, contexts, () => SMALL, placeholder, cells, c => elements.get(c), gridLayout);
  }

  function childIndexOfPlaceholder(): number {
    return [...cells.children].indexOf(placeholder);
  }

  it('#of should move among the tiles, the overlays left out', () => {

    // given
    const note = new TextBoxContext([]);
    contexts.splice(1, 0, note);

    // when
    const preview = previewOf(contexts[3]);

    // then
    expect(preview.move).toEqual(new GridMove(contexts[3], [contexts[0], contexts[2], contexts[3]], [SMALL, SMALL, SMALL], 3));
  });

  it('#constrain should keep the tile within the left edge of the grid and keep its top', () => {

    // given
    const preview = previewOf(contexts[1]);

    // when
    const topLeft = preview.constrain({ x: 20, y: 300 }, { width: 190 }, { x: 10, y: 20 });

    // then
    expect(topLeft).toEqual({ x: 100, y: 280 });
  });

  it('#constrain should keep the tile within the right edge of the grid', () => {

    // given
    const preview = previewOf(contexts[1]);

    // when
    const topLeft = preview.constrain({ x: 2000, y: 60 }, { width: 190 }, { x: 10, y: 10 });

    // then
    expect(topLeft.x).toBe(100 + CELLS_WIDTH - 190);
  });

  it('#constrain should move the placeholder before the tile it is placed before', () => {

    // given
    const preview = previewOf(contexts[1]);

    // when
    preview.constrain({ x: 110, y: 60 }, { width: 190 }, { x: 10, y: 10 });

    // then
    expect(childIndexOfPlaceholder()).toBe(0);
  });

  it('#constrain should move the placeholder behind the last tile when placed last', () => {

    // given
    const preview = previewOf(contexts[0]);

    // when
    preview.constrain({ x: 110 + 2 * PITCH, y: 60 }, { width: 190 }, { x: 10, y: 10 });

    // then
    expect(childIndexOfPlaceholder()).toBe(2);
  });

  it('#constrain should take the pitches from the width of the grid cells', () => {

    // given
    const preview = previewOf(contexts[0]);
    cells.style.width = 2 * CELLS_WIDTH + 'px';

    // when
    preview.constrain({ x: 110 + 1.6 * PITCH, y: 60 }, { width: 190 }, { x: 10, y: 10 });

    // then
    expect(childIndexOfPlaceholder()).toBe(1);
  });

  it('#constrain should leave the placeholder while the tile lands where it was', () => {

    // given
    const preview = previewOf(contexts[1]);
    const before = vi.spyOn(Element.prototype, 'before');
    const after = vi.spyOn(Element.prototype, 'after');

    // when
    preview.constrain({ x: 110 + PITCH, y: 60 }, { width: 190 }, { x: 10, y: 10 });

    // then
    expect(childIndexOfPlaceholder()).toBe(1);
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });
});
