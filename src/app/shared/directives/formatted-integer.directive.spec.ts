import { FormattedIntegerDirective } from './formatted-integer.directive';
import { ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from 'app/shared/services/language';

@Component({
    template: '<input formattedInteger>',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
class FormattedIntegerHostComponent {
}

describe('FormattedIntegerDirective', () => {

    const ds = (0.1).toLocaleString('en-US').charAt(1);
    const ts = (1_000).toLocaleString('en-US').charAt(1);

    let inputElement: HTMLInputElement;
    let directive: FormattedIntegerDirective;

    beforeEach(() => {
        TestBed.configureTestingModule({ declarations: [FormattedIntegerHostComponent, FormattedIntegerDirective] });
        inputElement = document.createElement('INPUT') as HTMLInputElement;
        directive = new FormattedIntegerDirective(new ElementRef(inputElement), TestBed.inject(LanguageService));
    });

    afterEach(() => document.documentElement.lang = 'en');

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

    it('#onPaste should accept formatted integer representation', () => {

        // given
        const event = clipboardEvent('1' + ts + '234', 0);
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockReturnValue(undefined);

        // when
        directive.onPaste(event);

        // then
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('input event on host element should format number', () => {

        // given
        const fixture = TestBed.createComponent(FormattedIntegerHostComponent);
        fixture.detectChanges();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.value = '1234';

        // when
        input.dispatchEvent(new Event('input'));

        // then
        expect(input.value).toBe('1' + ts + '234');
    });

    it('#number format change should format entered number in new format and notify form control', () => {

        // given
        vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
        const inputListener = vi.fn();
        inputElement.addEventListener('input', inputListener);
        inputElement.value = '10000';

        // when
        TestBed.inject(LanguageService).useNumberFormat('de-CH');

        // then
        expect(inputElement.value).toBe("10'000");
        expect(inputListener).toHaveBeenCalledTimes(1);
    });

    it('#number format change should leave empty input unchanged', () => {

        // given
        vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
        const inputListener = vi.fn();
        inputElement.addEventListener('input', inputListener);
        inputElement.value = '';

        // when
        TestBed.inject(LanguageService).useNumberFormat('de-CH');

        // then
        expect(inputElement.value).toBe('');
        expect(inputListener).not.toHaveBeenCalled();
    });

    it('#language change should leave entered number and form control untouched when number format stays the same', async () => {

        // given
        vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
        const languageService = TestBed.inject(LanguageService);
        languageService.useNumberFormat('en-US');
        const inputListener = vi.fn();
        inputElement.addEventListener('input', inputListener);
        inputElement.value = '10,000';

        // when
        await languageService.use('de');

        // then
        expect(inputElement.value).toBe('10,000');
        expect(inputListener).not.toHaveBeenCalled();
    });

    it('#ngOnDestroy should stop following number format changes', () => {

        // given
        vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
        inputElement.value = '10000';

        // when
        directive.ngOnDestroy();

        // then
        TestBed.inject(LanguageService).useNumberFormat('de-CH');
        expect(inputElement.value).toBe('10000');
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
