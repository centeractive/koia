import { Directive } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';

@Directive({
  selector: '[koiaForm]',
  host: { class: 'koia-form' },
  providers: [{
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } as MatFormFieldDefaultOptions
  }],
  standalone: false
})
export class KoiaFormDirective { }
