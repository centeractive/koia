import { claimClick } from 'app/shared/ui/claimed-click';
import { isSelectingClick } from './selecting-click';

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
