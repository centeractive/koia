import { FormattedIntegerDirective } from './formatted-integer.directive';
import { ElementRef } from '@angular/core';

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

        // when
        directive.onInputChange(onInput('x'));

        // then
        expect(inputElement.value).toBe('');
        expect(inputElement.selectionStart).toBe(0);
    });

    it('#onInputChange should reject decimal separator', () => {

        // when
        directive.onInputChange(onInput(ds));

        // then
        expect(inputElement.value).toBe('');
        expect(inputElement.selectionStart).toBe(0);
    });

    it('#onInputChange should accept number', () => {

        // when
        directive.onInputChange(onInput('1'));

        // then
        expect(inputElement.value).toBe('1');
        expect(inputElement.selectionStart).toBe(1);
    });

    it('#onInputChange should format number', () => {

        // when
        directive.onInputChange(onInput('1234', 1));

        // then
        expect(inputElement.value).toBe('1' + ts + '234');
        expect(inputElement.selectionStart).toBe(2);
    });

    it('#onPaste should reject non-number representation', () => {

        // given
        const event = clipboardEvent('x123', 0);
        const stopPropagationSpy = spyOn(event, 'stopPropagation');

        // when
        directive.onPaste(event);

        // then
        expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('#onPaste should accept integer representation', () => {

        // given
        const event = clipboardEvent('1234', 0);
        const stopPropagationSpy = spyOn(event, 'stopPropagation');

        // when
        directive.onPaste(event);

        // then
        expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    it('#onPaste should accept formatted integer representation', () => {

        // given
        const event = clipboardEvent('1' + ts + '234', 0);
        const stopPropagationSpy = spyOn(event, 'stopPropagation');

        // when
        directive.onPaste(event);

        // then
        expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    function onInput(text: string, caretPos?: number): KeyboardEvent {
        inputElement.value = text;
        if (caretPos === undefined) {
            caretPos = text.length;
        }
        inputElement.setSelectionRange(caretPos, caretPos)
        return new KeyboardEvent('input', {});
    }

    function clipboardEvent(text: string, selectionStart: number, selectionEnd?: number): ClipboardEvent {
        inputElement.setSelectionRange(selectionStart, selectionEnd || selectionStart);
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        return new ClipboardEvent('paste', { clipboardData });
    }
});
