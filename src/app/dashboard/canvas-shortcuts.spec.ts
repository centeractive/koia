import de from 'assets/i18n/de.json';
import { LanguageService } from 'app/shared/services/language';
import { commandOf, isCanvasKey, nudgeOf, shortcutLabelOf } from './canvas-shortcuts';

describe('canvas shortcuts', () => {

  function key(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    return new KeyboardEvent('keydown', { key, code: 'Key' + key.toUpperCase(), cancelable: true, ...init });
  }

  it('commandOf should map draw.io shortcuts', () => {

    // when
    const commands = [
      key('a', { ctrlKey: true }), key('c', { ctrlKey: true }), key('x', { ctrlKey: true }), key('v', { ctrlKey: true }),
      key('d', { ctrlKey: true }), key('F', { ctrlKey: true, shiftKey: true }), key('B', { ctrlKey: true, shiftKey: true }),
      key('F', { ctrlKey: true, shiftKey: true, altKey: true }), key('B', { ctrlKey: true, shiftKey: true, altKey: true }),
      key('Delete'), key('Backspace')
    ].map(commandOf);

    // then
    expect(commands).toEqual(['selectAll', 'copy', 'cut', 'paste', 'duplicate', 'toFront', 'toBack', 'forward', 'backward', 'delete', 'delete']);
  });

  it('commandOf should accept Cmd as Ctrl', () => {

    // when
    const command = commandOf(key('a', { metaKey: true }));

    // then
    expect(command).toBe('selectAll');
  });

  it('commandOf should match exact modifiers', () => {

    // when
    const commands = [key('a'), key('A', { ctrlKey: true, shiftKey: true }), key('c', { ctrlKey: true, altKey: true }),
      key('Delete', { ctrlKey: true }), key('Delete', { shiftKey: true }), key('Delete', { altKey: true }), key('q', { ctrlKey: true })].map(commandOf);

    // then
    expect(commands).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
  });

  it('commandOf should take letter from key on other keyboard layouts', () => {

    // when
    const command = commandOf(key('a', { ctrlKey: true, code: 'KeyQ' }));

    // then
    expect(command).toBe('selectAll');
  });

  it('commandOf should take letter from physical key with Alt, which changes the key', () => {

    // when
    const command = commandOf(key('Ï', { metaKey: true, shiftKey: true, altKey: true, code: 'KeyF' }));

    // then
    expect(command).toBe('forward');
  });

  it('nudgeOf should move by one page unit, by a step with Shift', () => {

    // when
    const nudges = [key('ArrowLeft'), key('ArrowRight'), key('ArrowUp'), key('ArrowDown', { shiftKey: true })].map(nudgeOf);

    // then
    expect(nudges).toEqual([{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 10 }]);
  });

  it('nudgeOf should ignore other keys and arrows with Ctrl or Alt', () => {

    // when
    const nudges = [key('a'), key('ArrowLeft', { ctrlKey: true }), key('ArrowLeft', { altKey: true })].map(nudgeOf);

    // then
    expect(nudges).toEqual([undefined, undefined, undefined]);
  });

  it('shortcutLabelOf should name the keys as on the keyboards of the current language', () => {

    // given
    vi.spyOn(LanguageService, 'instant').mockImplementation(key => key.split('.').reduce((o, k) => o[k], de as object) as unknown as string);

    // when
    const labels = (['backward', 'delete'] as const).map(shortcutLabelOf);

    // then
    vi.restoreAllMocks();
    expect(labels).toEqual(['Strg+Alt+Umschalt+B', 'Entf']);
  });

  it('shortcutLabelOf should name the keys', () => {

    // when
    const labels = (['selectAll', 'toFront', 'backward', 'delete'] as const).map(shortcutLabelOf);

    // then
    expect(labels).toEqual(['Ctrl+A', 'Ctrl+Shift+F', 'Ctrl+Alt+Shift+B', 'Del']);
  });

  describe('isCanvasKey', () => {

    let content: HTMLDivElement;
    let outside: HTMLButtonElement;

    beforeEach(() => {
      content = document.createElement('div');
      content.innerHTML = '<span tabindex="0"></span><textarea></textarea><div contenteditable="true"></div>';
      outside = document.createElement('button');
      document.body.append(content, outside);
    });

    afterEach(() => {
      content.remove();
      outside.remove();
    });

    function dispatchedOn(target: EventTarget, event = key('Delete')): KeyboardEvent {
      target.dispatchEvent(event);
      return event;
    }

    it('should accept key without focus', () => {

      // when
      const accepted = isCanvasKey(dispatchedOn(document.body), content);

      // then
      expect(accepted).toBe(true);
    });

    it('should accept key dispatched on document', () => {

      // when
      const accepted = isCanvasKey(dispatchedOn(document), content);

      // then
      expect(accepted).toBe(true);
    });

    it('should accept key with focus within content', () => {

      // given
      const span = content.querySelector('span');
      span.focus();

      // when
      const accepted = isCanvasKey(dispatchedOn(span), content);

      // then
      expect(accepted).toBe(true);
    });

    it('should reject key with focus outside content', () => {

      // given
      outside.focus();

      // when
      const accepted = isCanvasKey(dispatchedOn(outside), content);

      // then
      expect(accepted).toBe(false);
    });

    it('should reject key typed into field', () => {

      // given
      const textarea = content.querySelector('textarea');
      textarea.focus();

      // when
      const accepted = isCanvasKey(dispatchedOn(textarea), content);

      // then
      expect(accepted).toBe(false);
    });

    it('should reject key typed into editable text', () => {

      // given
      const editable = content.querySelector<HTMLElement>('[contenteditable]');
      editable.focus();

      // when
      const accepted = isCanvasKey(dispatchedOn(editable), content);

      // then
      expect(accepted).toBe(false);
    });

    it('should reject key handled before', () => {

      // given
      const event = key('Delete');
      event.preventDefault();

      // when
      const accepted = isCanvasKey(dispatchedOn(document.body, event), content);

      // then
      expect(accepted).toBe(false);
    });
  });
});
