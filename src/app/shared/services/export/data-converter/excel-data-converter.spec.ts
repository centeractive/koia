import { Column, DataType } from 'app/shared/model';
import { ExcelDataConverter } from './excel-data-converter';

describe('ExcelDataConverter', () => {

    const converter = new ExcelDataConverter();

    it('#convertTime (format including milliseconds)', () => {
        // given        
        const data: Object[] = [
            { Position: 1, Name: 'A', Amount: 100.5, Time: time('2019-01-18 12:00:00.000') },
            { Position: 2, Name: 'B', Amount: 15, Time: time('2019-01-18 13:00:00.000') },
            { Position: 3, Name: 'C', Amount: 78.6, Time: time('2019-01-18 14:00:00.000') },
            { Position: 4, Name: 'D', Amount: 45.2, Time: time('2019-01-18 15:00:00.000') }
        ];
        const columns: Column[] = [
            { name: 'Position', dataType: DataType.NUMBER, width: 10 },
            { name: 'Name', dataType: DataType.NUMBER, width: 40 },
            { name: 'Amount', dataType: DataType.NUMBER, width: 8 },
            { name: 'Time', dataType: DataType.TIME, width: 16, format: 'd.M.yyyy HH:mm:ss SSS' },
        ];

        // when
        converter.convertTime(data, columns);

        // then
        const expected = [
            { Position: 1, Name: 'A', Amount: 100.5, Time: '18.1.2019 12:00:00 000' },
            { Position: 2, Name: 'B', Amount: 15, Time: '18.1.2019 13:00:00 000' },
            { Position: 3, Name: 'C', Amount: 78.6, Time: '18.1.2019 14:00:00 000' },
            { Position: 4, Name: 'D', Amount: 45.2, Time: '18.1.2019 15:00:00 000' }
        ];
        expect(data as any).toEqual(expected);
    });

    it('#convertTime (format not including milliseconds)', () => {
        // given        
        const data: Object[] = [
            { Position: 1, Name: 'A', Amount: 100.5, Time: time('2019-01-18 12:00:00.000') },
            { Position: 2, Name: 'B', Amount: 15, Time: time('2019-01-18 13:00:00.000') },
            { Position: 3, Name: 'C', Amount: 78.6, Time: time('2019-01-18 14:00:00.000') },
            { Position: 4, Name: 'D', Amount: 45.2, Time: time('2019-01-18 15:00:00.000') }
        ];
        const columns: Column[] = [
            { name: 'Position', dataType: DataType.NUMBER, width: 10 },
            { name: 'Name', dataType: DataType.NUMBER, width: 40 },
            { name: 'Amount', dataType: DataType.NUMBER, width: 8 },
            { name: 'Time', dataType: DataType.TIME, width: 16, format: 'd MMM yyyy HH:mm:ss' },
        ];

        // when
        converter.convertTime(data, columns);

        // then
        const expected = [
            { Position: 1, Name: 'A', Amount: 100.5, Time: new Date('2019-01-18 12:00:00.000') },
            { Position: 2, Name: 'B', Amount: 15, Time: new Date('2019-01-18 13:00:00.000') },
            { Position: 3, Name: 'C', Amount: 78.6, Time: new Date('2019-01-18 14:00:00.000') },
            { Position: 4, Name: 'D', Amount: 45.2, Time: new Date('2019-01-18 15:00:00.000') }
        ];
        expect(data as any).toEqual(expected);
    });

    it('#toWorksheet', () => {
        // given        
        const data: Object[] = [
            { Position: 1, Name: 'A', Amount: 100.5, Time: new Date('2019-01-18 12:00:00.000') },
            { Position: 2, Name: 'B', Amount: 15, Time: new Date('2019-01-18 13:00:00.000') }
        ];
        const columns: Column[] = [
            { name: 'Position', dataType: DataType.NUMBER, width: 10 },
            { name: 'Name', dataType: DataType.NUMBER, width: 40 },
            { name: 'Amount', dataType: DataType.NUMBER, width: 8 },
            { name: 'Time', dataType: DataType.TIME, width: 16, format: 'd MMM yyyy HH:mm:ss' },
        ];

        // when
        const worksheet = converter.toWorksheet(data, columns);

        // then
        expect(worksheet).toEqual({
            '!ref': 'A1:D3',
            '!cols': [{ wch: 10 }, { wch: 40 }, { wch: 8 }, { wch: 16 }],
            A1: { t: 's', v: 'Position' },
            B1: { t: 's', v: 'Name' },
            C1: { t: 's', v: 'Amount' },
            D1: { t: 's', v: 'Time' },
            A2: { t: 'n', v: 1 },
            B2: { t: 's', v: 'A' },
            C2: { t: 'n', v: 100.5 },
            D2: { t: 'n', v: 43483.5, 'z': 'd MMM yyyy HH:mm:ss' },
            A3: { t: 'n', v: 2 },
            B3: { t: 's', v: 'B' },
            C3: { t: 'n', v: 15 },
            D3: { t: 'n', v: 43483.541666666664, 'z': 'd MMM yyyy HH:mm:ss' }
        });
    });

    function time(date: string): number {
        return new Date(date).getTime();
    }
});