import { linkEnds } from './link-ends';

describe('link-ends', () => {

    it('#linkEnds should start and end link at bubble edges', () => {
        // when
        const ends = linkEnds({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 20);

        // then
        expect(ends).toEqual({ x1: 10, y1: 0, x2: 80, y2: 0 });
    });

    it('#linkEnds should start and end diagonal link at bubble edges', () => {
        // when
        const ends = linkEnds({ x: 0, y: 0 }, { x: 30, y: 40 }, 10, 5);

        // then
        expect(ends.x1).toBeCloseTo(6);
        expect(ends.y1).toBeCloseTo(8);
        expect(ends.x2).toBeCloseTo(27);
        expect(ends.y2).toBeCloseTo(36);
    });

    it('#linkEnds should collapse link when bubbles overlap', () => {
        // when
        const ends = linkEnds({ x: 0, y: 0 }, { x: 20, y: 0 }, 10, 15);

        // then
        expect(ends).toEqual({ x1: 0, y1: 0, x2: 0, y2: 0 });
    });

    it('#linkEnds should collapse link when bubbles share center', () => {
        // when
        const ends = linkEnds({ x: 5, y: 5 }, { x: 5, y: 5 }, 4, 4);

        // then
        expect(ends).toEqual({ x1: 5, y1: 5, x2: 5, y2: 5 });
    });
});
