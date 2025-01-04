import { Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType, Margin } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { ChartData } from 'chart.js';
import { ChartJsOptionsProvider } from './chartjs-options-provider';

const COLUMNS: Column[] = [
  { name: 'Time', dataType: DataType.TIME, width: 1 },
  { name: 'Location', dataType: DataType.TEXT, width: 1 },
  { name: 'Name', dataType: DataType.TEXT, width: 1 },
  { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
  { name: 'Percent', dataType: DataType.NUMBER, width: 1 },
];

let provider = new ChartJsOptionsProvider(new RawDataRevealService(null, null));

fdescribe('ChartJsOptionsProvider - PIE', () => {
  it('#provide', () => {
    // when
    const options = provider.provide(context());

    console.error(JSON.stringify(options, null, 2));

    // then
    expect(options).toEqual({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: true,
          callbacks: jasmine.anything()
        },
        datalabels: {
          display: true,
          formatter: jasmine.anything()
        }
      },
      layout: {
        padding: margin()
      },
      interaction: {
        mode: 'nearest',
        intersect: true,
      },
      onHover: jasmine.anything(),
      onClick: jasmine.anything()
    });
  });

  function context(): ChartContext {
    const context = new ChartContext(COLUMNS, ChartType.PIE.type, margin());
    context.data = data();
    return context;
  }

  function data(): ChartData {
    return {
      labels: ['A', 'B', 'C'],
      datasets: [
        {
          label: 'Amount',
          data: [90, 55, 47],
        },
        {
          label: 'Discount',
          data: [8, 5, 0],
        },
      ],
    };
  }
});

function margin(): Margin {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}
