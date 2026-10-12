import { GraphContext, GraphNode } from 'app/shared/model/graph';
import { GraphData, RawDataRevealService } from 'app/shared/services';
import { CommonUtils } from 'app/shared/utils';
import { NodeDoubleClickHandler } from '../options/node-double-click-handler';
import { D3ForceGraphGenerator } from './d3-force-graph-generator';
import { linkEnds } from './link-ends';

describe('D3ForceGraphGenerator', () => {

    let div: HTMLDivElement;
    let graphData: GraphData;
    let context: GraphContext;
    let generator: D3ForceGraphGenerator;

    beforeEach(() => {
        div = document.createElement('div');
        div.style.width = '300px';
        div.style.height = '200px';
        document.body.appendChild(div);
        graphData = { nodes: [{ parent: null, group: 0, name: '', value: '', info: null, count: 1 }], links: [] };
        context = new GraphContext([]);
        generator = new D3ForceGraphGenerator(new RawDataRevealService(null, null));
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40);
    });

    afterEach(() => {
        window.dispatchEvent(mouseEvent('mouseup', 0, 0));
        generator.stop();
        div.remove();
    });

    it('#generate should place tooltip next to hovered node', () => {
        // given
        generator.generate(graphData, div, context);
        graphData.nodes[0].x = 100;
        graphData.nodes[0].y = 100;

        // when
        div.querySelector('circle').dispatchEvent(new MouseEvent('mouseenter'));

        // then
        const tooltipDiv = div.querySelector<HTMLDivElement>('div.tooltip');
        expect(tooltipDiv.style.left).toBe('127px');
        expect(tooltipDiv.style.top).toBe('90px');
    });

    it('#generate should keep tooltip inside container when node is close to its border', () => {
        // given
        generator.generate(graphData, div, context);
        graphData.nodes[0].x = 290;
        graphData.nodes[0].y = 5;

        // when
        div.querySelector('circle').dispatchEvent(new MouseEvent('mouseenter'));

        // then
        const tooltipDiv = div.querySelector<HTMLDivElement>('div.tooltip');
        expect(tooltipDiv.style.left).toBe('163px');
        expect(tooltipDiv.style.top).toBe('0px');
    });

    it('#generate should hide tooltip when mouse leaves node', async () => {
        // given
        generator.generate(graphData, div, context);
        const circle = div.querySelector('circle');
        const tooltipDiv = div.querySelector<HTMLDivElement>('div.tooltip');
        circle.dispatchEvent(new MouseEvent('mouseenter'));
        await vi.waitFor(() => expect(tooltipDiv.style.opacity).toBe('1'), { timeout: 2000 });

        // when
        circle.dispatchEvent(new MouseEvent('mouseleave'));

        // then
        await vi.waitFor(() => expect(tooltipDiv.style.opacity).toBe('0'), { timeout: 2000 });
    });

    it('#generate should keep dragged node under mouse pointer', async () => {
        // given
        graphData = graphOf(1);
        const root = graphData.nodes[0];
        const child = graphData.nodes[1];
        generator.generate(graphData, div, context);
        const rootElement = div.querySelector('g.nodes g');
        await vi.waitFor(() => expect(rootElement.getAttribute('transform')).not.toBeNull());
        const x0 = root.x;
        const y0 = root.y;
        const rect = div.querySelector('svg').getBoundingClientRect();
        const clientX = Math.round(rect.left + x0);
        const clientY = Math.round(rect.top + y0);
        rootElement.querySelector('circle').dispatchEvent(mouseEvent('mousedown', clientX, clientY));
        window.dispatchEvent(mouseEvent('mousemove', clientX + 50, clientY + 30));
        await vi.waitFor(() => expect(root.x).toBeCloseTo(x0 + 50));

        // when
        window.dispatchEvent(mouseEvent('mousemove', clientX + 100, clientY + 60));

        // then
        expect(root.fx).toBeCloseTo(x0 + 100);
        expect(root.fy).toBeCloseTo(y0 + 60);
        const line = div.querySelector('line');
        await vi.waitFor(() => {
            expect(root.x).toBeCloseTo(x0 + 100);
            expect(Number(line.getAttribute('x1'))).toBeCloseTo(linkEnds(root, child, 12, 30).x1);
        });
    });

    it('#generate should release dragged node when drag ends', () => {
        // given
        const root = graphData.nodes[0];
        generator.generate(graphData, div, context);
        div.querySelector('circle').dispatchEvent(mouseEvent('mousedown', 10, 10));
        window.dispatchEvent(mouseEvent('mousemove', 20, 20));

        // when
        window.dispatchEvent(mouseEvent('mouseup', 20, 20));

        // then
        expect(root.fx).toBeNull();
        expect(root.fy).toBeNull();
    });

    it('#stop should freeze graph layout', async () => {
        // given
        generator.generate(graphData, div, context);

        // when
        generator.stop();

        // then
        const x = graphData.nodes[0].x;
        await CommonUtils.sleep(100);
        expect(graphData.nodes[0].x).toBe(x);
    });

    it('#generate should stop simulation of previous graph', async () => {
        // given
        const previousGraphData = graphData;
        generator.generate(previousGraphData, div, context);

        // when
        generator.generate(graphOf(1), div, context);

        // then
        const x = previousGraphData.nodes[0].x;
        await CommonUtils.sleep(100);
        expect(previousGraphData.nodes[0].x).toBe(x);
    });

    it('#generate should reveal raw data of double-clicked node', () => {
        // given
        const onNodeDoubleClicked = vi.spyOn(NodeDoubleClickHandler.prototype, 'onNodeDoubleClicked').mockReturnValue(undefined);
        generator.generate(graphData, div, context);

        // when
        div.querySelector('circle').dispatchEvent(new MouseEvent('dblclick'));

        // then
        expect(onNodeDoubleClicked).toHaveBeenCalledWith(graphData.nodes[0], context);
    });

    it('#generate should fill root node black and others with group color', () => {
        // given
        vi.spyOn(context.colorProvider, 'bgColors').mockReturnValue(['red']);

        // when
        generator.generate(graphOf(1), div, context);

        // then
        const circles = div.querySelectorAll('circle');
        expect(circles[0].style.fill).toBe('black');
        expect(circles[1].style.fill).toBe('red');
    });

    it('#generate should size bubbles by number of related rows', () => {

        // when
        generator.generate(graphOf(1, 4), div, context);

        // then
        const circles = div.querySelectorAll('circle');
        expect(circles[0].getAttribute('r')).toBe('12');
        expect(circles[1].getAttribute('r')).toBe('17');
        expect(circles[2].getAttribute('r')).toBe('30');
    });

    it('#generate should place label right of bubble', () => {

        // when
        generator.generate(graphOf(1, 4), div, context);

        // then
        const labels = div.querySelectorAll('text');
        expect(labels[0].getAttribute('dx')).toBe('15');
        expect(labels[1].getAttribute('dx')).toBe('20');
        expect(labels[2].getAttribute('dx')).toBe('33');
    });

    it('#generate should end links at bubble edges', async () => {
        // given
        graphData = graphOf(1);
        const [root, child] = graphData.nodes;
        root.fx = 50;
        root.fy = 50;
        child.fx = 150;
        child.fy = 50;

        // when
        generator.generate(graphData, div, context);

        // then
        const line = div.querySelector('line');
        await vi.waitFor(() => {
            expect(Number(line.getAttribute('x1'))).toBeCloseTo(62);
            expect(Number(line.getAttribute('y1'))).toBeCloseTo(50);
            expect(Number(line.getAttribute('x2'))).toBeCloseTo(120);
            expect(Number(line.getAttribute('y2'))).toBeCloseTo(50);
        });
    });

    it('#generate should keep bubbles from overlapping', async () => {
        // given
        const nodes: GraphNode[] = [
            { parent: null, group: 0, name: '', value: '', info: null, count: 4 },
            { parent: null, group: 0, name: '', value: '', info: null, count: 4 }
        ];
        context.charge = 0;

        // when
        generator.generate({ nodes, links: [] }, div, context);

        // then
        await vi.waitFor(() => expect(Math.hypot(nodes[0].x - nodes[1].x, nodes[0].y - nodes[1].y)).toBeGreaterThanOrEqual(24));
    });

    function graphOf(...childCounts: number[]): GraphData {
        const root: GraphNode = { parent: null, group: 0, name: '', value: '', info: null, count: childCounts.reduce((sum, c) => sum + c, 0) };
        const children: GraphNode[] = childCounts.map((count, i) =>
            ({ parent: root, group: i + 1, name: 'c1', value: 'v' + i, info: String(count), count }));
        return { nodes: [root, ...children], links: children.map(child => ({ source: root, target: child })) };
    }

    function mouseEvent(type: string, clientX: number, clientY: number): MouseEvent {
        return new MouseEvent(type, { view: window, bubbles: true, cancelable: true, clientX, clientY });
    }
});
