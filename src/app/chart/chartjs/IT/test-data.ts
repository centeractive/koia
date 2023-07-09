import { Column, DataType } from 'app/shared/model';

export const timeColumn = column('time', DataType.TIME);
export const numberColumn = column('number', DataType.NUMBER);
export const textColumn = column('text', DataType.TEXT);
export const columns = [timeColumn, numberColumn, textColumn];

export const entries = [
    { time: time('2023-06-01'), number: 1, text: null },
    { time: time('2023-06-02'), number: 2, text: 'x' },
    { time: time('2023-06-03'), number: 3, text: 'y' },
    { time: time('2023-06-04'), number: 2, text: 'x' }
];

function column(name: string, dataType: DataType): Column {
    return {
        name: name,
        dataType: dataType,
        width: 10
    };
}

function time(date: string): number {
    return Date.parse(date);
}
