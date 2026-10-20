import { Column, DataType } from '../model';
import { DataTypeUtils } from './data-type-utils';

export function containsAnyNumber(columns: Column[]): boolean {
    if (columns) {
        return !!columns.map(c => c.dataType).find(t => t === DataType.NUMBER);
    }
    return false;
}

export function isComputedColumn(column: Column): boolean {
    return !!column.computation;
}

export function isAnalyzableColumn(column: Column): boolean {
    return !!column.indexed || isComputedColumn(column);
}

export function storedColumnsOf(columns: Column[]): Column[] {
    return columns.filter(c => !isComputedColumn(c));
}

/**
 * @returns the columns that can be filtered in the database (computed columns don't exist there)
 */
export function filterableColumnsOf(columns: Column[]): Column[] {
    return storedColumnsOf(columns);
}

export function isOperandColumn(column: Column): boolean {
    return column.indexed === true && column.dataType === DataType.NUMBER && !isComputedColumn(column);
}

export function iconOfColumn(column: Column): string {
    return isComputedColumn(column) ? 'functions' : DataTypeUtils.iconOf(column.dataType);
}
