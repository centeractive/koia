import { ElementContext, SummaryContext } from "app/shared/model";
import { computeAspectRatio } from "./aspect-ratio";

describe('aspect-ratio', () => {

    it('#computeAspectRatio - standard', () => {

        // when
        const aspectRatio = computeAspectRatio('1:1', context(1, 1));

        // then
        expect(aspectRatio).toEqual(1);
    });

    it('#computeAspectRatio - column span', () => {

        // when
        const aspectRatio = computeAspectRatio('1:1', context(3, 1));

        // then
        expect(aspectRatio).toEqual(3);
    });

    it('#computeAspectRatio - row span', () => {

        // when
        const aspectRatio = computeAspectRatio('1:1', context(1, 3));

        // then
        expect(aspectRatio).toEqual(1 / 3);
    });

    it('#computeAspectRatio grid ratio & column span', () => {

        // when
        const aspectRatio = computeAspectRatio('3:1', context(2, 1));

        // then
        expect(aspectRatio).toEqual(6);
    });

    function context(gridColumnSpan: number, gridRowSpan: number): ElementContext {
        const ctx = new SummaryContext([]);
        ctx.gridColumnSpan = gridColumnSpan;
        ctx.gridRowSpan = gridRowSpan;
        return ctx;
    }

});