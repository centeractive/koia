import { ChangeLog } from './change-log';

describe('ChangeLog', () => {

   let log: ChangeLog;

   beforeEach(() => {
      log = new ChangeLog();
   });

   it('#set should set value', () => {

      // given
      const target = { a: 1 };

      // when
      log.set(target, 'a', 2);

      // then
      expect(target).toEqual({ a: 2 });
   });

   it('#delete should delete key', () => {

      // given
      const target = { a: 1, b: 2 };

      // when
      log.delete(target, 'a');

      // then
      expect(target).toEqual({ b: 2 });
   });

   it('#undo should restore changed value', () => {

      // given
      const target = { a: 1 };
      log.set(target, 'a', 2);

      // when
      log.undo();

      // then
      expect(target).toEqual({ a: 1 });
   });

   it('#undo should delete key that was absent before', () => {

      // given
      const target: Record<string, number> = { a: 1 };
      log.set(target, 'b', 2);

      // when
      log.undo();

      // then
      expect(target).toEqual({ a: 1 });
      expect(Object.hasOwn(target, 'b')).toBe(false);
   });

   it('#undo should restore deleted key', () => {

      // given
      const target = { a: 1, b: 2 };
      log.delete(target, 'a');

      // when
      log.undo();

      // then
      expect(target).toEqual({ a: 1, b: 2 });
   });

   it('#undo should undo latest change first', () => {

      // given
      const target: Record<string, number> = { a: 1 };
      log.set(target, 'a', 2);
      log.set(target, 'a', 3);
      log.set(target, 'b', 4);
      log.delete(target, 'b');

      // when
      log.undo();

      // then
      expect(target).toEqual({ a: 1 });
      expect(Object.hasOwn(target, 'b')).toBe(false);
   });

   it('#undo should not undo changes twice', () => {

      // given
      const target = { a: 1 };
      log.set(target, 'a', 2);
      log.undo();
      target.a = 3;

      // when
      log.undo();

      // then
      expect(target).toEqual({ a: 3 });
   });
});
