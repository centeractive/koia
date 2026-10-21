import { Chart } from 'chart.js';
import { hitsChartItem } from './chart-item-hit';

describe('hitsChartItem', () => {

    const HOVER = { mode: 'nearest', intersect: true };
    const CANVAS_RECT = new DOMRect(100, 50, 400, 300);
    const LEGEND = { options: { display: true }, left: 10, right: 110, top: 5, bottom: 25 };

    let canvas: HTMLCanvasElement;
    let elementsAtEvent: unknown[];
    let getElementsAtEventForMode: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        elementsAtEvent = [];
        getElementsAtEventForMode = vi.fn(() => elementsAtEvent);
    });

    afterEach(() => canvas.remove());

    function chartWith(legend: object): Chart {
        return { canvas, options: { hover: HOVER }, legend, getElementsAtEventForMode } as unknown as Chart;
    }

    function clickAt(x: number, y: number, target: EventTarget = canvas): MouseEvent {
        const event = new MouseEvent('click', { bubbles: true, clientX: CANVAS_RECT.left + x, clientY: CANVAS_RECT.top + y });
        target.dispatchEvent(event);
        return event;
    }

    it('should hit data element at event with hover mode and options', () => {

        // given
        elementsAtEvent = [{ index: 0 }];
        const event = clickAt(200, 200);

        // when
        const hit = hitsChartItem(chartWith(LEGEND), event, CANVAS_RECT);

        // then
        expect(hit).toBe(true);
        expect(getElementsAtEventForMode).toHaveBeenCalledWith(event, 'nearest', HOVER, true);
    });

    it('should hit shown legend', () => {

        // when
        const hit = hitsChartItem(chartWith(LEGEND), clickAt(50, 15), CANVAS_RECT);

        // then
        expect(hit).toBe(true);
    });

    it('should not hit hidden legend', () => {

        // when
        const hit = hitsChartItem(chartWith({ ...LEGEND, options: { display: false } }), clickAt(50, 15), CANVAS_RECT);

        // then
        expect(hit).toBe(false);
    });

    it.each([
        { x: 5, y: 15 },
        { x: 115, y: 15 },
        { x: 50, y: 2 },
        { x: 50, y: 30 }
    ])('should not hit beside legend and data elements at $x, $y', ({ x, y }) => {

        // when
        const hit = hitsChartItem(chartWith(LEGEND), clickAt(x, y), CANVAS_RECT);

        // then
        expect(hit).toBe(false);
    });

    it('should not hit chart without legend', () => {

        // when
        const hit = hitsChartItem(chartWith(undefined), clickAt(50, 15), CANVAS_RECT);

        // then
        expect(hit).toBe(false);
    });

    it('should not hit click outside of canvas', () => {

        // given
        elementsAtEvent = [{ index: 0 }];
        const event = clickAt(50, 15, document.body);

        // when
        const hit = hitsChartItem(chartWith(LEGEND), event, CANVAS_RECT);

        // then
        expect(hit).toBe(false);
        expect(getElementsAtEventForMode).not.toHaveBeenCalled();
    });
});
