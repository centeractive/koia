import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NumberUtils } from '../utils';

export function formattedNumberValidator(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const v = control.value;
        if (v === null || v === undefined || v === '') {
            return null;
        }
        const n = NumberUtils.parseFormattedNumber(v);
        if (n === undefined || n < min || n > max) {
            return { outsideRange: true };
        }
        return null;
    };
}
