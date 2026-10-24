import { PlatformLocation } from '@angular/common';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryParams } from 'app/shared/test';
import { QueryParamExtractor } from 'app/shared/utils';
import { LaunchParamsService, provideLaunchParams } from './launch-params.service';

const LAUNCH_HASH = '#host=server1&user=a%26b&pw=Pj8%2B&scene_id=7';

function serviceOf(hash: string): LaunchParamsService {
   return new LaunchParamsService({ hash } as PlatformLocation);
}

describe('LaunchParamsService', () => {

   let queryParams: QueryParams;

   beforeEach(() => {
      queryParams = new QueryParams();
      queryParams.set(QueryParamExtractor.HOST, 'query-host');
   });

   it('#paramsOf should return params of loaded fragment while router shows it', () => {

      // given
      const service = serviceOf(LAUNCH_HASH);

      // when
      const params = service.paramsOf(queryParams, decodeURIComponent(LAUNCH_HASH.substring(1)));

      // then
      expect(params.get(QueryParamExtractor.HOST)).toBe('server1');
      expect(params.get(QueryParamExtractor.USER)).toBe('a&b');
      expect(params.get(QueryParamExtractor.PASSWORD)).toBe('Pj8+');
      expect(params.get(QueryParamExtractor.SCENE_ID)).toBe('7');
   });

   it('#paramsOf should return query params when router shows no fragment', () => {

      // given
      const service = serviceOf(LAUNCH_HASH);

      // when
      const params = service.paramsOf(queryParams, null);

      // then
      expect(params).toBe(queryParams);
   });

   it('#paramsOf should return query params when router shows another fragment', () => {

      // given
      const service = serviceOf(LAUNCH_HASH);

      // when
      const params = service.paramsOf(queryParams, 'top');

      // then
      expect(params).toBe(queryParams);
   });

   it('#paramsOf should return query params when loaded fragment carries no host', () => {

      // given
      const service = serviceOf('#top');

      // when
      const params = service.paramsOf(queryParams, 'top');

      // then
      expect(params).toBe(queryParams);
   });

   it('#paramsOf should return query params when loaded fragment is malformed', () => {

      // given
      const service = serviceOf('#host=%E0');

      // when
      const params = service.paramsOf(queryParams, null);

      // then
      expect(params).toBe(queryParams);
   });

   it('provideLaunchParams should create service during app initialization', async () => {

      // given
      const hash = vi.fn().mockReturnValue('');
      const platformLocation = { get hash() { return hash(); } };
      TestBed.configureTestingModule({ providers: [provideLaunchParams(), { provide: PlatformLocation, useValue: platformLocation }] });

      // when
      await TestBed.inject(ApplicationInitStatus).donePromise;

      // then
      expect(hash).toHaveBeenCalledTimes(1);
   });
});
