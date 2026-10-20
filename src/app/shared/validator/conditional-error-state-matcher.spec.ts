import { FormControl, Validators } from '@angular/forms';
import { ConditionalErrorStateMatcher } from './conditional-error-state-matcher';

describe('ConditionalErrorStateMatcher', () => {

    it('#isErrorState should return true when error is forced', () => {

        // given
        const matcher = new ConditionalErrorStateMatcher(() => true);
        const control = new FormControl('x', Validators.required);

        // when
        const errorState = matcher.isErrorState(control, null);

        // then
        expect(errorState).toBe(true);
    });

    it('#isErrorState should return false when error is not forced and control is valid', () => {

        // given
        const matcher = new ConditionalErrorStateMatcher(() => false);
        const control = new FormControl('x', Validators.required);
        control.markAsTouched();

        // when
        const errorState = matcher.isErrorState(control, null);

        // then
        expect(errorState).toBe(false);
    });

    it('#isErrorState should return true when error is not forced and control is invalid and touched', () => {

        // given
        const matcher = new ConditionalErrorStateMatcher(() => false);
        const control = new FormControl('', Validators.required);
        control.markAsTouched();

        // when
        const errorState = matcher.isErrorState(control, null);

        // then
        expect(errorState).toBe(true);
    });
});
