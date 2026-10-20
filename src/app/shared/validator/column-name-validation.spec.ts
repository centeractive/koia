import { FormControl } from '@angular/forms';
import {
   availableColumnNameValidator, COLUMN_NAME_MAX_LENGTH, columnNameErrorMessage, columnNameValidators
} from './column-name-validation';

describe('column-name-validation', () => {

   function controlOf(value: string): FormControl<string> {
      return new FormControl(value, columnNameValidators());
   }

   it('#columnNameValidators should accept valid name', () => {
      expect(controlOf('Amount').errors).toBeNull();
   });

   it('#columnNameValidators should reject empty name', () => {
      expect(controlOf('').hasError('required')).toBe(true);
   });

   it('#columnNameValidators should reject name starting with $', () => {
      expect(controlOf('$x').hasError('pattern')).toBe(true);
   });

   it('#columnNameValidators should reject too long name', () => {
      expect(controlOf('x'.repeat(COLUMN_NAME_MAX_LENGTH + 1)).hasError('maxlength')).toBe(true);
   });

   it('#columnNameValidators should accept name of max length', () => {
      expect(controlOf('x'.repeat(COLUMN_NAME_MAX_LENGTH)).errors).toBeNull();
   });

   it('#availableColumnNameValidator should return required error when name is blank', () => {

      // given
      const validator = availableColumnNameValidator(['a']);

      // when
      const errors = validator(new FormControl('  '));

      // then
      expect(errors).toEqual({ required: true });
   });

   it('#availableColumnNameValidator should return required error when name is null', () => {
      expect(availableColumnNameValidator(['a'])(new FormControl(null))).toEqual({ required: true });
   });

   it('#availableColumnNameValidator should return name in use error when trimmed name is used', () => {

      // given
      const validator = availableColumnNameValidator(['a', 'b']);

      // when
      const errors = validator(new FormControl(' b '));

      // then
      expect(errors).toEqual({ nameInUse: true });
   });

   it('#availableColumnNameValidator should return null when name is free', () => {
      expect(availableColumnNameValidator(['a'])(new FormControl('c'))).toBeNull();
   });

   it('#columnNameErrorMessage should return required message', () => {
      expect(columnNameErrorMessage(controlOf(''))).toBe('Name is required');
   });

   it('#columnNameErrorMessage should return dollar message', () => {
      expect(columnNameErrorMessage(controlOf('$x'))).toBe('Name must not start with $');
   });

   it('#columnNameErrorMessage should return too long message', () => {
      expect(columnNameErrorMessage(controlOf('x'.repeat(COLUMN_NAME_MAX_LENGTH + 1))))
         .toBe('Name must not exceed ' + COLUMN_NAME_MAX_LENGTH + ' characters');
   });

   it('#columnNameErrorMessage should return name in use message', () => {

      // given
      const control = new FormControl('a', availableColumnNameValidator(['a']));

      // when
      const message = columnNameErrorMessage(control);

      // then
      expect(message).toBe('Name is already in use');
   });

   it('#columnNameErrorMessage should return empty string when name is valid', () => {
      expect(columnNameErrorMessage(controlOf('Amount'))).toBe('');
   });
});
