import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { LanguageService } from '../services/language/language.service';

export const COLUMN_NAME_MAX_LENGTH = 100;
export const COLUMN_NAME_PATTERN = /^(?!\$).*/; // see https://github.com/apache/couchdb/issues/2028

export function columnNameValidators(): ValidatorFn[] {
   return [Validators.required, Validators.pattern(COLUMN_NAME_PATTERN), Validators.maxLength(COLUMN_NAME_MAX_LENGTH)];
}

/**
 * @returns false for a name CouchDB reserves for itself, which can therefore not be stored as property of an entry
 */
export function isStoredColumnName(name: string): boolean {
   return !name.startsWith('_');
}

export function storedColumnNameValidator(control: AbstractControl): ValidationErrors | null {
   return isStoredColumnName(control.value ?? '') ? null : { underscore: true };
}

/**
 * @param usedNames names that are already in use, compared with the trimmed name
 */
export function availableColumnNameValidator(usedNames: string[]): ValidatorFn {
   return (control: AbstractControl): ValidationErrors | null => {
      const name = (control.value ?? '').trim();
      if (!name) {
         return { required: true };
      }
      return usedNames.includes(name) ? { nameInUse: true } : null;
   };
}

export function columnNameErrorMessage(control: AbstractControl): string {
   if (control.hasError('required')) {
      return LanguageService.instant('scene.column.nameRequired');
   } else if (control.hasError('pattern')) {
      return LanguageService.instant('scene.column.nameDollar');
   } else if (control.hasError('underscore')) {
      return LanguageService.instant('scene.column.nameUnderscore');
   } else if (control.hasError('maxlength')) {
      return LanguageService.instant('scene.column.nameTooLong', { max: COLUMN_NAME_MAX_LENGTH });
   } else if (control.hasError('nameInUse')) {
      return LanguageService.instant('scene.column.nameInUse');
   }
   return '';
}
