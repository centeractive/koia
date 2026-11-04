import { claimClick } from 'app/shared/ui/claimed-click';
import { blurActiveElement, isAdditiveClick, isContentPress, isOverlayTarget, isSelectingClick } from './selecting-click';

describe('isSelectingClick', () => {

  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  function clickOn(html: string, selector: string): MouseEvent {
    container.innerHTML = html;
    const event = new MouseEvent('click', { bubbles: true });
    container.querySelector(selector).dispatchEvent(event);
    return event;
  }

  it('should not select on claimed click', () => {

    // given
    container.innerHTML = '<div></div>';
    const event = new MouseEvent('click', { bubbles: true });
    container.firstElementChild.addEventListener('click', e => claimClick(e));
    container.firstElementChild.dispatchEvent(event);

    // when
    const selecting = isSelectingClick(event);

    // then
    expect(selecting).toBe(false);
  });

  it.each([
    { control: 'link', html: '<a href="#">x</a>', selector: 'a' },
    { control: 'button', html: '<button>x</button>', selector: 'button' },
    { control: 'child of button', html: '<button><span>x</span></button>', selector: 'span' },
    { control: 'input', html: '<input>', selector: 'input' },
    { control: 'select', html: '<select></select>', selector: 'select' },
    { control: 'textarea', html: '<textarea></textarea>', selector: 'textarea' },
    { control: 'sort header', html: '<table><tr><th class="mat-sort-header"><div>x</div></th></tr></table>', selector: 'th div' }
  ])('should not select on click on $control', ({ html, selector }) => {

    // given
    const event = clickOn(html, selector);

    // when
    const selecting = isSelectingClick(event);

    // then
    expect(selecting).toBe(false);
  });

  it('should select on click on plain div', () => {

    // given
    const event = clickOn('<div><div class="inner"></div></div>', '.inner');

    // when
    const selecting = isSelectingClick(event);

    // then
    expect(selecting).toBe(true);
  });

  it('should select on click on svg element', () => {

    // given
    const event = clickOn('<svg><line x1="0" y1="0" x2="10" y2="10"></line></svg>', 'line');

    // when
    const selecting = isSelectingClick(event);

    // then
    expect(selecting).toBe(true);
  });
});

describe('isAdditiveClick', () => {

  it.each([
    { key: 'shift', init: { shiftKey: true }, additive: true },
    { key: 'ctrl', init: { ctrlKey: true }, additive: true },
    { key: 'meta', init: { metaKey: true }, additive: true },
    { key: 'no', init: {}, additive: false }
  ])('should be $additive for click with $key key', ({ init, additive }) => {

    // given
    const event = new MouseEvent('click', init);

    // when
    const result = isAdditiveClick(event);

    // then
    expect(result).toBe(additive);
  });
});

describe('isOverlayTarget', () => {

  let overlay: HTMLElement;

  beforeEach(() => {
    overlay = document.createElement('div');
    overlay.className = 'cdk-overlay-container';
    overlay.innerHTML = '<button></button>';
    document.body.appendChild(overlay);
  });

  afterEach(() => overlay.remove());

  function dispatchedOn(target: EventTarget): Event {
    const event = new PointerEvent('pointerdown', { bubbles: true });
    target.dispatchEvent(event);
    return event;
  }

  it('should be true within overlay container', () => {

    // when
    const result = isOverlayTarget(dispatchedOn(overlay.querySelector('button')));

    // then
    expect(result).toBe(true);
  });

  it('should be false outside overlay container', () => {

    // when
    const result = isOverlayTarget(dispatchedOn(document.body));

    // then
    expect(result).toBe(false);
  });

  it('should be false for event dispatched on document', () => {

    // when
    const result = isOverlayTarget(dispatchedOn(document));

    // then
    expect(result).toBe(false);
  });
});

describe('blurActiveElement', () => {

  let button: HTMLButtonElement;

  beforeEach(() => {
    button = document.createElement('button');
    document.body.appendChild(button);
  });

  afterEach(() => button.remove());

  it('should move focus away from focused element', () => {

    // given
    button.focus();

    // when
    blurActiveElement();

    // then
    expect(document.activeElement).toBe(document.body);
  });

  it('should keep body focused', () => {

    // given
    const blur = vi.spyOn(document.body, 'blur');

    // when
    blurActiveElement();

    // then
    expect(blur).not.toHaveBeenCalled();
  });
});

describe('isContentPress', () => {

  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <div class="div_empty"></div>
      <canvas></canvas>
      <table><tbody><tr><td>cell</td></tr></tbody></table>
      <button></button>
      <div class="div_scroller" style="width: 100px; height: 100px; overflow: scroll"><div style="width: 300px; height: 300px"></div></div>`;
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  function pressOn(target: Element, x = 1, y = 1): MouseEvent {
    const rect = target.getBoundingClientRect();
    const event = new MouseEvent('mousedown', { bubbles: true, clientX: rect.left + x, clientY: rect.top + y });
    target.dispatchEvent(event);
    return event;
  }

  it('should be true on content handling the pointer', () => {

    // when
    const presses = ['canvas', 'td', 'button'].map(selector => isContentPress(pressOn(container.querySelector(selector))));

    // then
    expect(presses).toEqual([true, true, true]);
  });

  it('should be false beside content handling the pointer', () => {

    // when
    const press = isContentPress(pressOn(container.querySelector('.div_empty')));

    // then
    expect(press).toBe(false);
  });

  it('should be true on scrollbars and false on scrolled content', () => {

    // given
    const scroller = container.querySelector<HTMLElement>('.div_scroller');

    // when
    const presses = [
      pressOn(scroller, scroller.clientWidth + 1, 10), pressOn(scroller, 10, scroller.clientHeight + 1), pressOn(scroller, 10, 10)
    ].map(isContentPress);

    // then
    expect(presses).toEqual([true, true, false]);
  });
});
