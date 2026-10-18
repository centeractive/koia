import { fakeAsync, flush } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { ChangeEvent } from './change-event.enum';
import { SummaryContext } from './summary-context';
import { TextBoxContext } from './text-box-context';

describe('TextBoxContext', () => {

   let context: TextBoxContext;
   let eventHandlerSpy: Mock;

   beforeEach(() => {
      context = new TextBoxContext([]);
      eventHandlerSpy = vi.fn();
      context.subscribeToChanges(eventHandlerSpy);
   });

   it('#constructor should initialize defaults', () => {

      // when
      const textBoxContext = new TextBoxContext([]);

      // then
      expect([textBoxContext.width, textBoxContext.height]).toEqual([300, 150]);
      expect(textBoxContext.content).toBeUndefined();
      expect(textBoxContext.backgroundColor).toBeUndefined();
      expect(textBoxContext.getTitle()).toBe('');
      expect(textBoxContext.anchor).toBeUndefined();
      expect(textBoxContext.anchorOffset).toBeUndefined();
      expect(textBoxContext.tiled).toBe(false);
      expect(textBoxContext.bordered).toBe(false);
      expect(textBoxContext.fitHeight).toBeUndefined();
   });

   it('should define minimum size smaller than tile minimum size', () => {
      expect([TextBoxContext.MIN_WIDTH, TextBoxContext.MIN_HEIGHT]).toEqual([40, 30]);
   });

   it('#isOverlay should return true for note', () => {

      // when
      const overlay = context.isOverlay();

      // then
      expect(overlay).toBe(true);
   });

   it('#isOverlay should return false for text tile', () => {

      // given
      const textTile = new TextBoxContext([], true);

      // when
      const overlay = textTile.isOverlay();

      // then
      expect(overlay).toBe(false);
      expect(textTile.tiled).toBe(true);
   });

   it('#bordered should fire look change event once when changed', fakeAsync(() => {

      // when
      context.bordered = true;
      flush();

      // then
      expect(context.bordered).toBe(true);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#bordered should not fire change event when unchanged', fakeAsync(() => {

      // when
      context.bordered = false;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#fitHeight should not fire change event', fakeAsync(() => {

      // when
      context.fitHeight = 200;
      flush();

      // then
      expect(context.fitHeight).toBe(200);
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#setAnchor should set anchor and offset without firing change event', fakeAsync(() => {

      // given
      const anchor = new SummaryContext([]);

      // when
      context.setAnchor(anchor, { x: 0.25, y: 0.5 });
      flush();

      // then
      expect(context.anchor).toBe(anchor);
      expect(context.anchorOffset).toEqual({ x: 0.25, y: 0.5 });
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#clearAnchor should remove anchor and offset', () => {

      // given
      context.setAnchor(new SummaryContext([]), { x: 0.25, y: 0.5 });

      // when
      context.clearAnchor();

      // then
      expect(context.anchor).toBeUndefined();
      expect(context.anchorOffset).toBeUndefined();
   });

   it('#getTitle should return title', () => {

      // given
      context.title = 'Notes';

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Notes');
   });

   it('#getSupportedExportFormats should return empty array', () => {

      // when
      const formats = context.getSupportedExportFormats();

      // then
      expect(formats).toEqual([]);
   });

   it('#isConfigurable should return false', () => {

      // when
      const configurable = context.isConfigurable();

      // then
      expect(configurable).toBe(false);
   });

   it('#content should fire look change event once when changed', fakeAsync(() => {

      // given
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };

      // when
      context.content = content;
      flush();

      // then
      expect(context.content).toBe(content);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#content should not fire change event when content is equal', fakeAsync(() => {

      // given
      context.content = { type: 'doc', content: [{ type: 'paragraph' }] };
      flush();
      eventHandlerSpy.mockClear();

      // when
      context.content = { type: 'doc', content: [{ type: 'paragraph' }] };
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#backgroundColor should fire look change event once when changed', fakeAsync(() => {

      // when
      context.backgroundColor = '#ff0000';
      flush();

      // then
      expect(context.backgroundColor).toBe('#ff0000');
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#backgroundColor should not fire change event when color is unchanged', fakeAsync(() => {

      // given
      context.backgroundColor = '#ff0000';
      flush();
      eventHandlerSpy.mockClear();

      // when
      context.backgroundColor = '#ff0000';
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));
});
