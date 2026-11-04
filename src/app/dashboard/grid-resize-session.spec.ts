import { Edges, ResizeEvent } from 'angular-resizable-element';
import { ElementContext, SummaryContext } from 'app/shared/model';
import { Rect } from './free-layout';
import { GridLayout } from './grid-layout';
import { GridResizeSession } from './grid-resize-session';

describe('GridResizeSession', () => {

  const CONTENT_WIDTH = 1410;
  const PITCH = 470;

  function tile(columnSpan = 1): ElementContext {
    const context = new SummaryContext([]);
    context.gridColumnSpan = columnSpan;
    return context;
  }

  function sessionOf(contexts: ElementContext[], rects: Rect[], resized = contexts.at(-1)): GridResizeSession {
    const tiles = contexts.map((c, i) => ({ tile: c, rect: rects[i] }));
    return new GridResizeSession(resized, contexts, tiles, 1, new GridLayout(), CONTENT_WIDTH);
  }

  function rect(column: number, y = 0, columnSpan = 1): Rect {
    return { x: column * PITCH, y, width: columnSpan * PITCH - GridLayout.GAP_PX, height: 300 };
  }

  function resizeEvent(left: number, edges: Edges): ResizeEvent {
    return { rectangle: { left, top: 0, right: 2 * PITCH, bottom: 300, width: 2 * PITCH - left, height: 300 }, edges };
  }

  const [first, second, third] = [tile(), tile(), tile()];
  const row = [rect(0), rect(1), rect(2)];

  it('#update should move tile before the neighbour whose centre its left edge passes, keeping its right edge', () => {

    // given
    const session = sessionOf([first, second, third], row);

    // when
    const state = session.update(resizeEvent(690, { left: -250 }));

    // then
    expect(state).toEqual({ before: second, order: [first, third, second], columnSpan: 2, previewLeftPx: PITCH });
  });

  it('#update should move tile before all neighbours passed', () => {

    // given
    const session = sessionOf([first, second, third], row);

    // when
    const state = session.update(resizeEvent(200, { left: -740 }));

    // then
    expect([state.before, state.order, state.columnSpan]).toEqual([first, [third, first, second], 3]);
  });

  it('#update should keep the right edge over a neighbour spanning two columns', () => {

    // given
    const wide = tile(2);
    const session = sessionOf([wide, third], [rect(0, 0, 2), rect(2)]);

    // when
    const state = session.update(resizeEvent(400, { left: -540 }));

    // then
    expect([state.before, state.columnSpan]).toEqual([wide, 3]);
  });

  it.each([
    { case: 'before the centre of a neighbour', left: 800, edges: { left: -140 } },
    { case: 'when shrinking', left: 1000, edges: { left: 60 } },
    { case: 'at the start of the resize', left: 940, edges: {} },
    { case: 'by the top left corner', left: 200, edges: { left: -740, top: -10 } },
    { case: 'by the bottom left corner', left: 200, edges: { left: -740, bottom: 10 } },
    { case: 'by the right edge', left: 940, edges: { right: 100 } }
  ])('#update should leave the order $case', ({ left, edges }) => {

    // given
    const session = sessionOf([first, second, third], row);

    // when
    const state = session.update(resizeEvent(left, edges));

    // then
    expect(state).toBeUndefined();
  });

  it('#update should only pass neighbours of the same row', () => {

    // given
    const session = sessionOf([first, second, third], [rect(0), rect(1, 310), rect(2)]);

    // when
    const state = session.update(resizeEvent(200, { left: -740 }));

    // then
    expect(state).toBeUndefined();
  });

  it('#update should only pass neighbours adjoining in columns', () => {

    // given
    const session = sessionOf([first, third], [rect(0), rect(2)]);

    // when
    const state = session.update(resizeEvent(200, { left: -740 }));

    // then
    expect(state).toBeUndefined();
  });

  it('#apply should tell whether the neighbour or the span changed', () => {

    // given
    const session = sessionOf([first, second, third], row);
    const state = session.update(resizeEvent(690, { left: -250 }));

    // when
    const changes = [
      session.apply(state), session.apply({ ...state }), session.apply({ ...state, columnSpan: 1 }), session.apply(undefined),
      session.apply(undefined)
    ];

    // then
    expect(changes).toEqual([true, false, true, true, false]);
  });
});
