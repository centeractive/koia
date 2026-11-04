import { ViewElement } from 'app/shared/model/view-config';
import { CanvasClipboard } from './canvas-clipboard';

describe('CanvasClipboard', () => {

  const SCENE_ID = 'scene';

  let clipboard: CanvasClipboard;
  let elements: ViewElement[];

  beforeEach(() => {
    clipboard = new CanvasClipboard();
    elements = [{ x: 10, y: 20, width: 100, height: 100 } as ViewElement];
  });

  it('#has should be false before copying', () => {

    // when
    const has = clipboard.has(SCENE_ID);

    // then
    expect(has).toBe(false);
  });

  it('#has should be true for the scene copied from only', () => {

    // given
    clipboard.copy(SCENE_ID, elements, 1400, false);

    // when
    const has = [clipboard.has(SCENE_ID), clipboard.has('other')];

    // then
    expect(has).toEqual([true, false]);
  });

  it('#paste should return copies of the elements copied before changing them', () => {

    // given
    clipboard.copy(SCENE_ID, elements, 1400, false);
    elements[0].x = 500;

    // when
    const first = clipboard.paste();
    first.elements[0].x = 700;
    const second = clipboard.paste();

    // then
    expect(second.elements).toEqual([{ x: 10, y: 20, width: 100, height: 100 }]);
    expect(second.pageWidth).toBe(1400);
  });

  it('#paste should offset copied elements by one more step on each paste', () => {

    // given
    clipboard.copy(SCENE_ID, elements, 1400, false);

    // when
    const steps = [clipboard.paste().steps, clipboard.paste().steps];

    // then
    expect(steps).toEqual([1, 2]);
  });

  it('#paste should keep cut elements in place on first paste', () => {

    // given
    clipboard.copy(SCENE_ID, elements, 950, true);

    // when
    const steps = [clipboard.paste().steps, clipboard.paste().steps];

    // then
    expect(steps).toEqual([0, 1]);
  });
});
