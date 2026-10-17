import { resizableEdges } from './resizable-edges';

describe('resizableEdges', () => {

  it('should return bottom/right-resizable when not showing resizable margin', () => {

    // when
    const edges = resizableEdges(false);

    // then
    expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
  });

  it('should return non-resizable when showing resizable margin', () => {

    // when
    const edges = resizableEdges(true);

    // then
    expect(edges).toEqual({ bottom: false, right: false, top: false, left: false });
  });
});
