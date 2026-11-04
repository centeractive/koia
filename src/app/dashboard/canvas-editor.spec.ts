import { ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import { ModelToViewConverter, ViewToModelConverter } from 'app/shared/services/view-persistence';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { CanvasClipboard } from './canvas-clipboard';
import { CanvasEditor, CanvasEditorHost } from './canvas-editor';
import { FreeLayout } from './free-layout';
import { TileSelection } from './tile-selection';

class FakeHost implements CanvasEditorHost {

  readonly selection = new TileSelection<ElementContext>();
  readonly arranged = vi.fn();
  readonly reordered = vi.fn();
  all: ElementContext[] = [];
  allowOverlap = false;

  overlapAllowed(): boolean {
    return this.allowOverlap;
  }

  contexts(): ElementContext[] {
    return this.all;
  }

  remove(context: ElementContext): void {
    this.all = this.all.filter(c => c !== context);
    this.selection.remove(context);
  }

  toViewElements(contexts: ElementContext[]): ViewElement[] {
    return new ModelToViewConverter().convertElements(contexts);
  }

  append(elements: ViewElement[]): ElementContext[] {
    const added = new ViewToModelConverter([]).convert(elements);
    this.all = this.all.concat(added);
    return added;
  }

  sceneId(): string {
    return 'scene';
  }
}

describe('CanvasEditor', () => {

  let host: FakeHost;
  let clipboard: CanvasClipboard;
  let editor: CanvasEditor;

  beforeEach(() => {
    host = new FakeHost();
    clipboard = new CanvasClipboard();
    editor = new CanvasEditor(host, clipboard, new FreeLayout(PageFormat.LANDSCAPE));
  });

  function tile(x: number, y: number, width = 200, height = 100, z?: number): ElementContext {
    const context = new SummaryContext([]);
    context.setPosition(x, y);
    context.setSize(width, height);
    context.z = z;
    host.all.push(context);
    return context;
  }

  function note(x: number, y: number): ElementContext {
    const context = new TextBoxContext([]);
    context.setPosition(x, y);
    context.setSize(200, 100);
    host.all.push(context);
    return context;
  }

  function rectsOf(contexts: ElementContext[]): number[][] {
    return contexts.map(c => [c.x, c.y, c.width, c.height]);
  }

  function key(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    return new KeyboardEvent('keydown', { key, code: 'Key' + key.toUpperCase(), ...init });
  }

  it('#targetsOf should return selection when context is selected or omitted', () => {

    // given
    const [a, b] = [tile(0, 0), tile(300, 0)];
    host.selection.selectAll([a, b], false);

    // when
    const targets = [editor.targetsOf(a), editor.targetsOf()];

    // then
    expect(targets).toEqual([[a, b], [a, b]]);
  });

  it('#targetsOf should return context alone when not selected', () => {

    // given
    const [a, b] = [tile(0, 0), tile(300, 0)];
    host.selection.select(a);

    // when
    const targets = editor.targetsOf(b);

    // then
    expect(targets).toEqual([b]);
  });

  it('#toFront and #toBack should restack targets and report the reordering', () => {

    // given
    const [a, b, c] = [tile(0, 0, 200, 100, 1), tile(0, 0, 200, 100, 2), tile(0, 0, 200, 100, 3)];

    // when
    editor.toFront([a]);
    editor.toBack([c]);

    // then
    expect([a.z, b.z, c.z]).toEqual([3, 2, 1]);
    expect(host.reordered).toHaveBeenCalledTimes(2);
  });

  it('#forward and #backward should step targets and report the reordering', () => {

    // given
    const [a, b, c] = [tile(0, 0, 200, 100, 1), tile(0, 0, 200, 100, 2), tile(0, 0, 200, 100, 3)];

    // when
    editor.forward([a]);
    editor.backward([c]);

    // then
    expect([a.z, b.z, c.z]).toEqual([3, 1, 2]);
    expect(host.reordered).toHaveBeenCalledTimes(2);
  });

  it('#align should move targets keeping them fixed', () => {

    // given
    const [a, b] = [tile(100, 0), tile(400, 300)];
    host.selection.selectAll([a, b], false);

    // when
    editor.align([a, b], 'left');

    // then
    expect(rectsOf([a, b])).toEqual([[100, 0, 200, 100], [100, 300, 200, 100]]);
    expect(host.arranged).toHaveBeenCalledWith([], [a, b]);
    expect(host.selection.tiles()).toEqual([a, b]);
  });

  it('#align should report targets moved onto another page', () => {

    // given
    const [a, b] = [tile(0, 100), tile(300, 1000)];

    // when
    editor.align([a, b], 'top');

    // then
    expect(host.arranged).toHaveBeenCalledWith([b], [a, b]);
  });

  it('#distribute should space targets', () => {

    // given
    const contexts = [tile(0, 0, 100), tile(100, 0, 100), tile(600, 0, 100)];

    // when
    editor.distribute(contexts, 'x');

    // then
    expect(contexts.map(c => c.x)).toEqual([0, 300, 600]);
  });

  it('#nudge should move a single tile in its row and notes plainly', () => {

    // given
    const [a, n] = [tile(100, 100), note(500, 100)];

    // when
    editor.nudge([a, n], -10, 1);

    // then
    expect(rectsOf([a, n])).toEqual([[90, 101, 200, 100], [490, 101, 200, 100]]);
    expect(host.arranged).toHaveBeenCalledWith([], [a]);
  });

  it('#align should keep the aligned tiles in place for the others to give way', () => {

    // given
    const [a, c] = [tile(0, 250, 300, 200), tile(400, 0, 300, 140)];

    // when
    editor.align([a, c], 'bottom');

    // then
    expect(rectsOf([c])).toEqual([[400, 310, 300, 140]]);
    expect(host.arranged).toHaveBeenCalledWith([], [a, c]);
  });

  it('#align should put the lower of aligned tiles covering each other below the upper', () => {

    // given
    const [a, b, n] = [tile(0, 0), tile(300, 50), note(600, 0)];

    // when
    editor.align([a, b, n], 'left');

    // then
    expect(rectsOf([a, b, n])).toEqual([[0, 0, 200, 100], [0, 110, 200, 100], [0, 0, 200, 100]]);
  });

  it('#align should neither separate nor fix tiles while overlapping is allowed', () => {

    // given
    const [a, b] = [tile(0, 0), tile(300, 50)];
    host.allowOverlap = true;

    // when
    editor.align([a, b], 'left');

    // then
    expect(rectsOf([b])).toEqual([[0, 50, 200, 100]]);
    expect(host.arranged).toHaveBeenCalledWith([], []);
  });

  it('#nudge should shift the right neighbour of a single tile nudged into it', () => {

    // given
    const [a, b] = [tile(0, 0, 300, 200), tile(310, 0, 300, 200)];

    // when
    editor.nudge([a], 10, 0);

    // then
    expect(rectsOf([a, b])).toEqual([[10, 0, 300, 200], [320, 0, 300, 200]]);
    expect(host.arranged).toHaveBeenCalledWith([], [a, b]);
  });

  it('#nudge should keep the neighbour of a tile nudged into it while overlapping is allowed', () => {

    // given
    const [a, b] = [tile(0, 0, 300, 200), tile(310, 0, 300, 200)];
    host.allowOverlap = true;

    // when
    editor.nudge([a], 10, 0);

    // then
    expect(rectsOf([b])).toEqual([[310, 0, 300, 200]]);
    expect(host.arranged).toHaveBeenCalledWith([], [a]);
  });

  it('#nudge should move several tiles keeping them fixed', () => {

    // given
    const [a, b, c] = [tile(0, 0, 300, 200), tile(0, 210, 300, 200), tile(310, 0, 300, 200)];

    // when
    editor.nudge([a, b], 10, 0);

    // then
    expect(rectsOf([a, b, c])).toEqual([[10, 0, 300, 200], [10, 210, 300, 200], [310, 0, 300, 200]]);
    expect(host.arranged).toHaveBeenCalledWith([], [a, b]);
  });

  it('#delete should remove targets', () => {

    // given
    const [a, b, c] = [tile(0, 0), tile(300, 0), tile(600, 0)];

    // when
    editor.delete([a, c]);

    // then
    expect(host.all).toEqual([b]);
  });

  it('#paste should add copies offset by a step, on top, selected and pushing others down', () => {

    // given
    const [a, b] = [tile(100, 100, 200, 100, 2), tile(400, 100, 200, 100, 1)];
    editor.copy([a]);

    // when
    editor.paste();

    // then
    const pasted = host.all[2];
    expect(rectsOf([pasted])).toEqual([[110, 110, 200, 100]]);
    expect(pasted.z).toBe(3);
    expect(host.selection.tiles()).toEqual([pasted]);
    expect(host.arranged).toHaveBeenCalledWith([pasted], [a, b]);
  });

  it('#paste should offset each paste by one more step', () => {

    // given
    const a = tile(100, 100);
    editor.copy([a]);

    // when
    editor.paste();
    editor.paste();

    // then
    expect(rectsOf(host.all.slice(1))).toEqual([[110, 110, 200, 100], [120, 120, 200, 100]]);
  });

  it('#paste should place top left corner of copied tiles at given point', () => {

    // given
    const [a, b] = [tile(100, 100), tile(400, 300)];
    editor.copy([a, b]);

    // when
    editor.paste({ x: 50, y: 960 });

    // then
    expect(rectsOf(host.all.slice(2))).toEqual([[50, 960, 200, 100], [350, 1160, 200, 100]]);
  });

  it('#paste should scale tiles copied from pages of other width before keeping them within the page width', () => {

    // given
    const portraitEditor = new CanvasEditor(host, clipboard, new FreeLayout(PageFormat.PORTRAIT));
    portraitEditor.copy([tile(500, 100, 450, 100)]);

    // when
    editor.paste();

    // then
    expect(rectsOf([host.all[1]])).toEqual([[734, 110, 666, 100]]);
  });

  it('#paste should scale tiles copied from wider pages beyond the width of the narrower pages', () => {

    // given
    const portraitEditor = new CanvasEditor(host, clipboard, new FreeLayout(PageFormat.PORTRAIT));
    editor.copy([tile(1000, 100, 400, 100)]);

    // when
    portraitEditor.paste();

    // then
    expect(rectsOf([host.all[1]])).toEqual([[681, 110, 269, 100]]);
  });

  it('#cut should remove targets and paste them in place first', () => {

    // given
    const a = tile(100, 100);
    editor.cut([a]);

    // when
    editor.paste();

    // then
    expect(host.all).not.toContain(a);
    expect(rectsOf(host.all)).toEqual([[100, 100, 200, 100]]);
  });

  it('#duplicate should add copies offset by a step', () => {

    // given
    const a = tile(100, 100);

    // when
    editor.duplicate([a]);

    // then
    expect(rectsOf(host.all)).toEqual([[100, 100, 200, 100], [110, 110, 200, 100]]);
    expect(clipboard.has('scene')).toBe(false);
  });

  it('#canPaste should be true after copying', () => {

    // given
    const before = editor.canPaste();
    editor.copy([tile(0, 0)]);

    // when
    const after = editor.canPaste();

    // then
    expect([before, after]).toEqual([false, true]);
  });

  it('#selectAll should select all tiles', () => {

    // given
    const contexts = [tile(0, 0), note(300, 0)];

    // when
    editor.selectAll();

    // then
    expect(host.selection.tiles()).toEqual(contexts);
  });

  describe('#handleKey', () => {

    it('should select all tiles without selection', () => {

      // given
      const a = tile(0, 0);

      // when
      const handled = editor.handleKey(key('a', { ctrlKey: true }));

      // then
      expect(handled).toBe(true);
      expect(host.selection.tiles()).toEqual([a]);
    });

    it('should paste copied tiles without selection', () => {

      // given
      editor.copy([tile(0, 0)]);

      // when
      const handled = editor.handleKey(key('v', { ctrlKey: true }));

      // then
      expect(handled).toBe(true);
      expect(host.all.length).toBe(2);
    });

    it('should not handle paste with empty clipboard', () => {

      // when
      const handled = editor.handleKey(key('v', { ctrlKey: true }));

      // then
      expect(handled).toBe(false);
    });

    it('should not handle keys acting on selected tiles while none are selected', () => {

      // given
      tile(0, 0);

      // when
      const handled = [key('Delete'), key('ArrowLeft'), key('c', { ctrlKey: true })].map(e => editor.handleKey(e));

      // then
      expect(handled).toEqual([false, false, false]);
      expect(host.all.length).toBe(1);
    });

    it('should nudge selected tiles', () => {

      // given
      const a = tile(100, 100);
      host.selection.select(a);

      // when
      const handled = editor.handleKey(key('ArrowRight', { shiftKey: true }));

      // then
      expect(handled).toBe(true);
      expect([a.x, a.y]).toEqual([110, 100]);
    });

    it('should apply commands to selected tiles', () => {

      // given
      const [a, b] = [tile(0, 0, 200, 100, 1), tile(300, 0, 200, 100, 2)];
      host.selection.select(a);

      // when
      const handled = [
        key('F', { ctrlKey: true, shiftKey: true }), key('B', { ctrlKey: true, shiftKey: true }),
        key('F', { ctrlKey: true, shiftKey: true, altKey: true }), key('B', { ctrlKey: true, shiftKey: true, altKey: true }),
        key('c', { ctrlKey: true }), key('d', { ctrlKey: true }), key('Delete')
      ].map(e => editor.handleKey(e));

      // then
      expect(handled).toEqual([true, true, true, true, true, true, true]);
      expect(host.all).toEqual([a, b]);
      expect(clipboard.has('scene')).toBe(true);
    });

    it('should cut selected tiles', () => {

      // given
      const [a, b] = [tile(0, 0), tile(300, 0)];
      host.selection.select(a);

      // when
      const handled = editor.handleKey(key('x', { ctrlKey: true }));

      // then
      expect(handled).toBe(true);
      expect(host.all).toEqual([b]);
      expect(clipboard.has('scene')).toBe(true);
    });

    it('should not copy while a text is selected', () => {

      // given
      host.selection.select(tile(0, 0));
      const text = document.createElement('p');
      text.textContent = 'text';
      document.body.appendChild(text);
      document.getSelection().selectAllChildren(text);

      // when
      const handled = editor.handleKey(key('c', { ctrlKey: true }));

      // then
      document.getSelection().removeAllRanges();
      text.remove();
      expect(handled).toBe(false);
      expect(clipboard.has('scene')).toBe(false);
    });

    it('should not handle other keys', () => {

      // given
      host.selection.select(tile(0, 0));

      // when
      const handled = editor.handleKey(key('q'));

      // then
      expect(handled).toBe(false);
    });
  });
});
