import { Size, tooltipPosition } from './tooltip-position';

describe('tooltip-position', () => {

    const container: Size = { width: 500, height: 400 };
    const tooltip: Size = { width: 200, height: 50 };

    it('#tooltipPosition should place tooltip right below node when it fits', () => {
        // when
        const position = tooltipPosition(100, 100, tooltip, container);

        // then
        expect(position).toEqual({ left: 115, top: 90 });
    });

    it('#tooltipPosition should keep tooltip right of node when touching right border', () => {
        // when
        const position = tooltipPosition(285, 100, tooltip, container);

        // then
        expect(position.left).toBe(300);
    });

    it('#tooltipPosition should flip tooltip to left of node when exceeding right border', () => {
        // when
        const position = tooltipPosition(400, 100, tooltip, container);

        // then
        expect(position.left).toBe(185);
    });

    it('#tooltipPosition should clamp flipped tooltip to left border', () => {
        // when
        const position = tooltipPosition(150, 100, tooltip, { width: 300, height: 400 });

        // then
        expect(position.left).toBe(0);
    });

    it('#tooltipPosition should clamp tooltip to top border when node is near top', () => {
        // when
        const position = tooltipPosition(100, 5, tooltip, container);

        // then
        expect(position.top).toBe(0);
    });

    it('#tooltipPosition should clamp tooltip to bottom border when node is near bottom', () => {
        // when
        const position = tooltipPosition(100, 390, tooltip, container);

        // then
        expect(position.top).toBe(350);
    });

    it('#tooltipPosition should place tooltip at origin when larger than container', () => {
        // when
        const position = tooltipPosition(100, 100, { width: 600, height: 500 }, container);

        // then
        expect(position).toEqual({ left: 0, top: 0 });
    });
});
