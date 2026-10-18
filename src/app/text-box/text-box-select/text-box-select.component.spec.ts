import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { By } from '@angular/platform-browser';
import { SelectOption, TextBoxSelectComponent } from './text-box-select.component';

describe('TextBoxSelectComponent', () => {

  const options: SelectOption[] = [
    { label: 'Arial', value: 'Arial, sans-serif', fontFamily: 'Arial, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif', fontFamily: 'Georgia, serif' },
    { label: 'Plain', value: 'plain' }
  ];

  let fixture: ComponentFixture<TextBoxSelectComponent>;
  let component: TextBoxSelectComponent;
  let overlayContainerElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextBoxSelectComponent],
      imports: [OverlayModule, MatIconModule, MatIconTestingModule]
    });
    overlayContainerElement = TestBed.inject(OverlayContainer).getContainerElement();
    fixture = TestBed.createComponent(TextBoxSelectComponent);
    component = fixture.componentInstance;
    component.options = options;
    component.value = options[1].value;
    component.label = 'Georgia';
    fixture.detectChanges();
  });

  function trigger(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('.but_select')).nativeElement;
  }

  function openList(): void {
    trigger().click();
    fixture.detectChanges();
  }

  function list(): HTMLElement {
    return overlayContainerElement.querySelector('.div_select_list');
  }

  function optionButtons(): HTMLButtonElement[] {
    return Array.from(overlayContainerElement.querySelectorAll<HTMLButtonElement>('.but_select_option'));
  }

  function mousedownDefaultPrevented(element: HTMLElement): boolean {
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  }

  it('should render plain trigger button with label and chevron', () => {

    // then
    const button = trigger();
    expect(button.type).toBe('button');
    expect(button.classList).toContain('button_tt');
    expect(button.querySelector('.span_select_label').textContent.trim()).toBe('Georgia');
    expect(button.querySelector('mat-icon').getAttribute('svgIcon')).toBe('lucide_chevron_down');
  });

  it('should not show list initially', () => {

    // then
    expect(list()).toBeNull();
  });

  it('should list options in their own font below trigger when trigger is clicked', () => {

    // when
    openList();

    // then
    const buttons = optionButtons();
    expect(buttons.map(b => b.textContent.trim())).toEqual(['Arial', 'Georgia', 'Plain']);
    expect(buttons.map(b => b.style.fontFamily)).toEqual(['Arial, sans-serif', 'Georgia, serif', '']);
    expect(list().getBoundingClientRect().top).toBeGreaterThanOrEqual(trigger().getBoundingClientRect().bottom);
  });

  it('should mark option of current value active', () => {

    // when
    openList();

    // then
    expect(optionButtons().map(b => b.classList.contains('button_tt_active'))).toEqual([false, true, false]);
  });

  it('should limit list height and scroll overflow', () => {

    // when
    openList();

    // then
    const style = getComputedStyle(list());
    expect(style.maxHeight).toBe('240px');
    expect(style.overflowY).toBe('auto');
  });

  it('should emit value and close list when option is clicked', () => {

    // given
    const emitted = vi.fn();
    component.selected.subscribe(emitted);
    openList();

    // when
    optionButtons()[2].click();
    fixture.detectChanges();

    // then
    expect(emitted).toHaveBeenCalledWith('plain');
    expect(component.open).toBe(false);
    expect(list()).toBeNull();
  });

  it('should close list when trigger is clicked again', () => {

    // given
    openList();

    // when
    openList();

    // then
    expect(list()).toBeNull();
  });

  it('should close list without emitting when backdrop is clicked', () => {

    // given
    const emitted = vi.fn();
    component.selected.subscribe(emitted);
    openList();

    // when
    overlayContainerElement.querySelector<HTMLElement>('.cdk-overlay-backdrop').click();
    fixture.detectChanges();

    // then
    expect(component.open).toBe(false);
    expect(emitted).not.toHaveBeenCalled();
  });

  it('should close list when Escape is pressed', () => {

    // given
    openList();

    // when
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    fixture.detectChanges();

    // then
    expect(component.open).toBe(false);
    expect(list()).toBeNull();
  });

  it('should prevent default of mousedown on trigger and options', () => {

    // given
    openList();

    // when
    const prevented = [trigger(), ...optionButtons()].map(e => mousedownDefaultPrevented(e));

    // then
    expect(prevented).toEqual([true, true, true, true]);
  });
});
