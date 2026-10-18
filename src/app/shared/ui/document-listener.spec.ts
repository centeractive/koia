import { NgZone, Renderer2, RendererFactory2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { listenToDocumentOutsideAngular } from './document-listener';

describe('listenToDocumentOutsideAngular', () => {

   let zone: NgZone;
   let renderer: Renderer2;
   let removeListener: () => void;

   beforeEach(() => {
      zone = TestBed.inject(NgZone);
      renderer = TestBed.inject(RendererFactory2).createRenderer(null, null);
   });

   afterEach(() => removeListener?.());

   it('should register listener outside Angular zone', () => {

      // given
      let inAngularZone: boolean;
      const listen = renderer.listen.bind(renderer);
      const listenSpy = vi.spyOn(renderer, 'listen').mockImplementation((target, eventName, callback) => {
         inAngularZone = NgZone.isInAngularZone();
         return listen(target, eventName, callback);
      });

      // when
      removeListener = zone.run(() => listenToDocumentOutsideAngular(zone, renderer, 'pointerdown', () => null));

      // then
      expect(listenSpy).toHaveBeenCalledExactlyOnceWith('document', 'pointerdown', expect.any(Function));
      expect(inAngularZone).toBe(false);
   });

   it('should invoke handler outside Angular zone on document event', () => {

      // given
      const handler = vi.fn(() => NgZone.isInAngularZone());
      removeListener = zone.run(() => listenToDocumentOutsideAngular(zone, renderer, 'pointerdown', handler));
      const event = new Event('pointerdown');

      // when
      document.dispatchEvent(event);

      // then
      expect(handler).toHaveBeenCalledExactlyOnceWith(event);
      expect(handler).toHaveReturnedWith(false);
   });

   it('should remove listener when returned function is called', () => {

      // given
      const handler = vi.fn();
      listenToDocumentOutsideAngular(zone, renderer, 'pointerdown', handler)();

      // when
      document.dispatchEvent(new Event('pointerdown'));

      // then
      expect(handler).not.toHaveBeenCalled();
   });
});
