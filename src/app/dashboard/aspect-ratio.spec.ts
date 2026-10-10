import { cellRatioToNumber } from './aspect-ratio';

describe('aspect-ratio', () => {

    it('#cellRatioToNumber should divide width by height', () => {

        // when
        const ratios = ['3:2', '1:1'].map(r => cellRatioToNumber(r));

        // then
        expect(ratios).toEqual([1.5, 1]);
    });
});
