import { Column, DataType } from 'app/shared/model';
import { RadialLinearScaleOptions } from 'chart.js';
import { PointLabelFormatter } from './point-label-formatter';

describe('PointLabelFormatter', () => {

    const formatter = new PointLabelFormatter();

    it('#format time column', () => {
        // given
        const column: Column = { name: 'Time', dataType: DataType.TIME, format: 'd MMM yyyy', width: 1 };
        const options = scaleOptions();

        // when
        formatter.format(column, options);
        const result = options.pointLabels.callback(1230764400000 as any, null);

        // then
        expect(result).toBe('1 Jan 2009');
    });

    it('#format non-time column', () => {
        // given    
        const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 1 };
        const options = scaleOptions();

        // when
        formatter.format(column, options);
        const result = options.pointLabels.callback(1230764400000 as any, null);

        // then
        expect(result).toBe(1230764400000);
    });

    function scaleOptions(): RadialLinearScaleOptions {
        return {
            pointLabels: {
                callback: (v: number) => v
            }
        } as any;
    }

});