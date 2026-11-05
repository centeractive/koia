import { Aggregation, Column, ComputeOperator, DataType, Route, Scene } from 'app/shared/model';
import { ConfigRecord, ElementType, SavedView, View, ViewType } from 'app/shared/model/view-config';
import { savedViewOf, SceneFactory } from 'app/shared/test';
import type { Mock } from 'vitest';
import { DBService } from './backend/db.service';
import { ComputedColumnChange, ComputedColumnService } from './computed-column.service';
import { RawDataStateService } from './saved-views/raw-data-state.service';
import { ViewPersistenceService } from './view-persistence/view-persistence.service';
import { ViewTabsService } from './view-tabs/view-tabs.service';

describe('ComputedColumnService', () => {

  let time: Column;
  let level: Column;
  let amount: Column;
  let price: Column;
  let comment: Column;
  let share: Column;
  let scene: Scene;
  let dbService: DBService;
  let updateSceneSpy: Mock;
  let viewTabsService: ViewTabsService;
  let rawDataStateService: RawDataStateService;
  let service: ComputedColumnService;
  let changes: ComputedColumnChange[];

  beforeEach(() => {
    time = { name: 'Time', dataType: DataType.TIME, width: 100, indexed: true };
    level = { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true };
    amount = { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true };
    price = { name: 'Price', dataType: DataType.NUMBER, width: 50, indexed: true };
    comment = { name: 'Comment', dataType: DataType.NUMBER, width: 80, indexed: false };
    share = computedColumn('Share', ComputeOperator.PERCENTAGE);
    scene = SceneFactory.createScene('1', [time, level, amount, price, comment, share]);
    dbService = new DBService(null, null);
    vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
    updateSceneSpy = vi.spyOn(dbService, 'updateScene').mockImplementation(s => Promise.resolve(s));
    viewTabsService = { updateColumnReferences: vi.fn() } as unknown as ViewTabsService;
    rawDataStateService = new RawDataStateService(dbService);
    vi.spyOn(rawDataStateService, 'updateColumnReferences');
    service = new ComputedColumnService(dbService, viewTabsService, new ViewPersistenceService(dbService), rawDataStateService);
    changes = [];
    service.changed$.subscribe(c => changes.push(c));
  });

  it('#columns should return computed columns', () => {

    // when
    const columns = service.columns();

    // then
    expect(columns).toEqual([share]);
  });

  it('#operandColumns should return indexed number columns that are not computed', () => {

    // when
    const columns = service.operandColumns();

    // then
    expect(columns).toEqual([amount, price]);
  });

  it('#canCreate should be true with operand columns and false without', () => {

    // given
    const sceneWithoutOperandColumns = SceneFactory.createScene('2', [time, level, comment]);

    // when
    const withOperandColumns = service.canCreate();
    vi.spyOn(dbService, 'getActiveScene').mockReturnValue(sceneWithoutOperandColumns);
    const withoutOperandColumns = service.canCreate();

    // then
    expect(withOperandColumns).toBe(true);
    expect(withoutOperandColumns).toBe(false);
  });

  it('#usedNames should return names of all columns, time grouping labels and reserved names', () => {

    // when
    const names = service.usedNames();

    // then
    expect(names).toEqual(['Time', 'Level', 'Amount', 'Price', 'Comment', 'Share',
      'Time (per second)', 'Time (per minute)', 'Time (per hour)', 'Time (per day)', 'Time (per month)', 'Time (per year)', '_id', '_rev', 'fgcolor', 'bgcolor', '__proto__']);
  });

  it('#usedNames should not return name of excepted computed column', () => {

    // when
    const names = service.usedNames('Share');

    // then
    expect(names).toEqual(['Time', 'Level', 'Amount', 'Price', 'Comment',
      'Time (per second)', 'Time (per minute)', 'Time (per hour)', 'Time (per day)', 'Time (per month)', 'Time (per year)', '_id', '_rev', 'fgcolor', 'bgcolor', '__proto__']);
  });

  it('#usedNames should reserve the time grouping labels of time columns', () => {

    // given
    scene.columns.push({ name: 'Date', dataType: DataType.TIME, width: 100, indexed: true });

    // when
    const names = service.usedNames('Date (per month)');

    // then
    expect(names).toEqual(expect.arrayContaining(['Time (per second)', 'Time (per minute)', 'Time (per hour)', 'Time (per day)', 'Time (per month)', 'Time (per year)',
      'Date (per second)', 'Date (per minute)', 'Date (per hour)', 'Date (per day)', 'Date (per month)', 'Date (per year)']));
    expect(names).not.toContain('Time (per millisecond)');
  });

  it('#usedNames should not reserve the time grouping label that names the edited computed column', () => {

    // given
    scene.columns.push(computedColumn('Time (per month)', ComputeOperator.ADD));

    // when
    const names = service.usedNames('Time (per month)');

    // then
    expect(names).not.toContain('Time (per month)');
    expect(names).toContain('Time (per day)');
  });

  it('#usedNames should return name of excepted stored column', () => {

    // when
    const names = service.usedNames('Amount');

    // then
    expect(names).toContain('Amount');
  });

  it('#save should append new column and emit change', async () => {

    // given
    const sum = computedColumn('Sum', ComputeOperator.ADD);

    // when
    await service.save(sum);

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment, share, sum]);
    expect(updateSceneSpy).toHaveBeenCalledWith(scene);
    expect(changes).toEqual([{ name: 'Sum', previousName: 'Sum' }]);
  });

  it('#save should append new column without renaming references to its name', async () => {

    // given
    const view = viewOf('Sum');
    const savedView = savedViewWith(view, { Sum: 40 });
    scene.config = { savedViews: [savedView] };

    // when
    await service.save(computedColumn('Sum', ComputeOperator.ADD));

    // then
    expect(view.elements[0].dataColumns[0].name).toBe('Sum');
    expect(savedView.rawData.data.columnWidths).toEqual({ Sum: 40 });
    expect(viewTabsService.updateColumnReferences).toHaveBeenCalledWith({ name: 'Sum', previousName: 'Sum' });
  });

  it('#save should replace existing column', async () => {

    // given
    const edited = computedColumn('Share', ComputeOperator.DIVIDE);

    // when
    await service.save(edited, 'Share');

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment, edited]);
    expect(changes).toEqual([{ name: 'Share', previousName: 'Share' }]);
  });

  it('#save should rename column, saved views and tabs in place and emit previous name', async () => {

    // given
    const view = viewOf('Share');
    const savedView = savedViewWith(view, { Share: 40 });
    scene.config = { savedViews: [savedView] };
    const renamed = computedColumn('Ratio', ComputeOperator.PERCENTAGE);

    // when
    await service.save(renamed, 'Share');

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment, renamed]);
    expect(scene.config.savedViews[0]).toBe(savedView);
    expect(savedView.tabs[0].view).toBe(view);
    expect(view.elements[0].dataColumns[0].name).toBe('Ratio');
    expect(savedView.rawData.data.columnWidths).toEqual({ Ratio: 40 });
    expect(viewTabsService.updateColumnReferences).toHaveBeenCalledWith({ name: 'Ratio', previousName: 'Share' });
    expect(rawDataStateService.updateColumnReferences).toHaveBeenCalledWith({ name: 'Ratio', previousName: 'Share' });
    expect(changes).toEqual([{ name: 'Ratio', previousName: 'Share' }]);
  });

  it('#save should rename column in pivot tabs of saved views', async () => {

    // given
    const pivotOptions = { rows: ['Share', 'Level'] };
    scene.config = { savedViews: [savedViewOf('all', [{ id: 'tab1', type: ViewType.PIVOT, title: 'Pivot', record: pivotRecordWith(pivotOptions) }])] };

    // when
    await service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    expect(pivotOptions.rows).toEqual(['Ratio', 'Level']);
  });

  it('#save should convert legacy views and rename column in converted saved view', async () => {

    // given
    scene.config = { views: [viewOf('Share')] };

    // when
    await service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    expect(scene.config.views).toBeUndefined();
    expect(scene.config.savedViews[0].tabs[0].view.elements[0].dataColumns[0].name).toBe('Ratio');
  });

  it('#save should rename column width of pending raw data state when column was renamed', async () => {

    // given
    const state = savedViewWith(viewOf('Share'), { Share: 40 }).rawData;
    rawDataStateService.apply(state);

    // when
    await service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    expect(state.data.columnWidths).toEqual({ Ratio: 40 });
  });

  it.each(['Amount', 'Comment', '_id', 'fgcolor', '__proto__'])('#save should reject name "%s" without updating scene', async name => {

    // given
    const column = computedColumn(name, ComputeOperator.ADD);

    // when
    const save = service.save(column, 'Share');

    // then
    await expect(save).rejects.toThrow('column name "' + name + '" is already in use');
    expect(updateSceneSpy).not.toHaveBeenCalled();
    expect(scene.columns).toEqual([time, level, amount, price, comment, share]);
    expect(changes).toEqual([]);
  });

  it('#save should reject name of other computed column without updating scene', async () => {

    // given
    const sum = computedColumn('Sum', ComputeOperator.ADD);
    scene.columns.push(sum);

    // when
    const save = service.save(computedColumn('Share', ComputeOperator.ADD), 'Sum');

    // then
    await expect(save).rejects.toThrow('column name "Share" is already in use');
    expect(updateSceneSpy).not.toHaveBeenCalled();
  });

  it('#save should reject replacing stored column without updating scene', async () => {

    // when
    const save = service.save(computedColumn('Ratio', ComputeOperator.ADD), 'Amount');

    // then
    await expect(save).rejects.toThrow('column "Amount" is not a computed column');
    expect(updateSceneSpy).not.toHaveBeenCalled();
  });

  it('#save should restore columns, undo rename and not emit when scene cannot be updated', async () => {

    // given
    const view = viewOf('Share');
    const savedView = savedViewWith(view, { Share: 40 });
    scene.config = { savedViews: [savedView] };
    const columns = scene.columns;
    updateSceneSpy.mockRejectedValue(new Error('offline'));

    // when
    const save = service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    await expect(save).rejects.toThrow('offline');
    expect(scene.columns).toBe(columns);
    expect(view.elements[0].dataColumns[0].name).toBe('Share');
    expect(savedView.rawData.data.columnWidths).toEqual({ Share: 40 });
    expect(viewTabsService.updateColumnReferences).not.toHaveBeenCalled();
    expect(rawDataStateService.updateColumnReferences).not.toHaveBeenCalled();
    expect(changes).toEqual([]);
  });

  it('#save should keep new name in saved view that already referenced it when scene cannot be updated', async () => {

    // given
    const view = viewOf('Ratio');
    const savedView = savedViewWith(view, { Share: 40, Ratio: 30 });
    scene.config = { savedViews: [savedView] };
    updateSceneSpy.mockRejectedValue(new Error('offline'));

    // when
    const save = service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    await expect(save).rejects.toThrow('offline');
    expect(view.elements[0].dataColumns[0].name).toBe('Ratio');
    expect(savedView.rawData.data.columnWidths).toEqual({ Share: 40, Ratio: 30 });
  });

  it('#remove should remove computed column and emit change', async () => {

    // when
    await service.remove('Share');

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment]);
    expect(updateSceneSpy).toHaveBeenCalledWith(scene);
    expect(changes).toEqual([{ name: undefined, previousName: 'Share' }]);
  });

  it('#remove should remove column from saved views, tabs and pending raw data state', async () => {

    // given
    const view = viewOf('Share');
    const savedView = savedViewWith(view, { Share: 40, Amount: 20 });
    scene.config = { savedViews: [savedView] };
    const pendingState = savedViewWith(viewOf('Share'), { Share: 30 }).rawData;
    rawDataStateService.apply(pendingState);

    // when
    await service.remove('Share');

    // then
    expect(view.elements[0].dataColumns).toEqual([]);
    expect(savedView.rawData.data.columnWidths).toEqual({ Amount: 20 });
    expect(pendingState.data.columnWidths).toEqual({});
    expect(viewTabsService.updateColumnReferences).toHaveBeenCalledWith({ name: undefined, previousName: 'Share' });
  });

  it.each(['Amount', 'Unknown'])('#remove should do nothing when "%s" is no computed column', async name => {

    // when
    await service.remove(name);

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment, share]);
    expect(updateSceneSpy).not.toHaveBeenCalled();
    expect(viewTabsService.updateColumnReferences).not.toHaveBeenCalled();
    expect(changes).toEqual([]);
  });

  it('#remove should restore columns and not emit when scene cannot be updated', async () => {

    // given
    const columns = scene.columns;
    updateSceneSpy.mockRejectedValue(new Error('offline'));

    // when
    const remove = service.remove('Share');

    // then
    await expect(remove).rejects.toThrow('offline');
    expect(scene.columns).toBe(columns);
    expect(scene.columns).toEqual([time, level, amount, price, comment, share]);
    expect(changes).toEqual([]);
  });

  it('#remove should undo removal from saved views when scene cannot be updated', async () => {

    // given
    const view = viewOf('Share');
    const savedView = savedViewWith(view, { Share: 40 });
    scene.config = { savedViews: [savedView] };
    updateSceneSpy.mockRejectedValue(new Error('offline'));

    // when
    const remove = service.remove('Share');

    // then
    await expect(remove).rejects.toThrow('offline');
    expect(view.elements[0].dataColumns.map(c => c.name)).toEqual(['Share']);
    expect(savedView.rawData.data.columnWidths).toEqual({ Share: 40 });
    expect(viewTabsService.updateColumnReferences).not.toHaveBeenCalled();
  });

  function computedColumn(name: string, operator: ComputeOperator): Column {
    return { name, dataType: DataType.NUMBER, width: 70, indexed: false, computation: { leftColumn: 'Amount', operator, rightColumn: 'Price' } };
  }

  function viewOf(dataColumnName: string): View {
    return {
      route: Route.GRID, name: 'View', modifiedTime: 1, query: undefined, gridColumns: 2, gridCellRatio: '1:1',
      elements: [{
        elementType: ElementType.SUMMARY, title: 'Summary', gridColumnSpan: 1, gridRowSpan: 1, width: 300, height: 300,
        dataColumns: [{ name: dataColumnName, dataType: DataType.NUMBER, width: 70 }], splitColumns: [], groupByColumns: [],
        aggregations: [Aggregation.AVG], valueGroupings: [], colorOptions: undefined
      }]
    };
  }

  function pivotRecordWith(pivotOptions: object): ConfigRecord {
    return { route: Route.PIVOT, name: 'Pivot', modifiedTime: 1, query: undefined, data: { pivotOptions } };
  }

  function savedViewWith(view: View, columnWidths: Record<string, number>): SavedView {
    const savedView = savedViewOf('all', [{ id: 'tab1', type: ViewType.DASHBOARD, title: 'Dashboard', view }]);
    savedView.rawData.data.columnWidths = columnWidths;
    return savedView;
  }
});
