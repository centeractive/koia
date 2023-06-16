import { FormattedFloatDirective } from './formatted-float.directive';
import { ElementRef } from '@angular/core';

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
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onKeyPressed should reject Ctrl+digit', () => {

        // given    
        const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '1' });
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onKeyPressed should reject Meta+digit', () => {

        // given    
        const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '1' });
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onKeyPressed should reject Shift+digit', () => {

        // given    
        const event = new KeyboardEvent('keydown', { shiftKey: true, key: '1' });
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onKeyPressed should accept Ctrl+[acvx]', () => {

        ['a', 'c', 'v', 'x'].forEach(l => {

            // given    
            const event = new KeyboardEvent('keydown', { ctrlKey: true, key: l });
            const preventDefaultSpy = spyOn(event, 'preventDefault');

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
            const preventDefaultSpy = spyOn(event, 'preventDefault');

            // when
            directive.onKeyPressed(event);

            // then
            expect(preventDefaultSpy).not.toHaveBeenCalled();
        });
    });

    it('#onKeyPressed should accept minus at start', () => {

        // given    
        const event = new KeyboardEvent('keydown', { key: '-' });
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onKeyPressed should accept initial decimal separator', () => {

        // given    
        const event = new KeyboardEvent('keydown', { key: ds });
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onKeyPressed should accepted digit', () => {

        // given
        const event = new KeyboardEvent('keydown', { key: '1' });
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onKeyPressed(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onInputChange should accepted number', () => {

        // when
        directive.onInputChange(onInput('1'));

        // then
        expect(inputElement.value).toBe('1');
        expect(inputElement.selectionStart).toBe(1);
    });

    it('#onInputChange should accept decimal separator at end', () => {

        // when
        directive.onInputChange(onInput('1' + ds));

        // then
        expect(inputElement.value).toBe('1' + ds);
        expect(inputElement.selectionStart).toBe(2);
    });

    it('#onInputChange should accept zero following decimal separator', () => {

        // when
        directive.onInputChange(onInput('1' + ds + '0'));

        // then
        expect(inputElement.value).toBe('1' + ds + '0');
        expect(inputElement.selectionStart).toBe(3);
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
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('#onPaste should accept integer representation', () => {

        // given
        const event = clipboardEvent('1234', 0);
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onPaste should accept float representation', () => {

        // given
        const event = clipboardEvent('1234' + ds + '55', 0);
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onPaste should accept formatted float representation', () => {

        // given
        const event = clipboardEvent('1' + ts + '234' + ds + '55', 0);
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('#onBlur should format float representation', () => {

        // given
        inputElement.value = '1' + ds + '0';

        // when
        directive.onBlur(new FocusEvent('blur'));

        // then
        expect(inputElement.value).toBe('1');
    });

    it('#onBlur should ignore non-number representation', () => {

        // given
        inputElement.value = '-';

        // when
        directive.onBlur(new FocusEvent('blur'));

        // then
        expect(inputElement.value).toBe('-');
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