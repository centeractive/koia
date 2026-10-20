import { Query, Scene } from '../../model';
import { RawDataState } from '../../model/view-config';
import { SceneFactory } from '../../test';
import { DBService } from '../backend';
import { queryToQueryDef } from '../view-persistence/filter/query-to-filter-converter';
import { createDefaultRawDataState } from '../view-persistence/raw-data-state-factory';
import { RawDataStateProvider } from './raw-data-state-provider.type';
import { RawDataStateService } from './raw-data-state.service';
import type { Mock } from 'vitest';

describe('RawDataStateService', () => {

   let scene: Scene;
   let dbService: DBService;
   let getActiveSceneSpy: Mock;
   let service: RawDataStateService;

   beforeEach(() => {
      scene = SceneFactory.createScene('1', []);
      dbService = new DBService(null);
      getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
      service = new RawDataStateService(dbService);
   });

   it('#current should provide state of registered provider', () => {

      // given
      const providerState = state(false);
      service.register(provider(providerState));

      // when
      const current = service.current();

      // then
      expect(current).toBe(providerState);
   });

   it('#current should provide pending state of active scene when no provider is registered', () => {

      // given
      const pendingState = state(false);
      service.apply(pendingState);

      // when
      const current = service.current();

      // then
      expect(current).toBe(pendingState);
   });

   it('#current should ignore pending state of other scene', () => {

      // given
      service.apply(state(false));
      getActiveSceneSpy.mockReturnValue(SceneFactory.createScene('2', []));

      // when
      const current = service.current();

      // then
      expect(current).toEqual(createDefaultRawDataState());
   });

   it('#current should provide default state when neither provider nor pending state exists', () => {

      // when
      const current = service.current();

      // then
      expect(current).toEqual(createDefaultRawDataState());
   });

   it('#apply should apply state to registered provider', () => {

      // given
      const registered = provider(state(true));
      service.register(registered);
      const appliedState = state(false);

      // when
      service.apply(appliedState);

      // then
      expect(registered.applyRawDataState).toHaveBeenCalledWith(appliedState);
   });

   it('#apply should keep state pending when no provider is registered', () => {

      // given
      const appliedState = state(false);

      // when
      service.apply(appliedState);

      // then
      expect(service.register(provider(state(true)))).toBe(appliedState);
   });

   it('#register should return and drop pending state', () => {

      // given
      const pendingState = state(false);
      service.apply(pendingState);

      // when
      const adopted = service.register(provider(state(true)));

      // then
      expect(adopted).toBe(pendingState);
      expect(service.register(provider(state(true)))).toBeUndefined();
   });

   it('#register should return undefined when no state is pending', () => {

      // when
      const adopted = service.register(provider(state(true)));

      // then
      expect(adopted).toBeUndefined();
   });

   it('#register should not adopt pending state of other scene', () => {

      // given
      service.apply(state(false));
      getActiveSceneSpy.mockReturnValue(SceneFactory.createScene('2', []));

      // when
      const adopted = service.register(provider(state(true)));

      // then
      expect(adopted).toBeUndefined();
   });

   it('#unregister should drop registered provider', () => {

      // given
      const registered = provider(state(false));
      service.register(registered);

      // when
      service.unregister(registered);

      // then
      expect(service.current()).toEqual(createDefaultRawDataState());
   });

   it('#unregister should ignore provider that is not registered', () => {

      // given
      const providerState = state(false);
      service.register(provider(providerState));

      // when
      service.unregister(provider(state(true)));

      // then
      expect(service.current()).toBe(providerState);
   });

   function state(highlight: boolean): RawDataState {
      return { query: queryToQueryDef(new Query()), data: { considerColumnWidths: true, highlight } };
   }

   function provider(providerState: RawDataState): RawDataStateProvider {
      return { rawDataState: () => providerState, applyRawDataState: vi.fn() };
   }
});
