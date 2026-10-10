import { ResizeEvent } from 'angular-resizable-element';
import { FlexLayout } from './flex-layout';

describe('FlexLayout', () => {

  it('#resizableEdges should return bottom/right-resizable when not showing resizable margin', () => {

    // when
    const edges = FlexLayout.resizableEdges(false);

    // then
    expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
  });

  it('#resizableEdges should return non-resizable when showing resizable margin', () => {

    // when
    const edges = FlexLayout.resizableEdges(true);

    // then
    expect(edges).toEqual({ bottom: false, right: false, top: false, left: false });
  });

  it('#validateResize should return false when width is too small', () => {

    // when
    const validation = FlexLayout.validateResize(resizeEvent(FlexLayout.MIN_DIM_PX - 1, 1_000));

    // then
    expect(validation).toBe(false);
  });

  it('#validateResize should return false when height is too small', () => {

    // when
    const validation = FlexLayout.validateResize(resizeEvent(1_000, FlexLayout.MIN_DIM_PX - 1));

    // then
    expect(validation).toBe(false);
  });

  it('#validateResize should return true when width and height are fine', () => {

    // when
    const validation = FlexLayout.validateResize(resizeEvent(1_000, 1_000));

    // then
    expect(validation).toBe(true);
  });

  it('#validateResize should return true when dimensions are not yet known', () => {

    // when
    const validation = FlexLayout.validateResize(resizeEvent(undefined, undefined));

    // then
    expect(validation).toBe(true);
  });

  function resizeEvent(width: number, height: number): ResizeEvent {
    return {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, width, height },
      edges: null
    };
  }
});
