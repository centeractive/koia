import { Column, DataType } from '../model';

export function isAnyNonNumeric(columns: Column[]): boolean {
    if (columns) {
        return !!columns.map(c => c.dataType).find(t => [DataType.BOOLEAN, DataType.TEXT].includes(t));
    }
    return false;
}

export function containsNumberOnly(columns: Column[]): boolean {
    if (columns) {
        return !!columns.map(c => c.dataType).find(t => t === DataType.NUMBER);
    }
    return false;
}