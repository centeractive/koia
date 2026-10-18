import { Column, DataType } from 'app/shared/model';

/**
 * replaces the present values of all [[DataType.TIME]] columns by the result of the given conversion
 */
export function convertTimeValues(data: object[], columns: Column[], convert: (column: Column, value: number) => unknown): void {
    const timeColumns = columns.filter(c => c.dataType === DataType.TIME);
    for (const column of timeColumns) {
        for (const item of data) {
            const value = item[column.name];
            if (value !== null && value !== undefined) {
                item[column.name] = convert(column, value);
            }
        }
    }
}
