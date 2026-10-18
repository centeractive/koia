import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { TextBoxEditor } from '../text-box-editor';
import { TextBoxSelectComponent } from '../text-box-select/text-box-select.component';
import { DEFAULT_BACKGROUND_COLOR, FONT_FAMILIES, FONT_SIZES, TextStyleState } from '../text-box-style';
import { TextBoxToolbarComponent } from './text-box-toolbar.component';

describe('TextBoxToolbarComponent', () => {

  const defaultState: TextStyleState = {
    bold: false,
    italic: false,
    underline: false,
    fontFamily: FONT_FAMILIES[0].value,
    fontSize: '14px',
    color: '#000000',
    textAlign: 'left'
  };
  const toggleSelectors = ['.but_bold', '.but_italic', '.but_underline', '.but_align_left', '.but_align_center', '.but_align_right'];

  let fixture: ComponentFixture<TextBoxToolbarComponent>;
  let component: TextBoxToolbarComponent;
  let editor: TextBoxEditor;
  let overlayContainerElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextBoxToolbarComponent, TextBoxSelectComponent],
      imports: [OverlayModule, MatIconModule, MatIconTestingModule, MatTooltipModule]
    });
    overlayContainerElement = TestBed.inject(OverlayContainer).getContainerElement();
    fixture = TestBed.createComponent(TextBoxToolbarComponent);
    component = fixture.componentInstance;
    editor = {
      toggleBold: vi.fn(),
      toggleItalic: vi.fn(),
      toggleUnderline: vi.fn(),
      setFontFamily: vi.fn(),
      setFontSize: vi.fn(),
      setColor: vi.fn(),
      unsetColor: vi.fn(),
      setTextAlign: vi.fn()
    } as unknown as TextBoxEditor;
    component.editor = editor;
  });

  function render(state: Partial<TextStyleState> = {}, backgroundColor?: string): void {
    component.state = { ...defaultState, ...state };
    component.backgroundColor = backgroundColor;
    fixture.detectChanges();
  }

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.debugElement.query(By.css(selector))?.nativeElement;
  }

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return fixture.debugElement.queryAll(By.css(selector)).map(e => e.nativeElement);
  }

  function openSelect(selectSelector: string): void {
    query(selectSelector + ' .but_select').click();
    fixture.detectChanges();
  }

  function selectOptions(): HTMLButtonElement[] {
    return Array.from(overlayContainerElement.querySelectorAll<HTMLButtonElement>('.but_select_option'));
  }

  function iconOf(selector: string): string {
    return query(selector).querySelector('mat-icon').getAttribute('svgIcon');
  }

  function changeColor(input: HTMLInputElement, color: string): void {
    input.value = color;
    input.dispatchEvent(new Event('change'));
  }

  it('should render a rounded shadowed toolbar of fixed height on a single row', () => {

    // when
    render();

    // then
    const toolbar = query('.div_text_box_toolbar');
    const style = getComputedStyle(toolbar);
    expect(toolbar.getBoundingClientRect().height).toBe(40);
    expect(style.flexWrap).toBe('nowrap');
    expect(style.borderRadius).toBe('10px');
    expect(style.borderTopWidth).toBe('1px');
    expect(style.boxShadow).not.toBe('none');
  });

  it('should render plain buttons without Material button styling', () => {

    // when
    render();

    // then
    expect(query('.mat-mdc-button-base')).toBeUndefined();
    const buttons = queryAll<HTMLButtonElement>('button');
    expect(buttons.length).toBe(12);
    buttons.forEach(b => {
      const style = getComputedStyle(b);
      expect(b.type).toBe('button');
      expect(b.classList).toContain('button_tt');
      expect(b.getBoundingClientRect().height).toBe(32);
      expect(style.borderRadius).toBe('8px');
    });
    buttons.filter(b => b !== query('.but_align_left'))
      .forEach(b => expect(getComputedStyle(b).backgroundColor).toBe('rgba(0, 0, 0, 0)'));
  });

  it('should render Lucide icons of 18px', () => {

    // when
    render();

    // then
    expect(['.but_bold', '.but_italic', '.but_underline', '.but_align_left', '.but_align_center', '.but_align_right',
      '.label_text_color', '.but_reset_text_color', '.label_background_color', '.but_reset_background_color', '.but_border',
      '.but_delete'].map(s => iconOf(s))).toEqual(['lucide_bold', 'lucide_italic', 'lucide_underline', 'lucide_text_align_start',
      'lucide_text_align_center', 'lucide_text_align_end', 'lucide_baseline', 'lucide_eraser', 'lucide_paint_bucket',
      'lucide_eraser', 'lucide_square', 'lucide_trash_2']);
    expect(query('.but_bold mat-icon').getBoundingClientRect().width).toBe(18);
  });

  it('should label font family select with label of current font family', () => {

    // when
    render({ fontFamily: FONT_FAMILIES[2].value });

    // then
    expect(query('.select_font_family .but_select').textContent.trim()).toBe(FONT_FAMILIES[2].label);
  });

  it('should label font size select with current font size', () => {

    // when
    render({ fontSize: '24px' });

    // then
    expect(query('.select_font_size .but_select').textContent.trim()).toBe('24px');
  });

  it('should list all font families in their own font with current font family active', () => {

    // given
    render({ fontFamily: FONT_FAMILIES[1].value });

    // when
    openSelect('.select_font_family');

    // then
    const options = selectOptions();
    expect(options.map(o => o.textContent.trim())).toEqual(FONT_FAMILIES.map(f => f.label));
    expect(options.map(o => o.style.fontFamily)).toEqual(FONT_FAMILIES.map(f => f.value));
    expect(options.map(o => o.classList.contains('button_tt_active'))).toEqual(FONT_FAMILIES.map((_f, i) => i === 1));
  });

  it('should set font family when font family option is clicked', () => {

    // given
    render();
    openSelect('.select_font_family');

    // when
    selectOptions()[3].click();

    // then
    expect(editor.setFontFamily).toHaveBeenCalledWith(FONT_FAMILIES[3].value);
  });

  it('should list all font sizes with current font size active', () => {

    // given
    render({ fontSize: FONT_SIZES[4] });

    // when
    openSelect('.select_font_size');

    // then
    const options = selectOptions();
    expect(options.map(o => o.textContent.trim())).toEqual(FONT_SIZES);
    expect(options.map(o => o.classList.contains('button_tt_active'))).toEqual(FONT_SIZES.map((_s, i) => i === 4));
  });

  it('should set font size when font size option is clicked', () => {

    // given
    render();
    openSelect('.select_font_size');

    // when
    selectOptions()[5].click();

    // then
    expect(editor.setFontSize).toHaveBeenCalledWith(FONT_SIZES[5]);
  });

  it('should toggle bold when bold button is clicked', () => {

    // given
    render();

    // when
    query('.but_bold').click();

    // then
    expect(editor.toggleBold).toHaveBeenCalled();
  });

  it('should toggle italic when italic button is clicked', () => {

    // given
    render();

    // when
    query('.but_italic').click();

    // then
    expect(editor.toggleItalic).toHaveBeenCalled();
  });

  it('should toggle underline when underline button is clicked', () => {

    // given
    render();

    // when
    query('.but_underline').click();

    // then
    expect(editor.toggleUnderline).toHaveBeenCalled();
  });

  it('should set text alignment when alignment buttons are clicked', () => {

    // given
    render();

    // when
    query('.but_align_left').click();
    query('.but_align_center').click();
    query('.but_align_right').click();

    // then
    expect(vi.mocked(editor.setTextAlign).mock.calls).toEqual([['left'], ['center'], ['right']]);
  });

  it('should mark toggles active when state is set', () => {

    // when
    render({ bold: true, italic: true, underline: true, textAlign: 'center' });

    // then
    const activeToggles = toggleSelectors.filter(s => !['.but_align_left', '.but_align_right'].includes(s));
    activeToggles.forEach(s => expect(query(s).classList).toContain('button_tt_active'));
    expect(query('.but_align_left').classList).not.toContain('button_tt_active');
    expect(query('.but_align_right').classList).not.toContain('button_tt_active');
  });

  it('should not mark toggles active when state is not set', () => {

    // when
    render({ textAlign: 'right' });

    // then
    toggleSelectors.filter(s => s !== '.but_align_right')
      .forEach(s => expect(query(s).classList).not.toContain('button_tt_active'));
    expect(query('.but_align_right').classList).toContain('button_tt_active');
  });

  it('should mark active toggle with active tint and accent color', () => {

    // when
    render({ bold: true });

    // then
    const style = getComputedStyle(query('.but_bold'));
    expect(style.backgroundColor).toBe('rgba(56, 142, 60, 0.12)');
    expect(style.color).toBe('rgb(56, 142, 60)');
  });

  it('should prevent default of mousedown on toggles', () => {

    // given
    render();

    // when
    const events = toggleSelectors.map(s => {
      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      query(s).dispatchEvent(event);
      return event;
    });

    // then
    events.forEach(e => expect(e.defaultPrevented).toBe(true));
  });

  it('should show current text color in hidden color input and color bar', () => {

    // when
    render({ color: '#ff0000' });

    // then
    const input = query<HTMLInputElement>('input[type=color].input_text_color');
    expect(input.value).toBe('#ff0000');
    expect(getComputedStyle(input).opacity).toBe('0');
    const colorBar = query('.label_text_color .span_color_bar');
    expect(getComputedStyle(colorBar).backgroundColor).toBe('rgb(255, 0, 0)');
    expect(colorBar.getBoundingClientRect().width).toBe(14);
    expect(colorBar.getBoundingClientRect().height).toBe(3);
  });

  it('should set color when text color is changed', () => {

    // given
    render();

    // when
    changeColor(query('.input_text_color'), '#00ff00');

    // then
    expect(editor.setColor).toHaveBeenCalledWith('#00ff00');
  });

  it('should unset color when reset text color button is clicked', () => {

    // given
    render();

    // when
    query('.but_reset_text_color').click();

    // then
    expect(editor.unsetColor).toHaveBeenCalled();
  });

  it('should show default background color and transparent bordered color bar when background color is undefined', () => {

    // when
    render();

    // then
    expect(query<HTMLInputElement>('input[type=color].input_background_color').value).toBe(DEFAULT_BACKGROUND_COLOR);
    const style = getComputedStyle(query('.label_background_color .span_color_bar'));
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style.borderTopWidth).toBe('1px');
  });

  it('should show background color in color input and borderless color bar when defined', () => {

    // when
    render({}, '#123456');

    // then
    expect(query<HTMLInputElement>('.input_background_color').value).toBe('#123456');
    const style = getComputedStyle(query('.label_background_color .span_color_bar'));
    expect(style.backgroundColor).toBe('rgb(18, 52, 86)');
    expect(style.borderTopWidth).toBe('0px');
  });

  it('should emit background color when background color is changed', () => {

    // given
    render();
    const emitted = vi.fn();
    component.backgroundColorChange.subscribe(emitted);

    // when
    changeColor(query('.input_background_color'), '#abcdef');

    // then
    expect(emitted).toHaveBeenCalledWith('#abcdef');
  });

  it('should emit undefined when reset background color button is clicked', () => {

    // given
    render({}, '#123456');
    const emitted = vi.fn();
    component.backgroundColorChange.subscribe(emitted);

    // when
    query('.but_reset_background_color').click();

    // then
    expect(emitted).toHaveBeenCalledWith(undefined);
  });

  it.each([false, true])('border button should be active when bordered is %s', bordered => {

    // given
    component.bordered = bordered;

    // when
    render();

    // then
    expect(query('.but_border').classList.contains('button_tt_active')).toBe(bordered);
  });

  it.each([
    { bordered: false, emitted: true },
    { bordered: true, emitted: false }
  ])('should emit $emitted when border button is clicked while bordered is $bordered', ({ bordered, emitted }) => {

    // given
    component.bordered = bordered;
    render();
    const emittedSpy = vi.fn();
    component.borderedChange.subscribe(emittedSpy);

    // when
    query('.but_border').click();

    // then
    expect(emittedSpy).toHaveBeenCalledExactlyOnceWith(emitted);
  });

  it('should prevent default of mousedown on border button', () => {

    // given
    render();
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

    // when
    query('.but_border').dispatchEvent(event);

    // then
    expect(event.defaultPrevented).toBe(true);
  });

  it('should separate border button from color controls by a separator', () => {

    // when
    render();

    // then
    expect(query('.but_border').previousElementSibling.classList).toContain('span_separator');
  });

  it('should emit remove when delete button is clicked', () => {

    // given
    render();
    const emitted = vi.fn();
    component.remove.subscribe(emitted);

    // when
    query('.but_delete').click();

    // then
    expect(emitted).toHaveBeenCalled();
  });

  it('should separate delete button from color controls by a separator', () => {

    // when
    render();

    // then
    const separator = query('.but_delete').previousElementSibling as HTMLElement;
    expect(separator.classList).toContain('span_separator');
    expect(separator.getBoundingClientRect().width).toBe(1);
    expect(separator.getBoundingClientRect().height).toBe(20);
  });
});
