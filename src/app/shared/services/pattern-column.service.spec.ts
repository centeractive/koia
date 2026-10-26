import { Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { Column, ComputeOperator, DataType, Document, Scene } from 'app/shared/model';
import { SceneFactory } from 'app/shared/test';
import type { Mock } from 'vitest';
import { DBService } from './backend/db.service';
import { PatternColumnService } from './pattern-column.service';

describe('PatternColumnService', () => {

  let level: Column;
  let message: Column;
  let amount: Column;
  let share: Column;
  let scene: Scene;
  let dbService: DBService;
  let calls: string[];
  let updateSceneSpy: Mock;
  let reuseStrategy: AppRouteReuseStrategy;
  let onProgress: Mock;
  let service: PatternColumnService;

  beforeEach(() => {
    level = { name: 'Level', dataType: DataType.TEXT, width: 8, indexed: true };
    message = { name: 'Message', dataType: DataType.TEXT, width: 40, indexed: false };
    amount = { name: 'Amount', dataType: DataType.NUMBER, width: 8, indexed: true };
    share = {
      name: 'Share', dataType: DataType.NUMBER, width: 10, indexed: false,
      computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Amount' }
    };
    scene = SceneFactory.createScene('1', [level, message, amount, share]);
    scene.columnMappings = [level, message, amount].map(c => ({ source: { ...c, name: 'src ' + c.name }, target: { ...c } }));
    dbService = new DBService(null, null);
    calls = [];
    vi.spyOn(dbService, 'getActiveScene').mockReturnValue(undefined);
    vi.spyOn(dbService, 'findScene').mockResolvedValue(scene);
    vi.spyOn(dbService, 'addPatternField').mockImplementation((database, sourceName, targetName, progress) => {
      calls.push('addPatternField ' + database + ' ' + sourceName + ' ' + targetName);
      progress(3);
      return Promise.resolve(3);
    });
    vi.spyOn(dbService, 'createColumnIndex').mockImplementation((database, columnName) => {
      calls.push('createColumnIndex ' + database + ' ' + columnName);
      return Promise.resolve();
    });
    updateSceneSpy = vi.spyOn(dbService, 'updateScene').mockImplementation(s => {
      calls.push('updateScene ' + s.columns.map(c => c.name).join());
      return Promise.resolve(s);
    });
    reuseStrategy = new AppRouteReuseStrategy();
    vi.spyOn(reuseStrategy, 'clear');
    onProgress = vi.fn();
    service = new PatternColumnService(dbService, { routeReuseStrategy: reuseStrategy } as unknown as Router);
  });

  it('#add should write patterns, index them and add pattern column to inactive scene', async () => {

    // when
    const column = await service.add('1', 'Message', onProgress);

    // then
    const expected: Column = { name: 'Message pattern', dataType: DataType.TEXT, width: 40, indexed: true, patternOf: 'Message' };
    expect(column).toEqual(expected);
    expect(dbService.findScene).toHaveBeenCalledWith('1');
    expect(calls).toEqual([
      'addPatternField ' + scene.database + ' Message Message pattern',
      'createColumnIndex ' + scene.database + ' Message pattern',
      'updateScene Level,Message,Amount,Share,Message pattern'
    ]);
    expect(onProgress).toHaveBeenCalledWith(3);
    expect(reuseStrategy.clear).not.toHaveBeenCalled();
  });

  it('#add should add pattern mapping of message mapping', async () => {

    // given
    const columnMappings = scene.columnMappings;

    // when
    const column = await service.add('1', 'Message', onProgress);

    // then
    expect(scene.columnMappings).not.toBe(columnMappings);
    expect(scene.columnMappings.length).toBe(4);
    expect(scene.columnMappings[3]).toEqual({ source: { ...message, name: 'src Message' }, target: column });
    expect(scene.columnMappings[3].source).not.toBe(scene.columnMappings[1].source);
    expect(scene.columnMappings[3].target).not.toBe(column);
  });

  it('#add should not add pattern mapping when scene has no mapping of message column', async () => {

    // given
    scene.columnMappings = undefined;

    // when
    await service.add('1', 'Message', onProgress);

    // then
    expect(scene.columnMappings).toBeUndefined();
  });

  it('#add should update active scene in place and clear cached views', async () => {

    // given
    vi.mocked(dbService.getActiveScene).mockReturnValue(scene);
    const columns = scene.columns;

    // when
    await service.add('1', 'Message', onProgress);

    // then
    expect(dbService.findScene).not.toHaveBeenCalled();
    expect(updateSceneSpy).toHaveBeenCalledWith(scene);
    expect(scene.columns).not.toBe(columns);
    expect(scene.columns.map(c => c.name)).toEqual(['Level', 'Message', 'Amount', 'Share', 'Message pattern']);
    expect(reuseStrategy.clear).toHaveBeenCalled();
  });

  it('#add should load scene when another scene is active', async () => {

    // given
    vi.mocked(dbService.getActiveScene).mockReturnValue(SceneFactory.createScene('2', []));

    // when
    await service.add('1', 'Message', onProgress);

    // then
    expect(dbService.findScene).toHaveBeenCalledWith('1');
    expect(reuseStrategy.clear).not.toHaveBeenCalled();
  });

  it('#add should number pattern column name when it is in use', async () => {

    // given
    amount.name = 'Message pattern';

    // when
    const column = await service.add('1', 'Message', onProgress);

    // then
    expect(column.name).toBe('Message pattern (2)');
  });

  it.each([
    ['Unknown', 'column "Unknown" does not exist'],
    ['Amount', 'no pattern column can be added to column "Amount"'],
    ['Share', 'no pattern column can be added to column "Share"']
  ])('#add should refuse pattern of column %s', async (columnName, error) => {

    // when
    const result = service.add('1', columnName, onProgress);

    // then
    await expect(result).rejects.toThrow(error);
    expect(calls).toEqual([]);
  });

  it('#add should refuse second pattern of column and pattern of pattern column', async () => {

    // given
    await service.add('1', 'Message', onProgress);
    calls = [];

    // when
    const second = service.add('1', 'Message', onProgress);
    const ofPattern = service.add('1', 'Message pattern', onProgress);

    // then
    await expect(second).rejects.toThrow('no pattern column can be added to column "Message"');
    await expect(ofPattern).rejects.toThrow('no pattern column can be added to column "Message pattern"');
    expect(calls).toEqual([]);
  });

  it('#add should restore columns and column mappings when scene cannot be updated', async () => {

    // given
    vi.mocked(dbService.getActiveScene).mockReturnValue(scene);
    const columns = scene.columns;
    const columnMappings = scene.columnMappings;
    updateSceneSpy.mockRejectedValueOnce({ status: 409 });

    // when
    const result = service.add('1', 'Message', onProgress);

    // then
    await expect(result).rejects.toEqual({ status: 409 });
    expect(updateSceneSpy).toHaveBeenCalledTimes(1);
    expect(scene.columns).toBe(columns);
    expect(scene.columnMappings).toBe(columnMappings);
    expect(reuseStrategy.clear).not.toHaveBeenCalled();
  });

  it('#add should add same pattern column when repeated after scene could not be updated', async () => {

    // given
    updateSceneSpy.mockRejectedValueOnce(new Error('conflict'));
    await expect(service.add('1', 'Message', onProgress)).rejects.toThrow('conflict');

    // when
    const column = await service.add('1', 'Message', onProgress);

    // then
    expect(column.name).toBe('Message pattern');
    expect(calls.filter(c => c.startsWith('createColumnIndex'))).toEqual([
      'createColumnIndex ' + scene.database + ' Message pattern',
      'createColumnIndex ' + scene.database + ' Message pattern'
    ]);
  });

  it('#add should not add pattern column when patterns cannot be written', async () => {

    // given
    vi.mocked(dbService.addPatternField).mockRejectedValue(new Error('write failed'));

    // when
    const result = service.add('1', 'Message', onProgress);

    // then
    await expect(result).rejects.toThrow('write failed');
    expect(dbService.createColumnIndex).not.toHaveBeenCalled();
    expect(updateSceneSpy).not.toHaveBeenCalled();
  });

  it('#suitableColumnNames should return derivable columns with free text sample', async () => {

    // given
    scene.columns.push({ name: 'Message pattern', dataType: DataType.TEXT, width: 40, indexed: true, patternOf: 'Message' },
      { name: 'Body', dataType: DataType.TEXT, width: 40, indexed: false });
    vi.spyOn(dbService, 'findSampleEntries').mockResolvedValue([
      { _id: '1', Level: 'INFO', Message: 'Request r1 failed', Body: 'Job j1 done', 'Message pattern': 'Request <*> failed' } as Document
    ]);

    // when
    const names = await service.suitableColumnNames(scene);

    // then
    expect(names).toEqual(new Set(['Body']));
    expect(dbService.findSampleEntries).toHaveBeenCalledWith(scene.database, 100);
  });

  it('#suitableColumnNames should not read sample when no column is derivable', async () => {

    // given
    vi.spyOn(dbService, 'findSampleEntries');
    scene.columns = [amount, share];

    // when
    const names = await service.suitableColumnNames(scene);

    // then
    expect(names).toEqual(new Set());
    expect(dbService.findSampleEntries).not.toHaveBeenCalled();
  });
});
