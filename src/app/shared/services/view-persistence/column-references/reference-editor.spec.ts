import { ChangeLog } from './change-log';
import { ReferenceEditor } from './reference-editor';

describe('ReferenceEditor', () => {

   let log: ChangeLog;
   let renamer: ReferenceEditor;
   let remover: ReferenceEditor;

   beforeEach(() => {
      log = new ChangeLog();
      renamer = new ReferenceEditor('Share', 'Ratio', log);
      remover = new ReferenceEditor('Share', undefined, log);
   });

   it('#editNamed should rename matching items in place', () => {

      // given
      const share = { name: 'Share' };
      const target = { columns: [share, { name: 'Amount' }] };
      const columns = target.columns;

      // when
      renamer.editNamed(target, 'columns', 'name');

      // then
      expect(target.columns).toBe(columns);
      expect(target.columns).toEqual([{ name: 'Ratio' }, { name: 'Amount' }]);
      expect(target.columns[0]).toBe(share);
   });

   it('#editNamed should replace array with copy without matching items on removal', () => {

      // given
      const amount = { name: 'Amount' };
      const columns = [{ name: 'Share' }, amount];
      const target = { columns };

      // when
      remover.editNamed(target, 'columns', 'name');

      // then
      expect(target.columns).toEqual([amount]);
      expect(columns).toEqual([{ name: 'Share' }, amount]);
   });

   it('#editNamed should record changes in log', () => {

      // given
      const renamed = { columns: [{ name: 'Share' }] };
      const removed = { columns: [{ name: 'Share' }] };
      renamer.editNamed(renamed, 'columns', 'name');
      remover.editNamed(removed, 'columns', 'name');

      // when
      log.undo();

      // then
      expect(renamed).toEqual({ columns: [{ name: 'Share' }] });
      expect(removed).toEqual({ columns: [{ name: 'Share' }] });
   });

   it('#editNamed should leave array untouched when nothing matches', () => {

      // given
      const columns = [{ name: 'Amount' }];
      const target = { columns };

      // when
      remover.editNamed(target, 'columns', 'name');
      renamer.editNamed(target, 'columns', 'name');

      // then
      expect(target.columns).toBe(columns);
      expect(target.columns).toEqual([{ name: 'Amount' }]);
   });

   it('#editNamed should ignore missing array', () => {

      // given
      const target = {};

      // when
      renamer.editNamed(target, 'columns', 'name');
      remover.editNamed(target, 'columns', 'name');

      // then
      expect(target).toEqual({});
   });

   it('#editNames should rename matching names', () => {

      // given
      const target = { rows: ['Share', 'Amount'] };

      // when
      renamer.editNames(target, 'rows');

      // then
      expect(target.rows).toEqual(['Ratio', 'Amount']);
   });

   it('#editNames should remove matching names', () => {

      // given
      const target = { rows: ['Share', 'Amount'] };

      // when
      remover.editNames(target, 'rows');

      // then
      expect(target.rows).toEqual(['Amount']);
   });

   it('#editNames should record changes in log', () => {

      // given
      const target = { rows: ['Share', 'Amount'] };
      renamer.editNames(target, 'rows');

      // when
      log.undo();

      // then
      expect(target.rows).toEqual(['Share', 'Amount']);
   });

   it('#editNames should leave array untouched when nothing matches', () => {

      // given
      const rows = ['Amount'];
      const target = { rows };

      // when
      remover.editNames(target, 'rows');

      // then
      expect(target.rows).toBe(rows);
      expect(target.rows).toEqual(['Amount']);
   });

   it('#editNames should ignore missing array', () => {

      // given
      const target = {};

      // when
      renamer.editNames(target, 'rows');

      // then
      expect(target).toEqual({});
   });

   it('#editKey should move key', () => {

      // given
      const record = { Share: 50, Amount: 20 };

      // when
      renamer.editKey(record);

      // then
      expect(record).toEqual({ Ratio: 50, Amount: 20 });
   });

   it('#editKey should delete key on removal', () => {

      // given
      const record = { Share: 50, Amount: 20 };

      // when
      remover.editKey(record);

      // then
      expect(record).toEqual({ Amount: 20 });
   });

   it('#editKey should record changes in log', () => {

      // given
      const record = { Share: 50, Ratio: 30 };
      renamer.editKey(record);

      // when
      log.undo();

      // then
      expect(record).toEqual({ Share: 50, Ratio: 30 });
   });

   it('#editKey should ignore missing key', () => {

      // given
      const record = { Amount: 20 };

      // when
      renamer.editKey(record);

      // then
      expect(record).toEqual({ Amount: 20 });
   });

   it('#editKey should ignore undefined record', () => {

      // when
      const editKey = () => renamer.editKey(undefined);

      // then
      expect(editKey).not.toThrow();
   });
});
