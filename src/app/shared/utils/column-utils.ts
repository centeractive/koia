import { Column, DataType } from '../model';
import { COLUMN_NAME_MAX_LENGTH } from '../validator/column-name-validation';
import { DataTypeUtils } from './data-type-utils';
import { StringUtils } from './string-utils';

/**
 * text values longer than this are not indexed on import
 */
export const MAX_INDEXED_TEXT_LENGTH = 100;

export function containsAnyNumber(columns: Column[]): boolean {
    if (columns) {
        return !!columns.map(c => c.dataType).find(t => t === DataType.NUMBER);
    }
    return false;
}

export function isComputedColumn(column: Column): boolean {
    return !!column.computation;
}

/**
 * icon marking a pattern column, unlike the icon of the button adding one
 */
export const PATTERN_COLUMN_ICON = 'subdirectory_arrow_right';

export function isPatternColumn(column: Column): boolean {
    return !!column.patternOf;
}

/**
 * @returns true when a pattern column can be derived from the specified column, which must be a stored TEXT column that is
 * no pattern column itself and has no pattern column yet
 */
export function canDerivePattern(column: Column, columns: Column[]): boolean {
    return column.dataType === DataType.TEXT && !isComputedColumn(column) && !isPatternColumn(column) &&
        !columns.some(c => c.patternOf === column.name);
}

/**
 * @param usedNames names that are already in use
 * @param suffix the (translated) word appended to the base name, e.g. "pattern"
 * @returns a free name "<base> <suffix>" (numbered when taken) whose base is cut so that it never exceeds the maximum column name length
 */
export function patternColumnName(base: string, usedNames: Set<string>, suffix: string): string {
    return StringUtils.uniqueNameOf(n => {
        const tail = ' ' + suffix + n;
        return base.substring(0, COLUMN_NAME_MAX_LENGTH - tail.length) + tail;
    }, usedNames);
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
