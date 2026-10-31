import { expect } from '@playwright/test';
import { CategoricalColorScheme } from 'app/shared/color/categorical-color-scheme.enum';
import { Aggregation } from 'app/shared/model/aggregation.enum';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { ChartTitles } from './chart-titles';
import { DashboardSideBar } from './components/dashboard-side-bar';
import { DashboardTile } from './components/dashboard-tile';
import { Texts } from './texts';

const DATE = 'Date';
const REVENUE = 'Revenue';
const CHANNEL = 'Channel';
const BASE_AXIS_TITLE = 'Month';
const VALUE_AXIS_TITLE = 'Average revenue';

export interface TourStep {
   readonly caption: string;
   run(): Promise<void>;
}

/**
 * @returns the steps turning any time chart of data with the columns Date, Revenue and Channel into unstacked linear bars of the
 * average revenue per month split by channel
 */
export function averageRevenueTourOf(sideBar: DashboardSideBar, en: Texts): TourStep[] {
   const legendAndScales = en.get('chart.legendAndScales');
   return [
      {
         caption: 'Choose another chart type',
         run: async () => {
            const current = await sideBar.selectedChartType();
            await sideBar.switchChartType(current === ChartType.LINE ? ChartType.AREA : ChartType.LINE);
         }
      },
      {
         caption: 'Start by counting the rows per month',
         run: () => sideBar.chooseAggregation(en.get('chart.countRows'))
      },
      {
         caption: 'Select a column to show, e.g. Revenue',
         run: () => sideBar.selectColumn(REVENUE)
      },
      {
         caption: 'Aggregate its values per month instead',
         run: () => sideBar.chooseAggregation(en.get('summary.sideBar.aggregateValues'))
      },
      {
         caption: 'Choose the aggregation, e.g. the average',
         run: () => sideBar.selectValueAggregation(en.get(EnumLabelKeys.aggregation(Aggregation.AVG)))
      },
      {
         caption: 'Split the values, e.g. by channel',
         run: async () => {
            await sideBar.removeSplitColumns();
            await sideBar.splitBy(CHANNEL);
            await sideBar.setCheckbox(en.get('chart.stacked'), false);
         }
      },
      {
         caption: 'Pick a color scheme',
         run: async () => {
            const current = await sideBar.selectedColorScheme();
            await sideBar.selectColorScheme(current === CategoricalColorScheme.SET_1 ? CategoricalColorScheme.DARK_2 : CategoricalColorScheme.SET_1);
         }
      },
      {
         caption: 'Show the legend and give the axes a title',
         run: async () => {
            await sideBar.setToggle(legendAndScales, en.get('chart.showLegend'), true);
            await sideBar.setAxisTitle(legendAndScales, en.get('chart.baseScale'), BASE_AXIS_TITLE);
            await sideBar.setAxisTitle(legendAndScales, en.get('chart.valueScale'), VALUE_AXIS_TITLE);
         }
      },
      {
         caption: 'Switch the chart type at any time',
         run: () => sideBar.switchChartType(ChartType.LINEAR_BAR)
      }
   ];
}

export function averageRevenueTitleOf(en: Texts): string {
   const titles = new ChartTitles(en);
   return titles.splitBy(titles.groupedByMonth(titles.aggregationOf(Aggregation.AVG, REVENUE), DATE), CHANNEL);
}

/**
 * expects the chart of the tile to be configured by the average revenue tour, while the side bar of the chart is open
 */
export async function expectAverageRevenueChart(tile: DashboardTile, sideBar: DashboardSideBar, en: Texts): Promise<void> {
   await expect(tile.title).toHaveValue(averageRevenueTitleOf(en));
   expect(await sideBar.selectedChartType()).toBe(ChartType.LINEAR_BAR);
   await expect(sideBar.checkbox(en.get('chart.stacked'))).not.toBeChecked();
   await expect(sideBar.switchButton(en.get('chart.showLegend'))).toBeChecked();
   await expect(sideBar.axisTitleInput(en.get('chart.baseScale'))).toHaveValue(BASE_AXIS_TITLE);
   await expect(sideBar.axisTitleInput(en.get('chart.valueScale'))).toHaveValue(VALUE_AXIS_TITLE);
   await tile.expectChartPainted();
}
