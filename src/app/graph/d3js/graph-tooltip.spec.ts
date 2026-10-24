import { TestBed } from '@angular/core/testing';
import { GraphContext, GraphNode } from 'app/shared/model/graph';
import { PropertyFilter } from 'app/shared/model/property-filter';
import { LanguageService } from 'app/shared/services/language';
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

    it('should escape markup in node name and value', () => {

        // given
        const leafNode: GraphNode = { parent: rootNode, group: 1, name: '<i>Level</i>', value: '<img src=x onerror=alert(1)>', info: '1', count: 1 };

        // when
        const tooltip = graphTooltip(leafNode, 'red', context);

        // then
        expect(tooltip).toEqual('<div class="div_tooltip">'
            + '<span class="tooltip_colored_box" style="background:red;margin-right:10px;"></span>'
            + '&lt;i&gt;Level&lt;/i&gt;: <b>&lt;img src=x onerror=alert(1)&gt;</b> (1 Entry)<br><br>Double-click to show data...</div>');
    });

    it('should escape markup in color', () => {

        // when
        const tooltip = graphTooltip(rootNode, 'red;"><img src=x>', context);

        // then
        expect(tooltip).toEqual('<div class="div_tooltip">'
            + '<span class="tooltip_colored_box" style="background:red;&quot;&gt;&lt;img src=x&gt;;margin-right:10px;"></span>'
            + 'Root Node (25 Entries)<br><br>Double-click to show data...</div>');
    });

    it('should show empty value of node as text', () => {

        // given
        const leafNode: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: PropertyFilter.EMPTY_VALUE, info: '2', count: 2 };

        // when
        const tooltip = graphTooltip(leafNode, 'red', context);

        // then
        expect(tooltip).toContain('Level: <b>&lt;empty&gt;</b> (2 Entries)');
    });

    it('should generate tooltip in current language', async () => {

        // given
        vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
        await TestBed.inject(LanguageService).use('de');
        const leafNode: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '1200', count: 1200 };

        // when
        const tooltip = graphTooltip(leafNode, 'red', context);

        // then
        expect(tooltip).toEqual('<div class="div_tooltip">'
            + '<span class="tooltip_colored_box" style="background:red;margin-right:10px;"></span>'
            + 'Level: <b>ERROR</b> (1.200 Einträge)<br><br>Doppelklick zeigt die Daten...</div>');
        document.documentElement.lang = 'en';
    });
});
