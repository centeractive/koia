import { fakeAsync, getTestBed, tick } from '@angular/core/testing';
import { installJQueryPlugins, resetTestDoubles } from './test-environment';

describe('test-environment', () => {

   it('#installJQueryPlugins should expose global jQuery on target', async () => {

      // given
      const target: Record<string, unknown> = {};

      // when
      await installJQueryPlugins(target);

      // then
      expect(target['jQuery']).toBe(globalThis['jQuery']);
      expect(target['$']).toBe(globalThis['jQuery']);
   });

   it('#installJQueryPlugins should provide pivottable and jquery-ui plugins', async () => {

      // given
      const target: Record<string, unknown> = {};

      // when
      await installJQueryPlugins(target);

      // then
      const jQuery = target['jQuery'] as { fn: Record<string, unknown> };
      expect(typeof jQuery.fn['pivotUI']).toBe('function');
      expect(typeof jQuery.fn['sortable']).toBe('function');
   });

   it('#resetTestDoubles should restore spied methods', () => {

      // given
      const service = { name: () => 'original' };
      vi.spyOn(service, 'name').mockReturnValue('stub');

      // when
      resetTestDoubles();

      // then
      expect(service.name()).toBe('original');
   });

   it('#resetTestDoubles should reset testing module', () => {

      // given
      const resetTestingModuleSpy = vi.spyOn(getTestBed(), 'resetTestingModule');

      // when
      resetTestDoubles();

      // then
      expect(resetTestingModuleSpy).toHaveBeenCalled();
   });

   it('fakeAsync should control timers in vitest', fakeAsync(() => {

      // given
      let elapsed = false;
      setTimeout(() => elapsed = true, 1000);

      // when
      tick(999);
      const elapsedBeforeDue = elapsed;
      tick(1);

      // then
      expect(elapsedBeforeDue).toBe(false);
      expect(elapsed).toBe(true);
   }));
});
