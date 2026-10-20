import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class ConditionalErrorStateMatcher extends ErrorStateMatcher {

    constructor(private readonly forceError: () => boolean) {
        super();
    }

    override isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return this.forceError() || super.isErrorState(control, form);
    }
}
