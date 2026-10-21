import { Chart, ChartTypeRegistry, LegendElement } from 'chart.js';

/**
 * @param canvasRect client rect of the chart's canvas, the chart lays out in its CSS pixels
 * @returns whether the click on the canvas hits what Chart.js handles on click: a data element or the shown legend
 */
export function hitsChartItem(chart: Chart, event: MouseEvent, canvasRect: DOMRect): boolean {
    if (event.target !== chart.canvas) {
        return false;
    }
    const hover = chart.options.hover;
    return chart.getElementsAtEventForMode(event, hover.mode, hover, true).length > 0
        || hitsLegend(chart.legend, event.clientX - canvasRect.left, event.clientY - canvasRect.top);
}

function hitsLegend(legend: LegendElement<keyof ChartTypeRegistry>, x: number, y: number): boolean {
    return !!legend?.options.display && x >= legend.left && x <= legend.right && y >= legend.top && y <= legend.bottom;
}
