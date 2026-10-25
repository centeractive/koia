import { resolve } from 'path';
import { Aggregation } from 'app/shared/model/aggregation.enum';
import { Language, localeIdOf } from 'app/shared/services/language/language';
import { jsonOf, SRC_DIR } from './paths';

export class Texts {

   private readonly translations: object;

   constructor(readonly language: Language) {
      this.translations = jsonOf<object>(resolve(SRC_DIR, 'assets/i18n', language + '.json'));
   }

   get(key: string, params: Record<string, string | number> = {}): string {
      const text = key.split('.').reduce<unknown>((node, name) => (node as Record<string, unknown>)?.[name], this.translations);
      if (typeof text !== 'string') {
         throw new Error(`no ${this.language} text for key ${key}`);
      }
      return text.replace(/{{\s*([\w.]+)\s*}}/g, (match, name) => String(params[name] ?? match));
   }

   number(value: number): string {
      return new Intl.NumberFormat(localeIdOf(this.language)).format(value);
   }

   rows(count: number): string {
      return this.get('ui.rows', { count: this.number(count) });
   }

   summaryAggregation(aggregation: Aggregation): string {
      return this.get('summary.aggregation.' + aggregation);
   }
}
