import { DataPoint } from './data-point.type';

export interface DataSet {
    key: string,
    values: DataPoint[]
}