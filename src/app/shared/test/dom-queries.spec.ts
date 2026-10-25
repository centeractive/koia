import { expectFittingIntoViewport, leftInsetOf, lineCountOf, rightInsetOf, rowCountOf, stylesOf, textsOf } from './dom-queries';

describe('dom queries', () => {

  let root: HTMLElement;

  afterEach(() => root?.remove());

  function createRoot(html: string): HTMLElement {
    root = document.createElement('div');
    root.innerHTML = html;
    document.body.appendChild(root);
    return root;
  }

  it('textsOf should return trimmed texts with collapsed whitespace in document order', () => {

    // given
    createRoot('<p>  a\n   b </p><span>c</span><p>d</p>');

    // when
    const texts = textsOf(root, 'p');

    // then
    expect(texts).toEqual(['a b', 'd']);
  });

  it('rowCountOf should count distinct rows of matching elements', () => {

    // given
    createRoot('<div style="display: flex; flex-wrap: wrap; width: 200px">'
      + '<i style="width: 100px; height: 10px"></i><i style="width: 100px; height: 10px"></i>'
      + '<i style="width: 100px; height: 10px"></i></div>');

    // when
    const rows = rowCountOf(root, 'i');

    // then
    expect(rows).toBe(2);
  });

  it('stylesOf should return computed styles of all matching elements', () => {

    // given
    createRoot('<p style="margin-bottom: 3px">a</p><span>b</span><p style="margin-bottom: 5px">c</p>');

    // when
    const styles = stylesOf(root, 'p');

    // then
    expect(styles.map(s => s.marginBottom)).toEqual(['3px', '5px']);
  });

  it('leftInsetOf should return distance between left edges of element and container', () => {

    // given
    createRoot('<div style="width: 200px; padding-left: 8px"><i style="display: block; width: 50px"></i></div>');

    // when
    const inset = leftInsetOf(root.querySelector('i'), root.querySelector('div'));

    // then
    expect(inset).toBe(8);
  });

  it('rightInsetOf should return distance between right edges of element and container', () => {

    // given
    createRoot('<div style="width: 200px; padding-right: 8px"><i style="display: block; width: 50px; margin-left: auto"></i></div>');

    // when
    const inset = rightInsetOf(root.querySelector('i'), root.querySelector('div'));

    // then
    expect(inset).toBe(8);
  });

  it('lineCountOf should count one line for unwrapped text', () => {

    // given
    const div = createRoot('<div style="font: 16px monospace">alpha beta</div>').firstElementChild;

    // when
    const lines = lineCountOf(div);

    // then
    expect(lines).toBe(1);
  });

  it('lineCountOf should count two lines for wrapped text', () => {

    // given
    const div = createRoot('<div style="font: 16px monospace; width: 6ch">alpha beta</div>').firstElementChild;

    // when
    const lines = lineCountOf(div);

    // then
    expect(lines).toBe(2);
  });

  function createDialogWithElement(): HTMLElement {
    const width = window.innerWidth * 0.5;
    const dialog = createRoot('<dialog style="padding: 0; border: 0; max-width: none; max-height: none">'
      + '<i style="display: block; width: ' + width + 'px; height: ' + width * 9 / 16 + 'px"></i></dialog>')
      .querySelector('dialog');
    dialog.showModal();
    return dialog.querySelector('i');
  }

  it('expectFittingIntoViewport should accept element fitting into viewport with its aspect ratio', () => {

    // given
    const element = createDialogWithElement();

    // when
    const check = () => expectFittingIntoViewport(element, 0.9, 16 / 9);

    // then
    expect(check).not.toThrow();
  });

  it('expectFittingIntoViewport should reject element exceeding viewport height share', () => {

    // given
    const element = createDialogWithElement();

    // when
    const check = () => expectFittingIntoViewport(element, 0.1, 16 / 9);

    // then
    expect(check).toThrow();
  });
});
