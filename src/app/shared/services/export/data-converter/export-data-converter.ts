import { ValueFormatter } from 'app/shared/format';
import { Column, DataType } from 'app/shared/model';
import { convertTimeValues } from './convert-time-values';

export class ExportDataConverter {

    private valueFormatter = new ValueFormatter();

    /**
     * converts the stringified values of all [[DataType.OBJECT]] columns back to JSON objects
     */
    restoreJSONObjects(data: object[], columns: Column[]): void {
        const objectTypeColumns = columns.filter(c => c.dataType === DataType.OBJECT);
        for (const column of objectTypeColumns) {
            for (const item of data) {
                const value = item[column.name];
                if (value) {
                    item[column.name] = JSON.parse(value);
                }
            }
        }
    }

    /**
     * converts the number values of all [[DataType.TIME]] columns to formatted strings
     */
    timeToFormattedString(data: object[], columns: Column[]): void {
        convertTimeValues(data, columns, (column, value) => this.valueFormatter.formatValue(column, value));
    }
}