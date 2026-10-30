import { expect, Locator } from '@playwright/test';
import { CategoricalColorScheme } from 'app/shared/color/categorical-color-scheme.enum';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { dragCenterOnto } from '../pointer';
import { SideNav } from './side-nav';

const SPLIT_COLUMNS_ID = 'selectedSplitColumns';

/**
 * matches the element by its own text, ignoring the text of the icon preceding it
 */
function textNodeOf(name: string): (list: Locator) => Locator {
   return list => list.locator(`:text-is(${JSON.stringify(name)})`);
}

export class DashboardSideBar extends SideNav {

   chartTypeButton(chartType: ChartType): Locator {
      return this.sidenav.locator('.but_chart_type').nth(ChartType.ALL.indexOf(chartType));
   }

   dataColumnButton(name: string): Locator {
      return this.sidenav.locator('#div_sel_data_columns').getByRole('button', { name, exact: true });
   }

   async selectColumn(name: string): Promise<void> {
      await this.dataColumnButton(name).click();
   }

   async createComputedColumn(): Promise<void> {
      await this.sidenav.locator('.but_create_computed_column').click();
   }

   /**
    * @param editLabel the accessible name of the edit button of the computed column
    */
   async editComputedColumn(editLabel: string): Promise<void> {
      await this.sidenav.getByRole('button', { name: editLabel, exact: true }).click();
   }

   /**
    * expands the panel unless it is expanded already, a click on the header of an expanded panel collapses it
    */
   async toggle(panelTitle: string, label: string): Promise<void> {
      await this.expandPanel(panelTitle);
      await this.switchButton(label).click();
   }

   /**
    * expands the panel unless it is expanded already
    */
   async setToggle(panelTitle: string, label: string, on: boolean): Promise<void> {
      await this.expandPanel(panelTitle);
      await this.switchButton(label).setChecked(on);
   }

   switchButton(label: string): Locator {
      return this.sidenav.getByRole('switch', { name: label, exact: true });
   }

   checkbox(label: string): Locator {
      return this.sidenav.getByRole('checkbox', { name: label, exact: true });
   }

   async setCheckbox(label: string, checked: boolean): Promise<void> {
      await this.checkbox(label).setChecked(checked);
   }

   /**
    * @param scaleTitle the title of the scale (e.g. 'Base Scale'), it must match a single scale
    */
   axisTitleInput(scaleTitle: string): Locator {
      return this.sidenav.locator('koia-scale').filter({ hasText: scaleTitle }).locator('.field_axis_title input');
   }

   /**
    * expands the panel unless it is expanded already
    */
   async setAxisTitle(panelTitle: string, scaleTitle: string, title: string): Promise<void> {
      await this.expandPanel(panelTitle);
      await this.axisTitleInput(scaleTitle).fill(title);
   }

   private async expandPanel(panelTitle: string): Promise<void> {
      await this.expand(this.sidenav.locator('mat-expansion-panel-header')
         .filter({ has: this.sidenav.page().getByText(panelTitle, { exact: true }) }));
   }

   private async expand(header: Locator): Promise<void> {
      if (await header.getAttribute('aria-expanded') !== 'true') {
         await header.click();
      }
   }

   /**
    * expands the panel holding the content unless it is expanded already
    */
   private async expandPanelOf(content: string): Promise<Locator> {
      const panel = this.sidenav.locator('mat-expansion-panel').filter({ has: this.sidenav.page().locator(content) });
      await this.expand(panel.locator('mat-expansion-panel-header'));
      return panel;
   }

   /**
    * the group-by select of the chart (`.field_group_by`), its text is available while its panel is collapsed
    */
   groupByField(): Locator {
      return this.sidenav.locator('.field_group_by mat-select');
   }

   /**
    * @param label the label of the value mode option (e.g. 'Count Rows')
    */
   async chooseAggregation(label: string): Promise<void> {
      await this.selectOption(this.sidenav.locator('.field_aggregation_mode'), label);
   }

   async selectValueAggregation(label: string): Promise<void> {
      await this.selectOption(this.sidenav.locator('.field_value_aggregation'), label);
   }

   /**
    * expands the panel of the time unit field unless it is expanded already
    */
   async selectTimeUnit(label: string): Promise<void> {
      const panel = await this.expandPanelOf('.field_time_unit');
      await this.selectOption(panel.locator('.field_time_unit'), label);
   }

   /**
    * opens the select by clicking its form field like a user, as the label of an empty select may cover the select itself
    */
   private async selectOption(field: Locator, label: string): Promise<void> {
      await field.locator('.mat-mdc-text-field-wrapper').click();
      await this.sidenav.page().getByRole('option', { name: label, exact: true }).click();
   }

