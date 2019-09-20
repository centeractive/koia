import { QueryParamExtractor } from './query-param-extractor';
import { QueryParams } from '../test';
import { Protocol } from '../model';

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
      params.set(QueryParamExtractor.PROTOCOL, 'HTTP');
      params.set(QueryParamExtractor.HOST, 'localhost');
      params.set(QueryParamExtractor.PORT, '5984');
      params.set(QueryParamExtractor.USER, 'test');
      const extractor = new QueryParamExtractor(params);

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo).toBeUndefined();
   });

   it('#getCouchDBConnectionInfo should return connection to local CouchDB', () => {

      // given
      const params = new QueryParams();
      params.set(QueryParamExtractor.PROTOCOL, 'HTTP');
      params.set(QueryParamExtractor.HOST, 'localhost');
      params.set(QueryParamExtractor.PORT, '5984');
      params.set(QueryParamExtractor.USER, 'test');
      params.set(QueryParamExtractor.PASSWORD, btoa('secret'));
      const extractor = new QueryParamExtractor(params);

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo).toBeDefined();
      expect(connectionInfo.protocol).toBe(Protocol.HTTP);
      expect(connectionInfo.host).toBe('localhost');
      expect(connectionInfo.port).toBe(5984);
      expect(connectionInfo.user).toBe('test');
      expect(connectionInfo.password).toBe('secret');
   });

   it('#getCouchDBConnectionInfo should return connection to remote CouchDB', () => {

      // given
      const params = new QueryParams();
      params.set(QueryParamExtractor.PROTOCOL, 'HTTPS');
      params.set(QueryParamExtractor.HOST, 'server1');
      params.set(QueryParamExtractor.PORT, '6984');
      params.set(QueryParamExtractor.USER, 'test');
      params.set(QueryParamExtractor.PASSWORD, btoa('secret'));
      const extractor = new QueryParamExtractor(params);

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo).toBeDefined();
      expect(connectionInfo.protocol).toBe(Protocol.HTTPS);
      expect(connectionInfo.host).toBe('server1');
      expect(connectionInfo.port).toBe(6984);
      expect(connectionInfo.user).toBe('test');
      expect(connectionInfo.password).toBe('secret');
   });

   it('#getSceneID should return null when parameter is missing', () => {

      // given
      const extractor = new QueryParamExtractor(new QueryParams());

      // when
      const sceneID = extractor.getSceneID();

      // then
      expect(sceneID).toBeNull();
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
