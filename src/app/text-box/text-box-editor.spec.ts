import { JSONContent } from '@tiptap/core';
import { userEvent } from 'vitest/browser';
import { TextBoxEditor } from './text-box-editor';
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_TEXT_COLOR, TextStyleState } from './text-box-style';

describe('TextBoxEditor', () => {

  let element: HTMLElement;
  let placeholderText: string;
  let onContentChange: (content: JSONContent) => void;
  let onStateChange: (state: TextStyleState) => void;
  let editor: TextBoxEditor;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    placeholderText = 'Enter text';
    onContentChange = vi.fn();
    onStateChange = vi.fn();
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  function createEditor(content: JSONContent): void {
    editor = new TextBoxEditor(element, content, () => placeholderText, onContentChange, onStateChange);
  }

  function doc(...paragraphs: JSONContent[]): JSONContent {
    return { type: 'doc', content: paragraphs };
  }

  function paragraph(...content: JSONContent[]): JSONContent {
    return { type: 'paragraph', attrs: { textAlign: null }, content };
  }

  function text(value: string, marks?: JSONContent['marks']): JSONContent {
    return marks ? { type: 'text', marks, text: value } : { type: 'text', text: value };
  }

  function proseMirror(): HTMLElement {
    return element.querySelector<HTMLElement>('.ProseMirror');
  }

  function lastContent(): JSONContent {
    return vi.mocked(onContentChange).mock.lastCall[0];
  }

  async function moveCaretToEnd(): Promise<void> {
    await userEvent.click(proseMirror());
    await userEvent.keyboard('{Control>}{End}{/Control}');
  }

  async function selectAll(): Promise<void> {
    await userEvent.click(proseMirror());
    await userEvent.keyboard('{Control>}a{/Control}');
  }

  it('should render initial content', () => {

    // when
    createEditor(doc(paragraph(text('Hello'))));

    // then
    expect(proseMirror().querySelector('p').textContent).toBe('Hello');
  });

  it('should render single empty paragraph when content is missing', () => {

    // when
    createEditor(null);

    // then
    expect(proseMirror().querySelectorAll('p').length).toBe(1);
    expect(proseMirror().textContent).toBe('');
  });

  it('should create new paragraph on Enter', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await moveCaretToEnd();

    // when
    await userEvent.keyboard('{Enter}b');

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a')), paragraph(text('b'))));
  });

  it('should create hard break on Shift+Enter', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await moveCaretToEnd();

    // when
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}b');

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a'), { type: 'hardBreak' }, text('b'))));
  });

  it('should toggle bold of selected text', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();

    // when
    editor.toggleBold();

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a', [{ type: 'bold' }]))));
    expect(editor.state().bold).toBe(true);
  });

  it('should toggle italic of selected text', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();

    // when
    editor.toggleItalic();

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a', [{ type: 'italic' }]))));
    expect(editor.state().italic).toBe(true);
  });

  it('should toggle underline of selected text', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();

    // when
    editor.toggleUnderline();

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a', [{ type: 'underline' }]))));
    expect(editor.state().underline).toBe(true);
  });

  it('should set font family of selected text', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();

    // when
    editor.setFontFamily('Georgia, serif');

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a', [{ type: 'textStyle', attrs: expect.objectContaining({ fontFamily: 'Georgia, serif' }) }]))));
    expect(editor.state().fontFamily).toBe('Georgia, serif');
  });

  it('should set font size of selected text', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();

    // when
    editor.setFontSize('24px');

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a', [{ type: 'textStyle', attrs: expect.objectContaining({ fontSize: '24px' }) }]))));
    expect(editor.state().fontSize).toBe('24px');
  });

  it('should set color of selected text', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();

    // when
    editor.setColor('#ff0000');

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a', [{ type: 'textStyle', attrs: expect.objectContaining({ color: '#ff0000' }) }]))));
    expect(editor.state().color).toBe('#ff0000');
  });

  it('should apply color to selected text without focusing editor', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // when
    editor.applyColor('#00ff00');

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a', [{ type: 'textStyle', attrs: expect.objectContaining({ color: '#00ff00' }) }]))));
    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('should focus editor with caret at end of text', async () => {

    // given
    createEditor(doc(paragraph(text('first')), paragraph(text('last'))));

    // when
    editor.focusEnd();

    // then
    await vi.waitFor(() => expect(document.activeElement).toBe(proseMirror()));
    const selection = document.getSelection();
    expect(selection.focusNode.textContent).toBe('last');
    expect(selection.focusOffset).toBe(4);
  });

  it('should unset color of selected text', async () => {

    // given
    createEditor(doc(paragraph(text('a', [{ type: 'textStyle', attrs: { color: '#ff0000' } }]))));
    await selectAll();

    // when
    editor.unsetColor();

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('a'))));
    expect(editor.state().color).toBe(DEFAULT_TEXT_COLOR);
  });

  it('should set text alignment of selected paragraph', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();

    // when
    editor.setTextAlign('center');

    // then
    expect(lastContent()).toEqual(doc({ type: 'paragraph', attrs: { textAlign: 'center' }, content: [text('a')] }));
    expect(editor.state().textAlign).toBe('center');
  });

  it('should return default state for unstyled text', () => {

    // given
    createEditor(doc(paragraph(text('a'))));

    // when
    const state = editor.state();

    // then
    expect(state).toEqual({
      bold: false,
      italic: false,
      underline: false,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontSize: DEFAULT_FONT_SIZE,
      color: DEFAULT_TEXT_COLOR,
      textAlign: 'left'
    });
  });

  it('should report content and state changes to callbacks', async () => {

    // given
    createEditor(doc(paragraph(text('a'))));
    await selectAll();
    vi.mocked(onContentChange).mockClear();
    vi.mocked(onStateChange).mockClear();

    // when
    editor.toggleBold();

    // then
    expect(onContentChange).toHaveBeenCalledWith(doc(paragraph(text('a', [{ type: 'bold' }]))));
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ bold: true }));
  });

  it('should not apply markdown input rules', async () => {

    // given
    createEditor(null);
    await moveCaretToEnd();

    // when
    await userEvent.keyboard('**x**');

    // then
    expect(lastContent()).toEqual(doc(paragraph(text('**x**'))));
  });

  it('should drop background color and line height from pasted content', async () => {

    // given
    createEditor(null);
    await moveCaretToEnd();
    const dt = new DataTransfer();
    dt.setData('text/html', '<span style="background-color: rgb(255, 0, 0); line-height: 3">x</span>');

    // when
    proseMirror().dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));

    // then
    expect(proseMirror().textContent).toBe('x');
    expect(JSON.stringify(lastContent())).not.toMatch(/backgroundColor|lineHeight/);
  });

  it('should not inject Tiptap CSS', async () => {

    // given
    const proseMirrorStyleCount = () => Array.from(document.querySelectorAll('style')).filter(s => s.textContent.includes('.ProseMirror')).length;
    const count = proseMirrorStyleCount();

    // when
    createEditor(null);
    await new Promise(resolve => setTimeout(resolve));

    // then
    expect(proseMirrorStyleCount()).toBe(count);
  });

  it('should show placeholder from provider', () => {

    // when
    createEditor(null);

    // then
    expect(proseMirror().querySelector('p').getAttribute('data-placeholder')).toBe('Enter text');
  });

  it('should refresh placeholder after provider value changed', () => {

    // given
    createEditor(null);
    placeholderText = 'Text eingeben';

    // when
    editor.refreshPlaceholder();

    // then
    expect(proseMirror().querySelector('p').getAttribute('data-placeholder')).toBe('Text eingeben');
  });

  it('should remove editor view on destroy', () => {

    // given
    createEditor(doc(paragraph(text('a'))));

    // when
    editor.destroy();

    // then
    expect(proseMirror()).toBeNull();
  });
});