   /**
    * expands the hierarchy panel of the summary table or graph unless it is expanded already and drops the available column into the
    * selected group-by columns
    */
   dragGroupByColumn(name: string): Promise<void> {
      return this.dragBetweenLists('selectedGroupByColumns', name, true);
   }

   async selectGroupByTimeUnit(column: string, label: string): Promise<void> {
      const page = this.sidenav.page();
      await this.sidenav.locator('#selectedGroupByColumns koia-draggable-column')
         .filter({ has: page.getByText(column, { exact: true }) })
         .locator('.select_time_unit > span').click();
      await page.getByRole('menuitem', { name: label, exact: true }).click();
   }

   /**
    * expands the color scheme panel unless it is expanded already and resolves once the scheme is pressed
    */
   async selectColorScheme(scheme: CategoricalColorScheme): Promise<void> {
      const panel = await this.expandPanelOf('koia-color-scheme-selection');
      const button = panel.getByRole('button', { name: scheme, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
   }

   /**
    * expands the aggregation panel of the summary table unless it is expanded already and drops the available aggregation into the
    * selected aggregations
    */
   selectAggregation(label: string): Promise<void> {
      return this.dragBetweenLists('selectedAggregations', label, true);
   }

   /**
    * expands the aggregation panel of the summary table unless it is expanded already and drops the selected aggregation into the
    * available aggregations, which is not possible for the only selected aggregation
    */
   deselectAggregation(label: string): Promise<void> {
      return this.dragBetweenLists('selectedAggregations', label, false);
   }

   /**
    * groups the values of the number column into ranges, the grouped column has no value grouping icon any longer
    */
   async addValueGrouping(column: string): Promise<void> {
      const columnGroup = this.sidenav.locator('#div_sel_data_columns .div_col_value_grouping')
         .filter({ has: this.sidenav.page().getByRole('button', { name: column, exact: true }) });
      await columnGroup.locator('.icon_define_value_grouping').click();
      await expect(columnGroup).toHaveCount(0);
   }

   /**
    * expands the split panel of the chart unless it is expanded already and drops the available column into the split columns
    */
   splitBy(column: string): Promise<void> {
      return this.dragBetweenLists(SPLIT_COLUMNS_ID, column, true, textNodeOf(column));
   }

   /**
    * expands the split panel of the chart unless it is expanded already and drops every split column into the available columns
    */
   async removeSplitColumns(): Promise<void> {
      const panel = await this.expandPanelOf('#' + SPLIT_COLUMNS_ID);
      const names = await panel.locator('#' + SPLIT_COLUMNS_ID + ' .div_column_item > span').allTextContents();
      for (const name of names.map(n => n.trim())) {
         await this.dragBetweenLists(SPLIT_COLUMNS_ID, name, false, textNodeOf(name));
      }
   }

   /**
    * drags the item by its label between the selected list and the available list of the panel holding the selected list, after
    * scrolling the available list into view, as an expanded panel may reach below the window, and resolves once the drop animation
    * removed the drag preview, as items moved before would be pressed at their animated position
    */
   private async dragBetweenLists(selectedListId: string, label: string, toSelected: boolean,
      itemOf: (list: Locator) => Locator = list => list.getByText(label, { exact: true })): Promise<void> {
      const selectedList = '#' + selectedListId;
      const panel = await this.expandPanelOf(selectedList);
      const selected = panel.locator(selectedList);
      const available = panel.locator('.div_column_list:not(' + selectedList + ')');
      const [from, to] = toSelected ? [available, selected] : [selected, available];
      await available.scrollIntoViewIfNeeded();
      await dragCenterOnto(itemOf(from), to);
      await expect(itemOf(to)).toBeVisible();
      await expect(this.sidenav.page().locator('.cdk-drag-preview')).toHaveCount(0);
   }

   async switchChartType(chartType: ChartType): Promise<void> {
      await this.chartTypeButton(chartType).click();
   }

   /**
    * @returns the chart type whose button is highlighted, once the side bar shows the chart types
    */
   async selectedChartType(): Promise<ChartType> {
      await expect(this.sidenav.locator('.but_chart_type.mat-accent')).toHaveCount(1);
      const classNames = await this.sidenav.locator('.but_chart_type').evaluateAll(buttons => buttons.map(b => b.className));
      return ChartType.ALL[classNames.findIndex(c => /\bmat-accent\b/.test(c))];
   }
}
