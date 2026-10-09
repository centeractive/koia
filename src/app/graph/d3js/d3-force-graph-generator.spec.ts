import { GraphContext } from 'app/shared/model/graph';
import { GraphData, RawDataRevealService } from 'app/shared/services';
import { D3ForceGraphGenerator } from './d3-force-graph-generator';

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
        graphData = { nodes: [{ parent: null, group: 0, name: '', value: '', info: null }], links: [] };
        context = new GraphContext([]);
        generator = new D3ForceGraphGenerator(context, new RawDataRevealService(null, null));
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40);
    });

    afterEach(() => {
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
        expect(tooltipDiv.style.left).toBe('115px');
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
        expect(tooltipDiv.style.left).toBe('175px');
        expect(tooltipDiv.style.top).toBe('0px');
    });
});
