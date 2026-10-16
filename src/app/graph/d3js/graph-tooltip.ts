import { GraphContext, GraphNode } from 'app/shared/model/graph';
import { LanguageService } from 'app/shared/services/language';
import { GraphUtils } from '../options/graph-utils';

/**
 * @returns the tooltip of the specified node in the current language, it is created when the mouse enters the node
 */
export function graphTooltip(graphNode: GraphNode, color: string, context: GraphContext): string {
    let result = '<div class="div_tooltip">'
        + '<span class="tooltip_colored_box" style="background:' + color + ';margin-right:10px;"></span>';
    if (graphNode.parent) {
        result += graphNode.name + ': <b>' + GraphUtils.formattedValueOf(graphNode, context) + '</b>';
    } else {
        result += LanguageService.instant('graph.tooltip.rootNode');
    }
    const count = graphNode.count.toLocaleString(LanguageService.localeId());
    result += ' ' + LanguageService.instant(graphNode.count === 1 ? 'graph.tooltip.oneEntry' : 'graph.tooltip.entries', { count });
    return result + '<br><br>' + LanguageService.instant('graph.tooltip.doubleClick') + '</div>';
}
