import { Column, DataType } from 'app/shared/model';
import { convertTimeValues } from './convert-time-values';

describe('convertTimeValues', () => {

    it('#convertTimeValues should convert present values of time columns only', () => {

        // given
        const columns: Column[] = [
            { name: 'Time', dataType: DataType.TIME, width: 10 },
            { name: 'Amount', dataType: DataType.NUMBER, width: 10 }
        ];
        const data = [
            { Time: 1, Amount: 1 },
            { Time: 0, Amount: 2 },
            { Time: null, Amount: 3 },
            { Amount: 4 }
        ];

        // when
        convertTimeValues(data, columns, (column, value) => column.name + ':' + value);

        // then
        expect(data).toEqual([
            { Time: 'Time:1', Amount: 1 },
            { Time: 'Time:0', Amount: 2 },
            { Time: null, Amount: 3 },
            { Amount: 4 }
        ]);
    });
});
