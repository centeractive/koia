import { ChartData, InteractionMode, Point } from "chart.js";

const MAX_DATASETS_FOR_INDEX = 10;

export function tooltipMode(data: ChartData): InteractionMode {
    const dsCount = data.datasets.length;
    if (dsCount > 1 && dsCount <= MAX_DATASETS_FOR_INDEX && indexable(data)) {
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
