import { ValueFormatter } from 'app/shared/format';
import { Column, DataType } from 'app/shared/model';
import * as XLSX from 'xlsx';

export class ExcelDataConverter {

    private valueFormatter = new ValueFormatter();

    /**
     * converts the number values of all [[DataType.TIME]] columns 
     * - to Date if the date format does not contain a milliseconds letter pattern
     * - to formatted string if the format contains a milliseconds letter pattern (because Excel does not know about such pattern)
     */
    convertTime(data: Object[], columns: Column[]): void {
        const timeColumns = columns.filter(c => c.dataType === DataType.TIME);
        for (const column of timeColumns) {
            for (const item of data) {
                const value = item[column.name];
                if (value) {
                    if (column.format.includes('S')) {
                        item[column.name] = this.valueFormatter.formatValue(column, value);
                    } else {
                        item[column.name] = new Date(value);
                    }
                }
            }
        }
    }

    toWorksheet(data: Object[], columns: Column[]): XLSX.WorkSheet {
        const ws = XLSX.utils.json_to_sheet(data);
        const colNames = Object.keys(data[0]);
        ws['!cols'] = this.colInfos(colNames, columns);
        colNames.forEach((colName, i) => {
            const column = this.column(colName, columns);
            if (column && column.dataType === DataType.TIME) {
                this.formatTimeCells(ws, i, column.format);
            }
        });
        return ws;
    }

    private colInfos(colNames: string[], columns: Column[]): XLSX.ColInfo[] {
        return colNames.map(k => ({ wch: this.column(k, columns).width }));
    }

    private column(colName: string, columns: Column[]): Column {
        const column = columns.find(c => c.name === colName);
        return column || this.defaultColumn(colName);
    }

    private defaultColumn(name: string): Column {
        return {
            name: name,
            dataType: DataType.TEXT,
            width: 10
        };
    }

    private formatTimeCells(ws: XLSX.WorkSheet, colIndex: number, format: string): void {
        const range = XLSX.utils.decode_range(ws['!ref']);
        const iFirstDataRow = range.s.r + 1;
        for (let iRow = iFirstDataRow; iRow <= range.e.r; iRow++) {
            const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: iRow });
            const cell = ws[cellRef];
            if (cell?.t === 'n') {
                cell.z = format;
            }
        }
    }
}