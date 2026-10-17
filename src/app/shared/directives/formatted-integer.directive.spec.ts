import { FormattedIntegerDirective } from './formatted-integer.directive';
import { ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({
    template: '<input formattedInteger>',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
class FormattedIntegerHostComponent {
}

describe('FormattedIntegerDirective', () => {

    const ds = (0.1).toLocaleString().charAt(1);
    const ts = (1_000).toLocaleString().charAt(1);

    let inputElement: HTMLInputElement;
    let directive: FormattedIntegerDirective;

    beforeEach(() => {
        inputElement = document.createElement('INPUT') as HTMLInputElement;
        directive = new FormattedIntegerDirective(new ElementRef(inputElement));
    });

    it('#onInputChange should reject letter', () => {

        // given
        onInput('x');

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('');
        expect(inputElement.selectionStart).toBe(0);
    });

    it('#onInputChange should reject decimal separator', () => {

        // given
        onInput(ds);

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('');
        expect(inputElement.selectionStart).toBe(0);
    });

    it('#onInputChange should accept number', () => {

        // given
        onInput('1');

        // when
        directive.onInputChange();

        // then
        expect(inputElement.value).toBe('1');
        expect(inputElement.selectionStart).toBe(1);
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

    it('#onPaste should reject non-number representation', () => {

        // given
        const event = clipboardEvent('x123', 0);
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation').mockReturnValue(undefined);

        // when
        directive.onPaste(event);

        // then
        expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('#onPaste should accept integer representation', () => {

        // given
        const event = clipboardEvent('1234', 0);
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation').mockReturnValue(undefined);

        // when
        directive.onPaste(event);

        // then
        expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    it('#onPaste should accept formatted integer representation', () => {

        // given
        const event = clipboardEvent('1' + ts + '234', 0);
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation').mockReturnValue(undefined);

        // when
        directive.onPaste(event);

        // then
        expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    it('input event on host element should format number', () => {

        // given
        TestBed.configureTestingModule({ declarations: [FormattedIntegerHostComponent, FormattedIntegerDirective] });
        const fixture = TestBed.createComponent(FormattedIntegerHostComponent);
        fixture.detectChanges();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.value = '1234';

        // when
        input.dispatchEvent(new Event('input'));

        // then
        expect(input.value).toBe('1' + ts + '234');
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
});
