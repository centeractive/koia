import { PropertyFilter, Operator, DataType } from 'app/shared/model';
import { NumberFormatter } from 'app/shared/format';
import { LanguageService } from 'app/shared/services/language';
import { NumberUtils } from 'app/shared/utils';

export class ValueFilterCustomizer {

      private static readonly TOOLTIP_KEYS: Record<Operator, string> = {
            [Operator.CONTAINS]: 'contains',
            [Operator.LESS_THAN]: 'lessThan',
            [Operator.LESS_THAN_OR_EQUAL]: 'lessThanOrEqual',
            [Operator.EQUAL]: 'equal',
            [Operator.NOT_EQUAL]: 'notEqual',
            [Operator.GREATER_THAN_OR_EQUAL]: 'greaterThanOrEqual',
            [Operator.GREATER_THAN]: 'greaterThan',
            [Operator.EMPTY]: 'empty',
            [Operator.NOT_EMPTY]: 'notEmpty',
            [Operator.ANY_OF]: 'anyOf',
            [Operator.NONE_OF]: 'noneOf'
      };

      private numberFormatter = new NumberFormatter();

      tooltipOf(filter: PropertyFilter): string {
            const key = ValueFilterCustomizer.TOOLTIP_KEYS[filter.operator];
            if (!key) {
                  return undefined;
            }
            const tooltip = LanguageService.instant('filter.value.tooltip.' + key, { name: filter.name });
            const multiValue = filter.operator === Operator.ANY_OF || filter.operator === Operator.NONE_OF;
            return multiValue ? tooltip + this.caseSensitiveText(filter) : tooltip;
      }

      formattedValueOf(filter: PropertyFilter): string {
            if (filter.value == undefined) {
                  return '';
            } else if (filter.dataType === DataType.NUMBER && NumberUtils.isNumber(filter.value, undefined)) {
                  return this.numberFormatter.format(filter.value as number);
            } else {
                  return filter.value.toString();
            }
      }

      private caseSensitiveText(filter: PropertyFilter) {
            return filter.dataType === DataType.TEXT ? ' ' + LanguageService.instant('filter.value.tooltip.caseSensitive') : '';
      }
}
