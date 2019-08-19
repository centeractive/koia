import { PropertyFilter, Operator, DataType } from 'app/shared/model';

export class PropertyFilterCustomizer {

      tooltipOf(filter: PropertyFilter): string {
            const prefix = 'Filters all items where \'' + filter.propertyName + '\' ';
            switch (filter.operator) {
                  case Operator.CONTAINS:
                        return prefix + 'contains the filter value (non-case-sensitive)';
                  case Operator.LESS_THAN:
                        return prefix + 'is less than the filter value';
                  case Operator.LESS_THAN_OR_EQUAL:
                        return prefix + 'is less than or equal to the filter value';
                  case Operator.EQUAL:
                        return prefix + 'is equal to the filter value (case-sensitive)';
                  case Operator.NOT_EQUAL:
                        return prefix + 'is not equal to the filter value (case-sensitive)';
                  case Operator.GREATER_THAN_OR_EQUAL:
                        return prefix + 'is greater than or equal to the filter value';
                  case Operator.GREATER_THAN:
                        return prefix + 'is greater than the filter value';
                  case Operator.EMPTY:
                        return prefix + 'is empty';
                  case Operator.NOT_EMPTY:
                        return prefix + 'is not empty';
                  case Operator.ANY_OF:
                        const postfix = filter.dataType === DataType.TEXT ? ' (cases-sensitive)' : '';
                        return prefix + 'is equal to one of the filter values, separated by a comma each' + postfix;
                  default:
                        return undefined;
            }
      }
}