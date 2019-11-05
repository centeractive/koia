import { ConfinedStringSet } from './confined-string-set';

describe('ConfinedStringSet', () => {

   const LIMIT = 3;
   let confinedStringSet: ConfinedStringSet;

   beforeEach(() => {
      confinedStringSet = new ConfinedStringSet(LIMIT);
   });

   it('#addAll should add all values when limit is not reached', () => {

      // when
      confinedStringSet.addAll(['a', 'b', 'a', 'b']);

      // then
      expect(confinedStringSet.toArray()).toEqual(['a', 'b' ]);
      expect(confinedStringSet.size()).toBe(4);
   });

   it('#addAll should add all values when limit is not exceeded', () => {

      // when
      confinedStringSet.addAll(['a', 'b', 'c', 'a', 'b', 'c']);

      // then
      expect(confinedStringSet.toArray()).toEqual(['a', 'b', 'c' ]);
      expect(confinedStringSet.size()).toBe(6);
   });

   it('#addAll should add values that do not exceed limit', () => {

      // when
      confinedStringSet.addAll(['a', 'b', 'c', 'd', 'a', 'b', 'c', 'd']);

      // then
      expect(confinedStringSet.toArray()).toEqual(['a', 'b', 'c' ]);
      expect(confinedStringSet.size()).toBe(8);
   });

   it('#addAll should not add all values when limit is exeeding', () => {

      // given
      confinedStringSet.addAll(['a', 'b']);

      // when
      confinedStringSet.addAll(['c', 'd']);

      // then
      expect(confinedStringSet.toArray()).toEqual(['a', 'b', 'c' ]);
      expect(confinedStringSet.size()).toBe(4);
   });

   it('#addAll should not add values when limit is exeeded', () => {

      // given
      confinedStringSet.addAll(['a', 'b', 'c']);

      // when
      confinedStringSet.addAll(['d']);

      // then
      expect(confinedStringSet.toArray()).toEqual(['a', 'b', 'c' ]);
      expect(confinedStringSet.size()).toBe(4);
   });

   it('#add should add value when set is empty', () => {

      // when
      confinedStringSet.add('a');

      // then
      expect(confinedStringSet.toArray()).toEqual(['a']);
      expect(confinedStringSet.size()).toBe(1);
   });

   it('#add should add value when limit is not exceeded', () => {

      // given
      confinedStringSet.addAll(['a', 'b']);

      // when
      confinedStringSet.add('c');

      // then
      expect(confinedStringSet.toArray()).toEqual(['a', 'b', 'c']);
      expect(confinedStringSet.size()).toBe(3);
   });

   it('#add should not add value when limit is exceeded', () => {

      // given
      confinedStringSet.addAll(['a', 'b', 'c']);

      // when
      confinedStringSet.add('d');

      // then
      expect(confinedStringSet.toArray()).toEqual(['a', 'b', 'c']);
      expect(confinedStringSet.size()).toBe(4);
   });

   it('#add should not add value when already contained', () => {

      // given
      confinedStringSet.addAll(['a', 'b']);

      // when
      confinedStringSet.add('a');

      // then
      expect(confinedStringSet.toArray()).toEqual(['a', 'b']);
      expect(confinedStringSet.size()).toBe(3);
   });

   it('#size should return zero when set is empty', () => {
      expect(confinedStringSet.size()).toBe(0);
   });

   it('#isEmpty should 1 when value was added', () => {
      confinedStringSet.add('a');

      expect(confinedStringSet.size()).toBe(1);
   });

   it('#clear should clear set', () => {

      // given
      confinedStringSet.addAll(['a', 'b', 'c', 'd']);

      // when
      confinedStringSet.clear();

      // then
      expect(confinedStringSet.size()).toBe(0);
      expect(confinedStringSet.toArray()).toEqual([]);
      expect(confinedStringSet.toString()).toBe('');
   });

   it('#toString should list values when set was not exceeded', () => {

      // given
      confinedStringSet.addAll(['a', 'b', 'c']);

      // when
      const result = confinedStringSet.toString();

      // then
      expect(result).toBe('a\nb\nc');
   });

   it('#toString should list values when set was exceeded', () => {

      // given
      confinedStringSet.addAll(['a', 'b', 'c', 'd']);

      // when
      const result = confinedStringSet.toString();

      // then
      expect(result).toBe('a\nb\nc\n...');
   });
});
