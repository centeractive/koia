import { ChartContext } from 'app/shared/model/chart';

export function relevantData(context: ChartContext): object {
    const data: any = context.chart.data;
    return {
        labels: data.labels,
        datasets: data.datasets.map(ds => ({
            label: ds.label,
            data: ds.data
        }))
    }
}

export function scales(context: ChartContext): object {
    return context.chart.options.scales;
}