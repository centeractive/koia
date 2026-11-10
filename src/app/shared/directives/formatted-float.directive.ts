import { Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { LanguageService } from 'app/shared/services/language';
import { Subscription } from 'rxjs';
import { NumberFormatter } from '../format';
import { NumberUtils } from '../utils';
import { preventInvalidPaste } from '../utils/clipboard-events';
import { isCopyEvent, isCutEvent, isDigitKey, isPasteEvent, isSelectAllEvent } from '../utils/keyboard-events';

@Directive({
    selector: 'input[formattedFloat]',
    standalone: false
})
export class FormattedFloatDirective implements OnDestroy {

    private passThroughKeys = ['Delete', 'Backspace', 'Tab', 'Escape', 'Enter', 'NumLock', 'ArrowLeft', 'ArrowRight', 'End', 'Home'];
    private numberFormatter = new NumberFormatter();
    private inputElement: HTMLInputElement;
    private ds: string;
    private locale: string;
    private languageSubscription: Subscription;

    constructor(elementRef: ElementRef, private languageService: LanguageService) {
        this.inputElement = elementRef.nativeElement;
        this.locale = languageService.numberLocaleId();
        this.ds = NumberUtils.decimalSeparator(this.locale);
        this.languageSubscription = languageService.changed$.subscribe(() => this.onNumberLocaleChanged());
    }

    ngOnDestroy(): void {
        this.languageSubscription.unsubscribe();
    }

    /**
     * converts the entered number from the previous format to the new one and, when its text changes, lets bound form controls take it over
     */
    private onNumberLocaleChanged(): void {
        const v = NumberUtils.removeThousandsSeparators(this.inputElement.value, this.locale);
        const num = NumberUtils.parseNumber(v, this.locale);
        this.locale = this.languageService.numberLocaleId();
        this.ds = NumberUtils.decimalSeparator(this.locale);
        const text = num === undefined ? this.inputElement.value : this.numberFormatter.format(num);
        if (text !== this.inputElement.value) {
            this.inputElement.value = text;
            this.inputElement.dispatchEvent(new Event('input'));
        }
    }

    @HostListener('keypress', ['$event'])
    onKeyPressed(event: KeyboardEvent): void {
        const key = event.key;
        if (this.passThroughKeys.includes(key) ||
            this.firstMinusAtStart(key) ||
            this.firstDecimalSeparator(key) ||
            isSelectAllEvent(event) ||
            isCopyEvent(event) ||
            isCutEvent(event) ||
            isPasteEvent(event)) {
            return;
        }
        if (event.ctrlKey || event.metaKey || event.shiftKey || !isDigitKey(key)) {
            event.preventDefault();
        }
    }

    @HostListener('input')
    onInputChange(): void {
        if (this.decimalSeparatorInFrontOfCared()) {
            return;
        }
        const v = NumberUtils.removeThousandsSeparators(this.inputElement.value, this.locale);
        const digitsOrDecimalSeparatorInFront = this.digitsOrDecimalSeparatorInFrontOfCared();
        if (!this.enteredDecimalSeparatorAtEnd(v) && NumberUtils.isNumber(v, this.locale)) {
            this.inputElement.value = this.numberFormatter.format(NumberUtils.parseNumber(v, this.locale));
        }
        const caretPos = this.newCaretPos(digitsOrDecimalSeparatorInFront);
        this.inputElement.setSelectionRange(caretPos, caretPos);
    }

    @HostListener('paste', ['$event'])
    onPaste(event: ClipboardEvent): void {
        preventInvalidPaste(event, this.inputElement, v => NumberUtils.isNumber(NumberUtils.removeThousandsSeparators(v, this.locale), this.locale));
    }

    @HostListener('blur')
    onBlur(): void {
        const v = this.inputElement.value;
        if (NumberUtils.isNumber(v, this.locale)) {
            const n = NumberUtils.parseFloat(v, this.locale);
            this.inputElement.value = this.numberFormatter.format(n);
        }
    }

    private firstMinusAtStart(key: string): boolean {
        return key === '-' && !this.inputElement.selectionStart && !this.inputElement.value.includes('-');
    }

    private firstDecimalSeparator(key: string): boolean {
        return key === this.ds && !this.inputElement.value.includes(this.ds);
    }

    private decimalSeparatorInFrontOfCared(): boolean {
        const dsPos = this.inputElement.value.indexOf(this.ds);
        return dsPos != -1 && dsPos < this.inputElement.selectionStart;
    }

    private enteredDecimalSeparatorAtEnd(v: string): boolean {
        return !!v && v[v.length - 1] === this.ds;
    }

    private digitsOrDecimalSeparatorInFrontOfCared(): number {
        const caretPos = this.inputElement.selectionStart;
        const value = this.inputElement.value;
        let digits = 0;
        for (let i = 0; i < caretPos && i < value.length; i++) {
            const c = value.charAt(i);
            if (c === this.ds || NumberUtils.isInteger(c, this.locale)) {
                digits++;
            }
        }
        return digits;
    }

    private newCaretPos(digitsInFront: number): number {
        const value = this.inputElement.value;
        let digitsOrDecimalSeparator = 0;
        for (let i = 0; i < value.length; i++) {
            const c = value.charAt(i);
            if (c === this.ds || NumberUtils.isNumber(c, this.locale)) {
                if (digitsOrDecimalSeparator === digitsInFront) {
                    return i;
                }
                digitsOrDecimalSeparator++;
            }
        }
        return value.length;
    }

}