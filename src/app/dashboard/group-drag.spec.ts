import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { GroupDrag, LayerMapping, translateBetween } from './group-drag';

describe('GroupDrag', () => {

  const DRAGGED = 'dragged';
  const FOLLOWER = 'follower';
  const OTHER = 'other';
  const SHEET_OFFSET = 1000;

  const mapping: LayerMapping = {
    layerXOf: x => x + 50,
    layerYOf: y => y + Math.floor(y / PageFormat.LANDSCAPE.height) * SHEET_OFFSET
  };

  function groupDrag(): GroupDrag<string> {
    return new GroupDrag(DRAGGED, [DRAGGED, FOLLOWER], [{ x: 0, y: 10, width: 100, height: 100 }, { x: 200, y: 800, width: 100, height: 100 }],
      PageFormat.LANDSCAPE);
  }

  it('should be group of several members only', () => {

    // when
    const groups = [groupDrag().isGroup(), new GroupDrag(DRAGGED, [DRAGGED], [{ x: 0, y: 0, width: 1, height: 1 }], PageFormat.LANDSCAPE).isGroup()];

    // then
    expect(groups).toEqual([true, false]);
  });

  it('should return bounds and original rects of members', () => {

    // given
    const drag = groupDrag();

    // when
    drag.apply([{ x: 10, y: 20, width: 100, height: 100 }, { x: 210, y: 810, width: 100, height: 100 }]);

    // then
    expect(drag.bounds()).toEqual({ x: 0, y: 10, width: 300, height: 890 });
    expect(drag.originalRects()).toEqual([{ x: 0, y: 10, width: 100, height: 100 }, { x: 200, y: 800, width: 100, height: 100 }]);
    expect(drag.originalRectOf(FOLLOWER)).toEqual({ x: 200, y: 800, width: 100, height: 100 });
    expect(drag.rectOf(FOLLOWER)).toEqual({ x: 210, y: 810, width: 100, height: 100 });
  });

  it('should translate follower moved onto next page by its layer distance in pixels', () => {

    // given
    const drag = groupDrag();
    drag.apply([{ x: 10, y: 160, width: 100, height: 100 }, { x: 210, y: 960, width: 100, height: 100 }]);

    // when
    const translate = drag.translateOf(FOLLOWER, mapping, 0.5);

    // then
    expect(translate).toBe('5px 580px');
  });

  it('should not translate dragged tile nor other tiles', () => {

    // given
    const drag = groupDrag();
    drag.apply([{ x: 10, y: 160, width: 100, height: 100 }, { x: 210, y: 960, width: 100, height: 100 }]);

    // when
    const translates = [drag.translateOf(DRAGGED, mapping, 0.5), drag.translateOf(OTHER, mapping, 0.5)];

    // then
    expect(translates).toEqual([undefined, undefined]);
  });

  it('should tell followers', () => {

    // given
    const drag = groupDrag();

    // when
    const followers = [DRAGGED, FOLLOWER, OTHER].map(t => drag.isFollower(t));

    // then
    expect(followers).toEqual([false, true, false]);
  });

  it('should return members moved onto another page', () => {

    // given
    const drag = groupDrag();

    // when
    drag.apply([{ x: 10, y: 160, width: 100, height: 100 }, { x: 210, y: 960, width: 100, height: 100 }]);

    // then
    expect(drag.membersWithChangedPage()).toEqual([FOLLOWER]);
  });

  it('translateBetween should shift by the distance on the layer in pixels, across sheets', () => {

    // when
    const translate = translateBetween({ x: 0, y: 900, width: 100, height: 40 }, { x: 30, y: 960, width: 100, height: 40 }, mapping, 2);

    // then
    expect(translate).toBe('60px 2120px');
  });
});
