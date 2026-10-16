import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from 'app/shared/services/language';

/**
 * formats a date like Angular's date pipe but in the locale of the current user interface language
 */
@Pipe({
   name: 'koiaDate',
   pure: false
})
export class LocalizedDatePipe implements PipeTransform {

   constructor(private languageService: LanguageService) { }

   transform(value: Date | string | number | null | undefined, format = 'mediumDate'): string | null {
      if (value === null || value === undefined || value === '') {
         return null;
      }
      return formatDate(value, format, this.languageService.localeId());
   }
}
