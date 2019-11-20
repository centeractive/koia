import { Column, Scene } from '../model';

export class SceneFactory {

   static createScene(id: string, columns: Column[]): Scene {
      return {
        _id: id,
        creationTime: new Date().getTime(),
        name: 'Scene ' + id,
        shortDescription: 'Scene ' + id + ' Short Description',
        columnMappings: undefined,
        columns: columns,
        database: 'test_data_' + id,
        config: {
          records: [],
          views: []
        }
      };
    }
}
