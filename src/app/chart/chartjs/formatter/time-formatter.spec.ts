import { Column, DataType } from 'app/shared/model';
import { TimeFormatter } from './time-formatter';

describe('FormatUtils', () => {

    const formatter = new class extends TimeFormatter { };

    it('#momentFormatOf', () => {
        expect(formatter.momentFormatOf(timeColumn('d MMM yyyy HH:mm:ss SSS'))).toBe('D MMM YYYY HH:mm:ss SSS');
        expect(formatter.momentFormatOf(timeColumn('d MMM yyyy HH:mm:ss'))).toBe('D MMM YYYY HH:mm:ss');
        expect(formatter.momentFormatOf(timeColumn('d MMM yyyy HH:mm'))).toBe('D MMM YYYY HH:mm');
        expect(formatter.momentFormatOf(timeColumn('d MMM yyyy HH'))).toBe('D MMM YYYY HH');
        expect(formatter.momentFormatOf(timeColumn('d MMM yyyy'))).toBe('D MMM YYYY');
        expect(formatter.momentFormatOf(timeColumn('MMM yyyy'))).toBe('MMM YYYY');
        expect(formatter.momentFormatOf(timeColumn('yyyy'))).toBe('YYYY');
    });

    function timeColumn(format: string): Column {
        return {
            name: 'Time',
            dataType: DataType.TIME,
            width: 10,
            format
        };
    }

});