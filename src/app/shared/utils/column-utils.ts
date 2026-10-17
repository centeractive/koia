import { Column, DataType } from '../model';

export function containsAnyNumber(columns: Column[]): boolean {
    if (columns) {
        return !!columns.map(c => c.dataType).find(t => t === DataType.NUMBER);
    }
    return false;
}