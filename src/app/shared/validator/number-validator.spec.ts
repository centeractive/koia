import { FormControl } from '@angular/forms';
import { formattedNumberValidator } from './number-validator';

describe('formattedNumberValidator', () => {

   const validator = formattedNumberValidator(1, 1000);

   it('should accept null', () => {
      expect(validator(new FormControl(null))).toBeNull();
   });

   it('should accept empty string', () => {
      expect(validator(new FormControl(''))).toBeNull();
   });

   it('should accept formatted number within range', () => {
      expect(validator(new FormControl((1_000).toLocaleString()))).toBeNull();
   });

   it('should reject formatted number above max', () => {
      expect(validator(new FormControl((10_000).toLocaleString()))).toEqual({ outsideRange: true });
   });

   it('should reject number below min', () => {
      expect(validator(new FormControl(0.5))).toEqual({ outsideRange: true });
   });

   it('should reject zero when below min', () => {
      expect(validator(new FormControl(0))).toEqual({ outsideRange: true });
   });

   it('should reject non-numeric string', () => {
      expect(validator(new FormControl('abc'))).toEqual({ outsideRange: true });
   });
});
