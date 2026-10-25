import { DefaultUrlSerializer } from '@angular/router';
import { QueryParamExtractor } from './query-param-extractor';
import { QueryParams } from '../test';
import { Protocol } from '../model';

function connectionParams(port: string, password: string): QueryParams {
   const params = new QueryParams();
   params.set(QueryParamExtractor.HOST, 'localhost');
   params.set(QueryParamExtractor.PORT, port);
   params.set(QueryParamExtractor.USER, 'test');
   params.set(QueryParamExtractor.PASSWORD, password);
   return params;
}

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

   it('#getCouchDBConnectionInfo should decode UTF-8 password', () => {

      // given
      const extractor = new QueryParamExtractor(connectionParams('5984', 'cMOk5pel5pys'));

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo.password).toBe('pä日本');
   });

   it('#getCouchDBConnectionInfo should decode windows-1252 password', () => {

      // given
      const extractor = new QueryParamExtractor(connectionParams('5984', '/IA='));

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo.password).toBe('ü€');
   });

   it('#getCouchDBConnectionInfo should decode password whose raw plus became space', () => {

      // given
      const params = new DefaultUrlSerializer().parse('/?host=localhost&port=5984&user=test&pw=Pj8+').queryParamMap;
      const extractor = new QueryParamExtractor(params);

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo.password).toBe('>?>');
   });

   it.each(['abc', '5984x', '-1', '0', '65536', '59.84', ' 5984'])('#getCouchDBConnectionInfo should throw when port is "%s"', port => {

      // given
      const extractor = new QueryParamExtractor(connectionParams(port, btoa('secret')));

      // when
      const getConnectionInfo = () => extractor.getCouchDBConnectionInfo();

      // then
      expect(getConnectionInfo).toThrow('invalid port: ' + port);
   });

   it.each(['1', '65535'])('#getCouchDBConnectionInfo should accept port %s', port => {

      // given
      const extractor = new QueryParamExtractor(connectionParams(port, btoa('secret')));

      // when
      const connectionInfo = extractor.getCouchDBConnectionInfo();

      // then
      expect(connectionInfo.port).toBe(Number(port));
   });

   it('#getCouchDBConnectionInfo should throw when password is not Base64 encoded', () => {

      // given
      const extractor = new QueryParamExtractor(connectionParams('5984', 'a!'));

      // when
      const getConnectionInfo = () => extractor.getCouchDBConnectionInfo();

      // then
      expect(getConnectionInfo).toThrow('invalid pw: not Base64 encoded');
   });

   it('#hasCouchDBConnectionParams should return true when parameters are complete', () => {

      // given
      const extractor = new QueryParamExtractor(connectionParams('5984x', 'a!'));

      // when
      const hasParams = extractor.hasCouchDBConnectionParams();

      // then
      expect(hasParams).toBe(true);
   });

   it('#hasCouchDBConnectionParams should return false when password is missing', () => {

      // given
      const params = new QueryParams();
      params.set(QueryParamExtractor.HOST, 'localhost');
      params.set(QueryParamExtractor.PORT, '5984');
      params.set(QueryParamExtractor.USER, 'test');
      const extractor = new QueryParamExtractor(params);

      // when
      const hasParams = extractor.hasCouchDBConnectionParams();

      // then
      expect(hasParams).toBe(false);
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
