import { Directive, ElementRef, HostListener } from '@angular/core';
import { NumberFormatter } from '../format';
import { NumberUtils, StringUtils } from '../utils';
import { isCopyEvent, isCutEvent, isDigitKey, isPasteEvent, isSelectAllEvent } from '../utils/keyboard-events';

@Directive({
    selector: 'input[formattedFloat]'
})
export class FormattedFloatDirective {

    private passThroughKeys = ['Delete', 'Backspace', 'Tab', 'Escape', 'Enter', 'NumLock', 'ArrowLeft', 'ArrowRight', 'End', 'Home'];
    private numberFormatter = new NumberFormatter();
    private inputElement: HTMLInputElement;
    private ds: string;

    constructor(elementRef: ElementRef) {
        this.inputElement = elementRef.nativeElement;
        this.ds = NumberUtils.decimalSeparator(undefined);
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

    @HostListener('input', ['$event'])
    onInputChange(event: KeyboardEvent): void {
        if (this.decimalSeparatorInFrontOfCared()) {
            return;
        }
        const v = NumberUtils.removeThousandsSeparators(this.inputElement.value, undefined);
        const digitsOrDecimalSeparatorInFront = this.digitsOrDecimalSeparatorInFrontOfCared();
        if (!this.enteredDecimalSeparatorAtEnd(v) && NumberUtils.isNumber(v, undefined)) {
            this.inputElement.value = this.numberFormatter.format(parseFloat(v));
        }
        const caretPos = this.newCaretPos(digitsOrDecimalSeparatorInFront);
        this.inputElement.setSelectionRange(caretPos, caretPos);
    }

    @HostListener('paste', ['$event'])
    onPaste(event: ClipboardEvent): void {
        const v = NumberUtils.removeThousandsSeparators(this.newValue(event), undefined);
        if (!NumberUtils.isNumber(v, undefined)) {
            event.preventDefault();
        }
    }

    private newValue(event: ClipboardEvent): string {
        const replacement = event.clipboardData.getData('text/plain');
        return StringUtils.replace(this.inputElement.value, this.inputElement.selectionStart, this.inputElement.selectionEnd, replacement).text;
    }

    @HostListener('blur', ['$event'])
    onBlur(event: FocusEvent): void {
        const v = this.inputElement.value;
        if (NumberUtils.isNumber(v, undefined)) {
            const n = NumberUtils.parseFloat(v, undefined);
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
            if (c === this.ds || NumberUtils.isInteger(c, undefined)) {
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
            if (c === this.ds || NumberUtils.isNumber(c, undefined)) {
                if (digitsOrDecimalSeparator === digitsInFront) {
                    return i;
                }
                digitsOrDecimalSeparator++;
            }
        }
        return value.length;
    }

}