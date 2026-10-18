import { combineSliderLabels } from './combine-slider-labels';

describe('combine-slider-labels', () => {

    it('#combineSliderLabels should return single label when labels are equal', () => {

        // when
        const label = combineSliderLabels('123', '123');

        // then
        expect(label).toBe('123');
    });

    it('#combineSliderLabels should return combined label when labels are different', () => {

        // when
        const label = combineSliderLabels('2020', '2023');

        // then
        expect(label).toBe('2020 - 2023');
    });
});
