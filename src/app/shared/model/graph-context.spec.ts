import { fakeAsync, flush } from '@angular/core/testing';
import { GraphContext } from './graph-context';
import { ChangeEvent } from './change-event.enum';
import { Column } from './column.type';
import { DataType } from './data-type.enum';

describe('GraphContext', () => {

   let columns: Column[];
   let context: GraphContext;
   let eventHandlerSpy: jasmine.Spy;

   beforeAll(() => {
      columns = [
         { name: 'Location', dataType: DataType.TEXT, width: 1 },
         { name: 'Name', dataType: DataType.TEXT, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
   });

   beforeEach(() => {
      context = new GraphContext(columns);
      eventHandlerSpy = jasmine.createSpy('eventHandler').and.callFake(e => null);
      context.subscribeToChanges(eventHandlerSpy);
   });

   it('#linkStrength should not fire look change event when linkStrength is not changed', fakeAsync(() => {

      // when
      context.linkStrength = context.linkStrength;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#linkStrength should fire look change event when linkStrength is changed', fakeAsync(() => {

      // when
      context.linkStrength = 99;
      flush();

      // then
      expect(context.linkStrength).toBe(99);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#friction should not fire look change event when friction is not changed', fakeAsync(() => {

      // when
      context.friction = context.friction;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#friction should fire look change event when friction is changed', fakeAsync(() => {

      // when
      context.friction = 99;
      flush();

      // then
      expect(context.friction).toBe(99);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#linkDist should not fire look change event when linkDist is not changed', fakeAsync(() => {

      // when
      context.linkDist = context.linkDist;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#linkDist should fire look change event when linkDist is changed', fakeAsync(() => {

      // when
      context.linkDist = 99;
      flush();

      // then
      expect(context.linkDist).toBe(99);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#charge should not fire look change event when charge is not changed', fakeAsync(() => {

      // when
      context.charge = context.charge;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#charge should fire look change event when charge is changed', fakeAsync(() => {

      // when
      context.charge = 99;
      flush();

      // then
      expect(context.charge).toBe(99);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#gravity should not fire look change event when gravity is not changed', fakeAsync(() => {

      // when
      context.gravity = context.gravity;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#gravity should fire look change event when gravity is changed', fakeAsync(() => {

      // when
      context.gravity = 99;
      flush();

      // then
      expect(context.gravity).toBe(99);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#theta should not fire look change event when theta is not changed', fakeAsync(() => {

      // when
      context.theta = context.theta;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#theta should fire look change event when theta is changed', fakeAsync(() => {

      // when
      context.theta = 99;
      flush();

      // then
      expect(context.theta).toBe(99);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#alpha should not fire look change event when alpha is not changed', fakeAsync(() => {

      // when
      context.alpha = context.alpha;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#alpha should fire look change event when alpha is changed', fakeAsync(() => {

      // when
      context.alpha = 99;
      flush();

      // then
      expect(context.alpha).toBe(99);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#getTitle when no group-by column defined', () => {
      expect(context.getTitle()).toBe('Relationship: to be defined');
   });

   it('#getTitle when single group-by column defined', () => {

      // given
      context.groupByColumns = [column('Name')];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Relationship: Root 🠞 Name');
   });

   it('#getTitle when multiple group-by column defined', () => {

      // given
      context.groupByColumns = [column('Location'), column('Name'), column('Amount')];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Relationship: Root 🠞 Location 🠞 Name 🠞 Amount');
   });

   it('#getTitle when user-defined', () => {

      // given
      context.title = 'test title';

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('test title');
   });

   it('#getSupportedExportFormats should return empty array', () => {
      expect(context.getSupportedExportFormats()).toEqual([]);
   });

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }
});
