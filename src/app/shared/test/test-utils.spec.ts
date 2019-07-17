import { TestUtils } from './test-utils';

describe('TestUtils', () => {

   it('#generateEntries should return few entries', () => {

      // when
      const entries = TestUtils.generateEntries('c', 2, 1, 2);

      // then
      const expected = [{ c: 1 }, { c: 2 }];
      expect(entries).toEqual(expected);
   });

   it('#generateEntries should return many entries', () => {

      // when
      const entries = TestUtils.generateEntries('c', 1_000, -77, 88);

      // then
      expect(entries.length).toBe(1_000);
      expect(entries[0]['c']).toBe(-77);
      expect(entries[entries.length - 1]['c']).toBe(88);
   });

   it('#generateEntries should return few expanded entries', () => {

      // given
      const entries = TestUtils.generateEntries('c1', 2, 1, 2);

      // when
      TestUtils.expandEntries(entries, 'c2', 3, 4);

      // then
      const expected = [
         { c1: 1, c2: 3 },
         { c1: 2, c2: 4 }
      ];
      expect(entries).toEqual(expected);
   });

   it('#generateEntries should return many expanded entries', () => {

      // given
      const entries = TestUtils.generateEntries('c1', 1_000, -77, 88);

      // when
      TestUtils.expandEntries(entries, 'c2', 100, 500);

      // then
      expect(entries.length).toBe(1_000);
      expect(entries[0]['c1']).toBe(-77);
      expect(entries[entries.length - 1]['c1']).toBe(88);
      expect(entries[0]['c2']).toBe(100);
      expect(entries[entries.length - 1]['c2']).toBe(500);
   });

   it('#temporary', () => {
   });

});
