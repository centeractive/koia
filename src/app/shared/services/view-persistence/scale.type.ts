import { Ticks } from './ticks.type';

export interface Scale {
    columnName?: string;
    title?: string;
    ticks: Ticks;
}