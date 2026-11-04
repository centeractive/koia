import { TileSelection } from './tile-selection';

describe('TileSelection', () => {

  const TILE = 'tile';
  const OTHER_TILE = 'other';

  let selection: TileSelection<string>;

  beforeEach(() => selection = new TileSelection<string>());

  it('#select should select tile', () => {

    // when
    selection.select(TILE);

    // then
    expect(selection.isSelected(TILE)).toBe(true);
  });

  it('#isSelected should be false for undefined tile when nothing is selected', () => {

    // when
    const selected = selection.isSelected(undefined);

    // then
    expect(selected).toBe(false);
  });

  it('#isSelected should be false for other tile', () => {

    // given
    selection.select(TILE);

    // when
    const selected = selection.isSelected(OTHER_TILE);

    // then
    expect(selected).toBe(false);
  });

  it('#clear should clear selection and report it', () => {

    // given
    selection.select(TILE);

    // when
    const cleared = selection.clear();

    // then
    expect(cleared).toBe(true);
    expect(selection.isSelected(TILE)).toBe(false);
  });

  it('#clear should report nothing cleared without selection', () => {

    // when
    const cleared = selection.clear();

    // then
    expect(cleared).toBe(false);
  });

  it('#endPress should keep selection when selected tile was pressed', () => {

    // given
    selection.select(TILE);
    selection.press(TILE);

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(false);
    expect(selection.isSelected(TILE)).toBe(true);
  });

  it('#endPress should clear selection when other tile was pressed and report it', () => {

    // given
    selection.select(TILE);
    selection.press(OTHER_TILE);

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(true);
    expect(selection.isSelected(TILE)).toBe(false);
  });

  it('#endPress should report nothing cleared without selection', () => {

    // given
    selection.press(OTHER_TILE);

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(false);
  });

  it('#endPress should clear selection when no tile was pressed', () => {

    // given
    selection.select(TILE);

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(true);
    expect(selection.isSelected(TILE)).toBe(false);
  });

  it('#endPress should forget pressed tile', () => {

    // given
    selection.press(TILE);
    selection.endPress();
    selection.select(TILE);

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(true);
  });

  it('#select should replace selected tiles', () => {

    // given
    selection.selectAll([TILE, OTHER_TILE], false);

    // when
    selection.select(TILE);

    // then
    expect(selection.tiles()).toEqual([TILE]);
  });

  it('#toggle should add unselected tile', () => {

    // given
    selection.select(TILE);

    // when
    selection.toggle(OTHER_TILE);

    // then
    expect(selection.tiles()).toEqual([TILE, OTHER_TILE]);
  });

  it('#toggle should remove selected tile', () => {

    // given
    selection.selectAll([TILE, OTHER_TILE], false);

    // when
    selection.toggle(TILE);

    // then
    expect(selection.tiles()).toEqual([OTHER_TILE]);
  });

  it('#selectAll should replace selection when not additive', () => {

    // given
    selection.select(TILE);

    // when
    selection.selectAll([OTHER_TILE], false);

    // then
    expect(selection.tiles()).toEqual([OTHER_TILE]);
  });

  it('#selectAll should unite with selection when additive', () => {

    // given
    selection.select(TILE);

    // when
    selection.selectAll([TILE, OTHER_TILE], true);

    // then
    expect(selection.tiles()).toEqual([TILE, OTHER_TILE]);
  });

  it('#isSoleSelected should be true for the only selected tile', () => {

    // given
    selection.select(TILE);

    // when
    const sole = selection.isSoleSelected(TILE);

    // then
    expect(sole).toBe(true);
  });

  it('#isSoleSelected should be false when several tiles are selected', () => {

    // given
    selection.selectAll([TILE, OTHER_TILE], false);

    // when
    const sole = selection.isSoleSelected(TILE);

    // then
    expect(sole).toBe(false);
  });

  it('#isSoleSelected should be false for unselected tile', () => {

    // given
    selection.select(TILE);

    // when
    const sole = selection.isSoleSelected(OTHER_TILE);

    // then
    expect(sole).toBe(false);
  });

  it('#remove should drop tile from selection', () => {

    // given
    selection.selectAll([TILE, OTHER_TILE], false);

    // when
    selection.remove(TILE);

    // then
    expect(selection.tiles()).toEqual([OTHER_TILE]);
  });

  it('#tiles should return a copy', () => {

    // given
    selection.select(TILE);

    // when
    selection.tiles().push(OTHER_TILE);

    // then
    expect(selection.tiles()).toEqual([TILE]);
  });

  it('#endPress should keep selection when other tile was pressed additively', () => {

    // given
    selection.select(TILE);
    selection.press(OTHER_TILE, true);

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(false);
    expect(selection.tiles()).toEqual([TILE]);
  });

  it('#endPress should keep selection when background was pressed additively', () => {

    // given
    selection.select(TILE);
    selection.pressBackground(true);

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(false);
    expect(selection.tiles()).toEqual([TILE]);
  });

  it('#endPress should clear selection when background was pressed', () => {

    // given
    selection.select(TILE);
    selection.pressBackground(false);

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(true);
  });

  it('#endPress should forget additive press', () => {

    // given
    selection.select(TILE);
    selection.pressBackground(true);
    selection.endPress();

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(true);
  });

  it('#endPress should keep selection after press of selection', () => {

    // given
    selection.selectAll([TILE, OTHER_TILE], false);
    selection.pressSelection();

    // when
    const cleared = selection.endPress();

    // then
    expect(cleared).toBe(false);
    expect(selection.tiles()).toEqual([TILE, OTHER_TILE]);
  });
});
