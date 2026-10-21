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
});
