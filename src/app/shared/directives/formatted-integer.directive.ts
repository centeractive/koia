import { Directive, ElementRef, HostListener } from '@angular/core';
import { NumberFormatter } from '../format';
import { NumberUtils } from '../utils';
import { preventInvalidPaste } from '../utils/clipboard-events';

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