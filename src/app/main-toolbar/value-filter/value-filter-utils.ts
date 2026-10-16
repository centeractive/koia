import { Operator, DataType } from 'app/shared/model';
import { LanguageService } from 'app/shared/services/language';

export class ValueFilterUtils {

  /**
   * operators that are words and therefore translated, the other operators are symbols
   */
  private static readonly WORD_OPERATORS: Partial<Record<Operator, string>> = {
    [Operator.CONTAINS]: 'contains',
    [Operator.EMPTY]: 'empty',
    [Operator.NOT_EMPTY]: 'notEmpty',
    [Operator.ANY_OF]: 'anyOf',
    [Operator.NONE_OF]: 'noneOf'
  };

  static defaultOperatorOf(dataType: DataType): Operator {
    if (dataType === DataType.TIME) {
      return Operator.NOT_EMPTY;
    } else if (dataType === DataType.OBJECT || dataType === DataType.TEXT) {
      return Operator.CONTAINS;
    } else {
      return Operator.EQUAL;
    }
  }

  /**
   * @returns the operator as shown to the user, the operator itself (persisted with filters) is never translated
   */
  static labelOf(operator: Operator): string {
    const key = ValueFilterUtils.WORD_OPERATORS[operator];
    return key ? LanguageService.instant('filter.operator.' + key) : operator;
  }
}
