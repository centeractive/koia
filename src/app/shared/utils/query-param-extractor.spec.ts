import { ParamMap } from '@angular/router';
import { QueryParamExtractor } from './query-param-extractor';
import { QueryParams } from '../test';

describe('QueryParamExtractor', () => {

   it('#getCouchDBConnectionInfo should return undefined when parameters are missing', () => {

      // given
      const extractor = new QueryParamExtractor(new QueryParams());

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo).toBeUndefined();
   });

   it('#getCouchDBConnectionInfo should return undefined when parameters are incomplete', () => {

      // given
      const params = new QueryParams();
      params.set(QueryParamExtractor.HOST, 'localhost');
      params.set(QueryParamExtractor.PORT, '5984');
      params.set(QueryParamExtractor.USER, 'test');
      const extractor = new QueryParamExtractor(params);

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo).toBeUndefined();
   });

   it('#getCouchDBConnectionInfo should return connection inf when parameters are complete', () => {

      // given
      const params = new QueryParams();
      params.set(QueryParamExtractor.HOST, 'localhost');
      params.set(QueryParamExtractor.PORT, '5984');
      params.set(QueryParamExtractor.USER, 'test');
      params.set(QueryParamExtractor.PASSWORD, btoa('secret'));
      const extractor = new QueryParamExtractor(params);

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo).toBeDefined();
      expect(connectionInfo.host).toBe('localhost');
      expect(connectionInfo.port).toBe(5984);
      expect(connectionInfo.user).toBe('test');
      expect(connectionInfo.password).toBe('secret');
   });

   it('#getSceneID should return undefined when parameter is missing', () => {

      // given
      const extractor = new QueryParamExtractor(new QueryParams());

      // when
      const sceneID = extractor.getSceneID();

      // then
      expect(sceneID).toBeUndefined();
   });

   it('#getSceneID should return scene ID when parameter is present', () => {

      // given
      const params = new QueryParams();
      params.set(QueryParamExtractor.SCENE_ID, '1234');
      const extractor = new QueryParamExtractor(params);

      // when
      const sceneID = extractor.getSceneID();

      // then
      expect(sceneID).toBe('1234');
   });
});
