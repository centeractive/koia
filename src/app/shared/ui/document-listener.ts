import { NgZone, Renderer2 } from '@angular/core';

/**
 * @returns a function that removes the listener
 */
export function listenToDocumentOutsideAngular(zone: NgZone, renderer: Renderer2, eventName: string,
   handler: (event: Event) => void): () => void {
   return zone.runOutsideAngular(() => renderer.listen('document', eventName, handler));
}
