import { Scale } from 'app/shared/services/view-persistence';
import { Column } from '../column.type';
import { DataType } from '../data-type.enum';
import { ScaleCache } from './scale-cache';

describe('ScaleCache', () => {

    const amountCol: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 1 };
    const percentCol: Column = { name: 'Percent', dataType: DataType.NUMBER, width: 1 };

    let cache: ScaleCache;

    beforeEach(() => {
        cache = new ScaleCache();
    });

    it('#update - matching data columns', () => {
        // given
        const scale1 = scale(10);
        const scale2 = scale(20);

        // when
        cache.update([scale1, scale2], [amountCol, percentCol]);

        // then
        expect(cache.size).toBe(2);
        expect(cache.get(amountCol.name)).toEqual(scale1);
        expect(cache.get(percentCol.name)).toEqual(scale2);
    });

    it('#update - non-matching data columns', () => {
        // given
        const scale1 = scale(10);
        const scale2 = scale(20);

        // when
        cache.update([scale1, scale2], [amountCol]);

        // then
        expect(cache.size).toBe(1);
        expect(cache.get(amountCol.name)).toEqual(scale1);
    });

    it('#set', () => {
        // given
        const scale: Scale = {
            ticks: { stepSize: 10, rotation: 45 }
        };

        // when
        cache.set('X', scale);

        // then
        expect(cache.size).toBe(1);
        expect(cache.get('X')).toEqual(scale);
    });

    it('#get non cached', () => {
        // when
        const scale = cache.get('X');

        // then
        expect(cache.size).toBe(1);
        expect(scale).toEqual({
            columnName: 'X',
            ticks: {}
        });
    });

    it('#get cached', () => {
        // given
        const cachedScale: Scale = {
            ticks: { stepSize: 10, rotation: 45 }
        };
        cache.set('X', cachedScale);

        // when
        const scale = cache.get('X');

        // then
        expect(cache.size).toBe(1);
        expect(scale).toEqual(cachedScale);
    });

    function scale(stepSize?: number): Scale {
        return {
            ticks: {
                stepSize
            }
        };
    }

});