import { GraphContext, GraphNode } from 'app/shared/model/graph';
import { graphTooltip } from './graph-tooltip';

describe('graph-tooltip', () => {

    const context = new GraphContext([]);
    const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: null, count: 25 };

    it('should generate tooltip for root node', () => {

        // when
        const tooltip = graphTooltip(rootNode, 'blue', context);

        // then
        expect(tooltip).toEqual('<div class="div_tooltip">'
            + '<span class="tooltip_colored_box" style="background:blue;margin-right:10px;"></span>'
            + 'Root Node (25 Entries)<br><br>Double-click to show data...</div>');
    });

    it('should generate tooltip for leaf node representing single item', () => {

        // given
        const leafNode: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '1', count: 1 };

        // when
        const tooltip = graphTooltip(leafNode, 'red', context);

        // then
        expect(tooltip).toEqual('<div class="div_tooltip">'
            + '<span class="tooltip_colored_box" style="background:red;margin-right:10px;"></span>'
            + 'Level: <b>ERROR</b> (1 Entry)<br><br>Double-click to show data...</div>');
    });

    it('should generate tooltip for leaf node representing multiple items', () => {

        // given
        const leafNode: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '3', count: 3 };

        // when
        const tooltip = graphTooltip(leafNode, 'red', context);

        // then
        expect(tooltip).toEqual('<div class="div_tooltip">'
            + '<span class="tooltip_colored_box" style="background:red;margin-right:10px;"></span>'
            + 'Level: <b>ERROR</b> (3 Entries)<br><br>Double-click to show data...</div>');
    });

    it('should generate tooltip with total entries of inner node', () => {

        // given
        const innerNode: GraphNode = { parent: rootNode, group: 1, name: 'Path', value: '/var/log', info: null, count: 7 };

        // when
        const tooltip = graphTooltip(innerNode, 'green', context);

        // then
        expect(tooltip).toEqual('<div class="div_tooltip">'
            + '<span class="tooltip_colored_box" style="background:green;margin-right:10px;"></span>'
            + 'Path: <b>/var/log</b> (7 Entries)<br><br>Double-click to show data...</div>');
    });
});
