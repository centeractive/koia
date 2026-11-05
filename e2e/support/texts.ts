import { resolve } from 'path';
import { Aggregation } from 'app/shared/model/aggregation.enum';
import { ComputeOperator } from 'app/shared/model/compute-operator.enum';
import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { Operator } from 'app/shared/model/operator.enum';
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

   dataTypes(dataTypes: DataType[]): string[] {
      return dataTypes.map(dataType => this.get(EnumLabelKeys.dataType(dataType)));
   }

   summaryAggregation(aggregation: Aggregation): string {
      return this.get('summary.aggregation.' + aggregation);
   }

   operator(operator: Operator): string {
      return this.get(EnumLabelKeys.operator(operator));
   }

   computeOperator(operator: ComputeOperator): string {
      return this.get(EnumLabelKeys.computeOperator(operator));
   }

   computeFormula(operator: ComputeOperator, left: string, right: string): string {
      return this.get(EnumLabelKeys.computeOperatorFormula(operator), { left, right });
   }

   computedColumnEdit(name: string): string {
      return this.get('computedColumn.edit', { name });
   }
}
