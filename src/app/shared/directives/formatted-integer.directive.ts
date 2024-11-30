import { Directive, ElementRef, HostListener } from '@angular/core';
import { NumberFormatter } from '../format';
import { NumberUtils, StringUtils } from '../utils';

@Directive({
    selector: 'input[formattedInteger]',
    standalone: false
})
export class FormattedIntegerDirective {

    private numberFormatter = new NumberFormatter();
    private inputElement: HTMLInputElement;

    constructor(elementRef: ElementRef) {
        this.inputElement = elementRef.nativeElement;
    }

    @HostListener('input', ['$event'])
    onInputChange(event: KeyboardEvent): void {
        const digitsInFront = this.digitsInFrontOfCared();
        const v = this.inputElement.value.replace(/[^0-9]*/g, '');
        this.inputElement.value = v ? this.numberFormatter.format(parseInt(v)) : v;
        const caretPos = this.newCaretPos(digitsInFront);
        this.inputElement.setSelectionRange(caretPos, caretPos);
    }

    @HostListener('paste', ['$event'])
    onPaste(event: ClipboardEvent): void {
        const v = NumberUtils.removeThousandsSeparators(this.newValue(event), undefined);
        if (!NumberUtils.isInteger(v, undefined)) {
            event.stopPropagation();
        }
    }

    private newValue(event: ClipboardEvent): string {
        const replacement = event.clipboardData.getData('text/plain');
        return StringUtils.replace(this.inputElement.value, this.inputElement.selectionStart, this.inputElement.selectionEnd, replacement).text;
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