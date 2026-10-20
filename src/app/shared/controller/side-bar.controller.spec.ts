import { Directive, SimpleChange } from '@angular/core';
import { fakeAsync, flush } from '@angular/core/testing';
import { Aggregation, Column, ComputeOperator, DataType, ElementContext, ExportFormat, TimeUnit } from '../model';
import { ContainerModel, DragDropEventFactory } from '../test';
import { SideBarController } from './side-bar.controller';

@Directive()
class SideBarControllerTestable extends SideBarController {

   columnOf(column: Column): Column {
      return this.contextColumnOf(column);
   }
}

class ContextTestable extends ElementContext {

   constructor(columns: Column[]) {
      super(columns);
   }

   getTitle(): string {
      return '';
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [];
   }
}

describe('SummaryTableSideBarComponent', () => {

   const dragDropEventFactory = new DragDropEventFactory<Column>();
   let columns: Column[];
   let context: ElementContext;
   let controller: SideBarControllerTestable;

   beforeAll(() => {
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE },
         { name: 'Level', dataType: DataType.TEXT, width: 60 },
         { name: 'Host', dataType: DataType.TEXT, width: 80 },
         { name: 'Path', dataType: DataType.TEXT, width: 200 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 70 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 30 }
      ];
   });

   beforeEach(() => {
      context = new ContextTestable(columns);
      context.dataColumns = [findColumn('Amount')];
      context.groupByColumns = [findColumn('Time')];
      context.aggregations = [Aggregation.MIN, Aggregation.MAX];

      controller = new SideBarControllerTestable();
      controller.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
   });

   it('#dropSplitColumn should re-position context split columns when moved inside selected columns', () => {

      // given
      context.splitColumns = [findColumn('Time'), findColumn('Host'), findColumn('Level')];
      controller.selectedSplitColumns = context.splitColumns.slice(0);
      const dragDropEvent = dragDropEventFactory.createInContainerEvent('selectedSplitColumns', controller.selectedSplitColumns, 1, 0);

      // when
      controller.dropSplitColumn(dragDropEvent);

      // then
      expect(context.splitColumns.map(c => c.name)).toEqual(['Host', 'Time', 'Level']);
   });

   it('#dropSplitColumn should not change context split column when moved inside available columns', () => {

      // given
      context.splitColumns = [findColumn('Time'), findColumn('Host'), findColumn('Level')];
      controller.selectedSplitColumns = context.splitColumns.slice(0);
      const data = [findColumn('Path'), findColumn('Percent')];
      const dragDropEvent = dragDropEventFactory.createInContainerEvent('availableSplitColumns', data, 1, 0);

      // when
      controller.dropSplitColumn(dragDropEvent);

      // then
      expect(context.splitColumns.map(c => c.name)).toEqual(['Time', 'Host', 'Level']);
   });

   it('#dropSplitColumn should change context split column when moved into selected columns', () => {

      // given
      context.splitColumns = [findColumn('Time'), findColumn('Host')];
      controller.selectedSplitColumns = context.splitColumns.slice(0);
      const from: ContainerModel<Column> = {
         id: 'availableSplitColumns',
         data: [findColumn('Path'), findColumn('Level'), findColumn('Percent')],
         index: 1
      };
      const to: ContainerModel<Column> = {
         id: 'selectedSplitColumns',
         data: controller.selectedSplitColumns,
         index: 2
      };
      const dragDropEvent = dragDropEventFactory.createCrossContainerEvent(from, to);

      // when
      controller.dropSplitColumn(dragDropEvent);

      // then
      expect(context.splitColumns.map(c => c.name)).toEqual(['Time', 'Host', 'Level']);
   });

   it('#dropGroupByColumn should re-position context group-by columns when moved inside selected columns', () => {

      // given
      context.groupByColumns = [findColumn('Time'), findColumn('Host'), findColumn('Level')];
      controller.selectedGroupByColumns = context.groupByColumns.slice(0);
      const dragDropEvent = dragDropEventFactory.createInContainerEvent('selectedGroupByColumns', controller.selectedGroupByColumns, 1, 0);

      // when
      controller.dropGroupByColumn(dragDropEvent);

      // then
      expect(context.groupByColumns.map(c => c.name)).toEqual(['Host', 'Time', 'Level']);
   });

   it('#dropGroupByColumn should not change context group-by column when moved inside available columns', () => {

      // given
      context.groupByColumns = [findColumn('Time'), findColumn('Host'), findColumn('Level')];
      controller.selectedGroupByColumns = context.groupByColumns.slice(0);
      const data = [findColumn('Path'), findColumn('Percent')];
      const dragDropEvent = dragDropEventFactory.createInContainerEvent('availableGroupByColumns', data, 1, 0);

      // when
      controller.dropGroupByColumn(dragDropEvent);

      // then
      expect(context.groupByColumns.map(c => c.name)).toEqual(['Time', 'Host', 'Level']);
   });

   it('#dropGroupByColumn should change context group-by column when moved into selected columns', () => {

      // given
      context.groupByColumns = [findColumn('Time'), findColumn('Host')];
      controller.selectedGroupByColumns = context.groupByColumns.slice(0);
      const from: ContainerModel<Column> = {
         id: 'availableGroupByColumns',
         data: [findColumn('Path'), findColumn('Level'), findColumn('Percent')],
         index: 1
      };
      const to: ContainerModel<Column> = {
         id: 'selectedGroupByColumns',
         data: controller.selectedGroupByColumns,
         index: 2
      };
      const dragDropEvent = dragDropEventFactory.createCrossContainerEvent(from, to);

      // when
      controller.dropGroupByColumn(dragDropEvent);

      // then
      expect(context.groupByColumns.map(c => c.name)).toEqual(['Time', 'Host', 'Level']);
   });

   it('#addValueGrouping should add value grouping', fakeAsync(() => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries = entries;

      // when
      controller.addValueGrouping('Amount');
      flush();

      // then
      expect(context.hasValueGrouping('Amount')).toBeTruthy();
      expect(context.valueGroupings[0].columnName).toEqual('Amount');
   }));

   it('#removeValueGrouping should remove value grouping', () => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries = entries;
      controller.addValueGrouping('Amount');
      const amountValueGrouping = context.valueGroupings[0];

      // when
      controller.removeValueGrouping(amountValueGrouping);

      // then
      expect(context.hasValueGrouping('Amount')).toBe(false);
   });

   it('#ngOnChanges should keep element context when context did not change', () => {

      // when
      controller.ngOnChanges({ entries: new SimpleChange(undefined, [], true) });

      // then
      expect(controller.elementContext).toBe(context);
   });

   it('#onValueGroupingRangesChanged should fire structure change when column is in use', () => {

      // given
      context.dataColumns = [findColumn('Percent')];
      context.groupByColumns = [];
      const valueGrouping = { columnName: 'Percent', ranges: [{ max: 100, active: true }] };
      vi.spyOn(context, 'fireStructureChanged').mockReturnValue(undefined);

      // when
      controller.onValueGroupingRangesChanged(valueGrouping);

      // then
      expect(context.fireStructureChanged).toHaveBeenCalled();
   });

   it('#onValueGroupingRangesChanged should not fire structure change when column is not in use', () => {

      // given
      context.dataColumns = [findColumn('Path')];
      context.groupByColumns = [findColumn('Time')];
      const valueGrouping = { columnName: 'Percent', ranges: [{ max: 100, active: true }] };
      vi.spyOn(context, 'fireStructureChanged').mockReturnValue(undefined);

      // when
      controller.onValueGroupingRangesChanged(valueGrouping);

      // then
      expect(context.fireStructureChanged).not.toHaveBeenCalled();
   });

   it('#setElementPosition should emit onElementPositionChange', () => {

      // given
      vi.spyOn(controller.onElementPositionChange, 'emit').mockReturnValue(undefined);

      // when
      controller.setElementPosition(3);

      // then
      expect(controller.onElementPositionChange.emit).toHaveBeenCalledWith(3);
   });

   it('#isNumericColumn should return true when column is "Number"', () => {
      expect(controller.isNumericColumn(findColumn('Time'))).toBe(true);
      expect(controller.isNumericColumn(findColumn('Amount'))).toBe(true);
      expect(controller.isNumericColumn(findColumn('Percent'))).toBe(true);
   });

   it('#isNumericColumn should return false when column is "Text"', () => {
      expect(controller.isNumericColumn(findColumn('Level'))).toBe(false);
      expect(controller.isNumericColumn(findColumn('Host'))).toBe(false);
      expect(controller.isNumericColumn(findColumn('Path'))).toBe(false);
   });

   it('#isNumericColumn should return false when column is missing', () => {
      expect(controller.isNumericColumn(findColumn(undefined))).toBe(false);
      expect(controller.isNumericColumn(findColumn(null))).toBe(false);
   });

   it('#ngDoCheck should define selectable items without computed split and group-by columns', () => {

      // given
      context = new ContextTestable([...columns, shareColumn()]);
      context.dataColumns = [findColumn('Amount')];
      controller.ngOnChanges({ context: new SimpleChange(undefined, context, true) });

      // when
      controller.ngDoCheck();

      // then
      expect(controller.availableSplitColumns.map(c => c.name)).toEqual(['Level', 'Host', 'Path', 'Percent']);
      expect(controller.availableGroupByColumns.map(c => c.name)).toEqual(['Time', 'Level', 'Host', 'Path', 'Percent']);
   });

   it('#ngDoCheck should refresh the selectable columns when the context columns were replaced', () => {

      // given
      controller.ngDoCheck();
      const region: Column = { name: 'Region', dataType: DataType.TEXT, width: 50 };

      // when
      context.updateColumns([...columns, region]);
      controller.ngDoCheck();

      // then
      expect(controller.availableGroupByColumns).toContain(region);
      expect(controller.availableSplitColumns).toContain(region);
   });

   it('#ngDoCheck should not refresh when the columns are unchanged', () => {

      // given
      controller.ngDoCheck();
      controller.availableGroupByColumns = [];

      // when
      controller.ngDoCheck();

      // then
      expect(controller.availableGroupByColumns).toEqual([]);
   });

   it('#ngDoCheck should not refresh when no context exists', () => {

      // given
      controller = new SideBarControllerTestable();

      // when
      controller.ngDoCheck();

      // then
      expect(controller.availableGroupByColumns).toBeUndefined();
   });

   it('#iconOfColumn should return functions icon when column is computed', () => {
      expect(controller.iconOfColumn(shareColumn())).toBe('functions');
   });

   it('#iconOfColumn should return data type icon when column is stored', () => {
      expect(controller.iconOfColumn(findColumn('Level'))).toBe('title');
   });

   it('#isComputedColumn should return true when column is computed', () => {
      expect(controller.isComputedColumn(shareColumn())).toBe(true);
   });

   it('#isComputedColumn should return false when column is stored', () => {
      expect(controller.isComputedColumn(findColumn('Amount'))).toBe(false);
   });

   it('#computedColumnTooltip should return formula when column is computed', () => {
      expect(controller.computedColumnTooltip(shareColumn())).toBe('Amount as % of Percent');
   });

   it('#computedColumnTooltip should return empty string when column is stored', () => {
      expect(controller.computedColumnTooltip(findColumn('Amount'))).toBe('');
   });

   it('#contextColumnOf should return context column of same name', () => {

      // when
      const column = controller.columnOf({ ...findColumn('Host') });

      // then
      expect(column).toBe(findColumn('Host'));
   });

   function shareColumn(): Column {
      return {
         name: 'Share', dataType: DataType.NUMBER, width: 30, indexed: false,
         computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Percent' }
      };
   }

   function findColumn(name: string): Column {
      return columns.find(c => c.name === name);
   }

   function generateEntries(columnName: string, count: number, minValue: number, maxValue: number): object[] {
      const entries: object[] = new Array(count);
      const diffPerEntry = (maxValue - minValue) / (count - 1);
      let value = minValue;
      for (let i = 0; i < count - 1; i++) {
         entries[i] = { [columnName]: value };
         value += diffPerEntry;
      }
      entries[count - 1] = { [columnName]: maxValue };
      return entries;
   }
});


