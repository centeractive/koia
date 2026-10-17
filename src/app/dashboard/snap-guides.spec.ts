import { SnapGuides } from './snap-guides';

describe('SnapGuides', () => {

  const other = { x: 200, y: 100, width: 400, height: 300 };

  function guidesOf(threshold = 5): SnapGuides {
    return new SnapGuides([other], 2, threshold);
  }

  it.each([
    { edge: 'start', target: 'tile start', x: 203, expectedX: 200, guide: 200 },
    { edge: 'center', target: 'tile center', x: 327, expectedX: 325, guide: 400 },
    { edge: 'end', target: 'tile end', x: 453, expectedX: 450, guide: 600 },
    { edge: 'start', target: 'tile end with gap', x: 613, expectedX: 610, guide: 610 },
    { edge: 'center', target: 'page center', x: 627, expectedX: 625, guide: 700 }
  ])('#snapMove should snap $edge edge to $target', ({ x, expectedX, guide }) => {

    // when
    const snap = guidesOf().snapMove({ x, y: 703, width: 150, height: 100 });

    // then
    expect(snap.rect).toEqual({ x: expectedX, y: 700, width: 150, height: 100 });
    expect(snap.guides).toEqual([{ axis: 'x', position: guide }]);
  });

  it('#snapMove should snap top edge to page boundary', () => {

    // when
    const snap = guidesOf().snapMove({ x: 1003, y: 952, width: 150, height: 100 });

    // then
    expect(snap.rect).toEqual({ x: 1000, y: 950, width: 150, height: 100 });
    expect(snap.guides).toEqual([{ axis: 'y', position: 950 }]);
  });

  it('#snapMove should not snap center to page boundary', () => {

    // when
    const snap = guidesOf().snapMove({ x: 1003, y: 898, width: 150, height: 100 });

    // then
    expect(snap.guides).toEqual([]);
  });

  it('#snapMove should round to step without guide in reach', () => {

    // when
    const snap = guidesOf().snapMove({ x: 1003, y: 703, width: 150, height: 100 });

    // then
    expect(snap.rect).toEqual({ x: 1000, y: 700, width: 150, height: 100 });
    expect(snap.guides).toEqual([]);
  });

  it('#snapMove should prefer closest target', () => {

    // when
    const snap = guidesOf(8).snapMove({ x: 606, y: 703, width: 150, height: 100 });

    // then
    expect(snap.rect.x).toBe(610);
  });

  it('#snapMove should keep first target on tie', () => {

    // when
    const snap = guidesOf(8).snapMove({ x: 605, y: 703, width: 150, height: 100 });

    // then
    expect(snap.rect.x).toBe(600);
  });

  it.each([
    { axis: 'x', side: 'low', x: -148, y: 703, expectedX: 0, expectedY: 700 },
    { axis: 'x', side: 'high', x: 1398, y: 703, expectedX: 1250, expectedY: 700 },
    { axis: 'y', side: 'low', x: 1003, y: -98, expectedX: 1000, expectedY: 0 },
    { axis: 'y', side: 'high', x: 1003, y: 1898, expectedX: 1000, expectedY: 1800 }
  ])('#snapMove should clamp $axis $side and drop guide', ({ x, y, expectedX, expectedY }) => {

    // when
    const snap = guidesOf().snapMove({ x, y, width: 150, height: 100 });

    // then
    expect(snap.rect).toEqual({ x: expectedX, y: expectedY, width: 150, height: 100 });
    expect(snap.guides).toEqual([]);
  });

  it('#snapMove should pull tile above page boundary when mostly above', () => {

    // when
    const snap = guidesOf().snapMove({ x: 1003, y: 873, width: 150, height: 100 });

    // then
    expect(snap.rect.y).toBe(850);
  });

  it('#snapMove should push tile to next page when mostly below', () => {

    // when
    const snap = guidesOf().snapMove({ x: 1003, y: 923, width: 150, height: 100 });

    // then
    expect(snap.rect.y).toBe(950);
  });

  it('#snapResize should snap right edge to other tile', () => {

    // when
    const snap = guidesOf().snapResize({ x: 0, y: 500, width: 597, height: 203 });

    // then
    expect(snap.rect).toEqual({ x: 0, y: 500, width: 600, height: 200 });
    expect(snap.guides).toEqual([{ axis: 'x', position: 600 }]);
  });

  it('#snapResize should snap bottom edge to page boundary', () => {

    // when
    const snap = guidesOf().snapResize({ x: 0, y: 700, width: 1003, height: 248 });

    // then
    expect(snap.rect).toEqual({ x: 0, y: 700, width: 1000, height: 250 });
    expect(snap.guides).toEqual([{ axis: 'y', position: 950 }]);
  });

  it('#snapResize should round end edges to step', () => {

    // when
    const snap = guidesOf().snapResize({ x: 0, y: 700, width: 1003, height: 147 });

    // then
    expect(snap.rect).toEqual({ x: 0, y: 700, width: 1000, height: 150 });
    expect(snap.guides).toEqual([]);
  });

  it.each([
    { dimension: 'width', limit: 'minimum', rect: { x: 560, y: 700, width: 43, height: 150 }, expected: [100, 150] },
    { dimension: 'width', limit: 'page width', rect: { x: 1000, y: 700, width: 430, height: 150 }, expected: [400, 150] },
    { dimension: 'height', limit: 'minimum', rect: { x: 1000, y: 350, width: 150, height: 58 }, expected: [150, 100] },
    { dimension: 'height', limit: 'page bottom', rect: { x: 1000, y: 900, width: 150, height: 103 }, expected: [150, 50] }
  ])('#snapResize should clamp $dimension to $limit and drop guide', ({ rect, expected }) => {

    // when
    const snap = guidesOf().snapResize(rect);

    // then
    expect([snap.rect.width, snap.rect.height]).toEqual(expected);
    expect(snap.guides).toEqual([]);
  });
});
