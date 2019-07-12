import { Route, Aggregation, StatusType, Scene, DataType, Column } from '../model';
import { View } from '../config/view.type';
import { ConfigRecord } from '../config/config.record.type';
import { Config } from '../config/config.type';
import { Summary } from '../config/summary.type';
import { Chart } from '../config/chart.type';
import { ConfigService } from './config.service';
import { DBService } from './backend';
import { DocChangeResponse } from './backend/doc-change-response.type';
import { ElementType } from '../config/element-type.enum';

describe('ConfigService', () => {

  const ERROR = 'Expected Testing Error';

  let fakeConfigRecord: ConfigRecord;
  let flexView: View;
  let gridView: View;
  let config: Config;
  let scene: Scene;
  let dbService: DBService;
  let updateSceneOK: DocChangeResponse;
  let configService: ConfigService;

  beforeAll(() => {
    fakeConfigRecord = { name: 'fake', data: { a: 1, b: 2, c: 3 } };
    const levelColumn = createColumn('Level', DataType.TEXT);
    const timeColumn = createColumn('Time', DataType.TIME);
    const summary: Summary = {
      elementType: ElementType.SUMMARY, title: 'Test Summary', gridColumnSpan: 1, gridRowSpan: 1, width: 600, height: 600,
      dataColumns: [levelColumn], groupByColumns: [timeColumn], aggregations: [Aggregation.COUNT], valueGroupings: [], empty: ''
    };
    flexView = { name: Route.FLEX, gridColumns: null, gridCellRatio: null, elements: [summary] };

    const chart: Chart = {
      elementType: ElementType.CHART, title: 'Test Chart', gridColumnSpan: 2, gridRowSpan: 1, width: 600, height: 600,
      dataColumns: [levelColumn], groupByColumns: [timeColumn], aggregations: [Aggregation.COUNT], valueGroupings: [],
      chartType: 'lineChart', margin: { top: 1, right: 2, bottom: 3, left: 4 }, showLegend: true,
      legendPosition: 'top', xLabelRotation: -12
    };
    gridView = { name: Route.GRID, gridColumns: 3, gridCellRatio: '1:1', elements: [chart] };
    config = { records: [fakeConfigRecord], views: [gridView] };
  });

  beforeEach(() => {
    scene = createScene();
    updateSceneOK = { ok: true, id: scene._id, rev: scene._rev };
    dbService = new DBService(null);
    configService = new ConfigService(dbService);
  });

  it('#getData should return undefined when data is missing', () => {

    // when
    const data = configService.getData(scene, Route.PIVOT);

    // then
    expect(data).toBeUndefined();
  });

  it('#getData should return data when data exists', () => {

    // given
    scene.config = config;

    // when
    const data = configService.getData(scene, fakeConfigRecord.name);

    // then
    expect(data).toBe(fakeConfigRecord.data);
  });

  it('#saveData should insert config', () => {

    // given
    const data = { x: 'one', y: 'two' };
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = configService.saveData(scene, Route.GRID, data);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'Data has been saved' }));
    expect(configService.getData(scene, Route.GRID)).toEqual(data);
  });

  it('#saveData should update config with added data', () => {

    // given
    const data = { x: 'one', y: 'two' };
    scene.config = config;
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = configService.saveData(scene, Route.PIVOT, data);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'Data has been saved' }));
    expect(configService.getData(scene, fakeConfigRecord.name)).toEqual(fakeConfigRecord.data);
    expect(configService.getData(scene, Route.PIVOT)).toEqual(data);
  });

  it('#saveData should update config with changed view', () => {

    // given
    const data = { x: 'one', y: 'two' };
    scene.config = config;
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = configService.saveData(scene, fakeConfigRecord.name, data);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'Data has been saved' }));
    expect(configService.getData(scene, fakeConfigRecord.name)).toEqual(data);
  });

  it('#saveData should return error status when server returns error', () => {

    // given
    scene.config = config;
    spyOn(dbService, 'updateScene').and.returnValue(Promise.reject('Scene cannot be updated'));

    // when
    const status$ = configService.saveData(scene, Route.PIVOT, {});

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.ERROR, msg: 'Data cannot be saved: Scene cannot be updated' }));
  });

  it('#getView should return undefined when view is missing', () => {

    // given
    scene.config = config;

    // when
    const view = configService.getView(scene, Route.FLEX);

    // then
    expect(view).toBeUndefined();
  });

  it('#getView should return view when view exists', () => {

    // given
    scene.config = config;

    // when
    const view = configService.getView(scene, Route.GRID);

    // then
    expect(view).toEqual(gridView);
  });

  it('#saveView should update config with added view', () => {

    // given
    scene.config = config;
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = configService.saveView(scene, flexView);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'View has been saved' }));
    expect(configService.getView(scene, Route.FLEX)).toEqual(flexView);
    expect(configService.getView(scene, Route.GRID)).toEqual(gridView);
  });

  it('#saveView should update config with changed view', () => {

    // given
    scene.config = config;
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = configService.saveView(scene, gridView);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'View has been saved' }));
    expect(configService.getView(scene, Route.GRID)).toEqual(gridView);
  });

  it('#saveView should return error status when server returns error', () => {

    // given
    scene.config = config;
    spyOn(dbService, 'updateScene').and.returnValue(Promise.reject('Scene cannot be updated'));

    // when
    const status$ = configService.saveView(scene, gridView);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.ERROR, msg: 'View cannot be saved: Scene cannot be updated' }));
  });

  function createColumn(name: string, dataType: DataType): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10
    };
  }

  function createScene(): Scene {
    return {
      _id: '1',
      _rev: 'r1',
      creationTime: new Date().getTime(),
      name: 'Test Scene',
      shortDescription: 'Test Scene Short Description',
      columns: [],
      database: 'db',
      config: {
        records: [],
        views: []
      }
    }
  }
});
