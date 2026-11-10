import { Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { LanguageService } from 'app/shared/services/language';
import { Subscription } from 'rxjs';
import { NumberFormatter } from '../format';
import { NumberUtils } from '../utils';
import { preventInvalidPaste } from '../utils/clipboard-events';

@Directive({
    selector: 'input[formattedInteger]',
    standalone: false
})
export class FormattedIntegerDirective implements OnDestroy {

    private numberFormatter = new NumberFormatter();
    private inputElement: HTMLInputElement;
    private languageSubscription: Subscription;

    constructor(elementRef: ElementRef, languageService: LanguageService) {
        this.inputElement = elementRef.nativeElement;
        this.languageSubscription = languageService.changed$.subscribe(() => this.onNumberLocaleChanged());
    }

    ngOnDestroy(): void {
        this.languageSubscription.unsubscribe();
    }

    /**
     * shows the entered number in the new format and, when its text changes, lets bound form controls take it over
     */
    private onNumberLocaleChanged(): void {
        const text = this.inputElement.value;
        if (text) {
            this.onInputChange();
            if (this.inputElement.value !== text) {
                this.inputElement.dispatchEvent(new Event('input'));
            }
        }
    }

    @HostListener('input')
    onInputChange(): void {
        const digitsInFront = this.digitsInFrontOfCared();
        const v = this.inputElement.value.replace(/[^0-9]*/g, '');
        this.inputElement.value = v ? this.numberFormatter.format(parseInt(v)) : v;
        const caretPos = this.newCaretPos(digitsInFront);
        this.inputElement.setSelectionRange(caretPos, caretPos);
    }

    @HostListener('paste', ['$event'])
    onPaste(event: ClipboardEvent): void {
        preventInvalidPaste(event, this.inputElement, v => NumberUtils.isInteger(NumberUtils.removeThousandsSeparators(v, undefined), undefined));
    }

    private digitsInFrontOfCared(): number {
        const caretPos = this.inputElement.selectionStart;
        const value = this.inputElement.value;
        let digits = 0;
        for (let i = 0; i < caretPos && i < value.length; i++) {
            const c = value.charAt(i);
            if (NumberUtils.isInteger(c, undefined)) {
                digits++;
            }
        }
        return digits;
    }

    private newCaretPos(digitsInFront: number): number {
        const value = this.inputElement.value;
        let digits = 0;
        for (let i = 0; i < value.length; i++) {
            const c = value.charAt(i);
            if (NumberUtils.isInteger(c, undefined)) {
                if (digits === digitsInFront) {
                    return i;
                }
                digits++;
            }
        }
        return value.length;
    }

}