import { GraphContext, GraphNode } from 'app/shared/model/graph';
import { GraphUtils } from '../options/graph-utils';

export function graphTooltip(graphNode: GraphNode, color: string, context: GraphContext): string {
    let result = '<div class="div_tooltip">'
        + '<span class="tooltip_colored_box" style="background:' + color + ';margin-right:10px;"></span>';
    if (graphNode.parent) {
        result += graphNode.name + ': <b>' + GraphUtils.formattedValueOf(graphNode, context) + '</b>';
    } else {
        result += 'Root Node';
    }
    const entries = graphNode.count === 1 ? ' Entry' : ' Entries';
    result += ' (' + graphNode.count.toLocaleString() + entries + ')';
    return result + '<br><br>Double-click to show data...</div>';
}
