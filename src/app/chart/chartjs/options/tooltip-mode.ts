import { ChartData, InteractionMode, Point } from "chart.js";

export function tooltipMode(data: ChartData): InteractionMode {
    if (data.datasets.length > 1 && indexable(data)) {
        return 'index';
    }
    return 'nearest';
}

function indexable(data: ChartData): boolean {
    if (data.labels) {
        return true;
    }
    const xBaseData = listX(data.datasets[0].data as Point[]);
    for (let i = 1; i < data.datasets.length; i++) {
        const xData = listX(data.datasets[i].data as Point[]);
        if (xBaseData != xData) {
            return false;
        }
    }
    return true;
}

function listX(data: Point[]): string {
    return data.map(p => p.x)
        .join(',');
}
