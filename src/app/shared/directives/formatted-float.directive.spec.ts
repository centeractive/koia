import { FormattedFloatDirective } from './formatted-float.directive';
import { ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({
    template: '<input formattedFloat>',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
class FormattedFloatHostComponent {
}

describe('FormattedFlatDirective', () => {

    const ds = (0.1).toLocaleString().charAt(1);
    const ts = (1_000).toLocaleString().charAt(1);

    let inputElement: HTMLInputElement;
    let directive: FormattedFloatDirective;

    beforeEach(() => {
        inputElement = document.createElement('INPUT') as HTMLInputElement;
        directive = new FormattedFloatDirective(new ElementRef(inputElement));
    });

    it('#onKeyPressed should reject letter', () => {

        // given
        const event = new KeyboardEvent('keydown', { key: 'x' });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onKeyPressed should reject Ctrl+digit', () => {

        // given    
        const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '1' });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onKeyPressed should reject Meta+digit', () => {

        // given    
        const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '1' });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onKeyPressed should reject Shift+digit', () => {

        // given    
        const event = new KeyboardEvent('keydown', { shiftKey: true, key: '1' });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onKeyPressed should accept Ctrl+[acvx]', () => {

        ['a', 'c', 'v', 'x'].forEach(l => {

            // given    
            const event = new KeyboardEvent('keydown', { ctrlKey: true, key: l });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

            // when
            directive.onKeyPressed(event);

            // then
            expect(preventDefaultSpy).not.toHaveBeenCalled();
        });
    });

    it('#onKeyPressed should accept Meta+[acvx]', () => {

        ['a', 'c', 'v', 'x'].forEach(l => {

            // given    
            const event = new KeyboardEvent('keydown', { metaKey: true, key: l });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

            // when
            directive.onKeyPressed(event);

            // then
            expect(preventDefaultSpy).not.toHaveBeenCalled();
        });
    });

    it('#onKeyPressed should accept minus at start', () => {

        // given    
        const event = new KeyboardEvent('keydown', { key: '-' });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onKeyPressed should accept initial decimal separator', () => {

        // given    
        const event = new KeyboardEvent('keydown', { key: ds });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onKeyPressed should accepted digit', () => {

        // given
        const event = new KeyboardEvent('keydown', { key: '1' });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onInputChange should accepted number', () => {

        // given
        onInput('1');

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('1');
        expect(inputElement.selectionStart).toBe(1);
    });

    it('#onInputChange should accept decimal separator at end', () => {

        // given
        onInput('1' + ds);

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('1' + ds);
        expect(inputElement.selectionStart).toBe(2);
    });

    it('#onInputChange should accept zero following decimal separator', () => {

        // given
        onInput('1' + ds + '0');

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('1' + ds + '0');
        expect(inputElement.selectionStart).toBe(3);
    });

    it('#onInputChange should format number', () => {

        // given
        onInput('1234', 1);

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('1' + ts + '234');
        expect(inputElement.selectionStart).toBe(2);
    });

    it('#onInputChange should keep minus sign', () => {

        // given
        onInput('-');

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('-');
        expect(inputElement.selectionStart).toBe(1);
    });

    it('#onInputChange should not count non-digit in front of caret', () => {

        // given
        onInput('-12', 3);

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('-12');
        expect(inputElement.selectionStart).toBe(3);
    });

    it('#onPaste should reject non-number representation', () => {

        // given
        const event = clipboardEvent('x123', 0);
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onPaste should accept integer representation', () => {

        // given
        const event = clipboardEvent('1234', 0);
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onPaste should accept float representation', () => {

        // given
        const event = clipboardEvent('1234' + ds + '55', 0);
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onPaste should accept formatted float representation', () => {

        // given
        const event = clipboardEvent('1' + ts + '234' + ds + '55', 0);
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onBlur should format float representation', () => {

        // given
        inputElement.value = '1' + ds + '0';

        // when
        directive.onBlur();

        // then
        expect(inputElement.value).toBe('1');
    });

    it('#onBlur should ignore non-number representation', () => {

        // given
        inputElement.value = '-';

        // when
        directive.onBlur();

        // then
        expect(inputElement.value).toBe('-');
    });

    it('input event on host element should format number', () => {

        // given
        const input = createHostInput();
        input.value = '1234';

        // when
        input.dispatchEvent(new Event('input'));

        // then
        expect(input.value).toBe('1' + ts + '234');
    });

    it('blur event on host element should format float representation', () => {

        // given
        const input = createHostInput();
        input.value = '1' + ds + '0';

        // when
        input.dispatchEvent(new Event('blur'));

        // then
        expect(input.value).toBe('1');
    });

    function onInput(text: string, caretPos?: number): void {
        inputElement.value = text;
        if (caretPos === undefined) {
            caretPos = text.length;
        }
        inputElement.setSelectionRange(caretPos, caretPos)
    }

    function clipboardEvent(text: string, selectionStart: number, selectionEnd?: number): ClipboardEvent {
        inputElement.setSelectionRange(selectionStart, selectionEnd || selectionStart);
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        return new ClipboardEvent('paste', { clipboardData });
    }

    function createHostInput(): HTMLInputElement {
        TestBed.configureTestingModule({ declarations: [FormattedFloatHostComponent, FormattedFloatDirective] });
        const fixture = TestBed.createComponent(FormattedFloatHostComponent);
        fixture.detectChanges();
        return fixture.nativeElement.querySelector('input');
    }
});