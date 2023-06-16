import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NumberUtils } from '../utils';

export function formattedNumberValidator(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        let v = control.value;
        if (v) {
            if (typeof v === 'string') {
                v = NumberUtils.parseNumber(NumberUtils.removeThousandsSeparators(v, undefined), undefined);
            }
            if (v < min || v > max) {
                return { outsideRange: true };
            }
        }
        return null;
    };
}