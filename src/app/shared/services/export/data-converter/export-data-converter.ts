import { ValueFormatter } from 'app/shared/format';
import { Column, DataType } from 'app/shared/model';

export class ExportDataConverter {

    private valueFormatter = new ValueFormatter();

    /**
     * converts the stringified values of all [[DataType.OBJECT]] columns back to JSON objects
     */
    restoreJSONObjects(data: Object[], columns: Column[]): void {
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
    timeToFormattedString(data: Object[], columns: Column[]): void {
        const timeColumns = columns.filter(c => c.dataType === DataType.TIME);
        for (const column of timeColumns) {
            for (const item of data) {
                const value = item[column.name];
                if (value) {
                    item[column.name] = this.valueFormatter.formatValue(column, value);
                }
            }
        }
    }
}