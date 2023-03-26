import { Column, Operator, DataType } from 'app/shared/model';

export class ValueFilterUtils {

  static defaultOperatorOf(dataType: DataType): Operator {
    if (dataType === DataType.TIME) {
      return Operator.NOT_EMPTY;
    } else if (dataType === DataType.OBJECT || dataType === DataType.TEXT) {
      return Operator.CONTAINS;
    } else {
      return Operator.EQUAL;
    }
  }
}
