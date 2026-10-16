import { formatNumber } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from 'app/shared/services/language';

/**
 * formats a number like Angular's number pipe but in the locale of the current user interface language
 */
@Pipe({
   name: 'koiaNumber',
   pure: false
})
export class LocalizedNumberPipe implements PipeTransform {

   constructor(private languageService: LanguageService) { }

   transform(value: number | string | null | undefined, digitsInfo?: string): string | null {
      if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
         return null;
      }
      return formatNumber(Number(value), this.languageService.localeId(), digitsInfo);
   }
}
