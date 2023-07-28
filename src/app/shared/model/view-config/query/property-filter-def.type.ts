import { DataType } from '../../data-type.enum';
import { Operator } from '../../operator.enum';

export interface PropertyFilterDef {
    name: string;
    operator: Operator;
    value: string | number | boolean;
    dataType: DataType;
}