import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from 'app/shared/services/language';

/**
 * formats a number with up to three fraction digits, like Angular's number pipe, in the locale of numbers of the user interface
 * (see [[LanguageService#numberLocaleId]])
 */
@Pipe({ name: 'koiaNumber', pure: false })
export class LocalizedNumberPipe implements PipeTransform {

   constructor(private languageService: LanguageService) { }

   static format(value: number | string | null | undefined, locale: string): string | null {
      if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
         return null;
      }
      const num = Number(value);
      return (Number(num.toFixed(3)) === 0 ? 0 : num).toLocaleString(locale); // values rounded to zero show 0, like Angular's number pipe
   }

   transform(value: number | string | null | undefined): string | null {
      return LocalizedNumberPipe.format(value, this.languageService.numberLocaleId());
   }
}
