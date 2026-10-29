import { ColumnPair, DataType } from 'app/shared/model';
import { PatternMasker } from 'app/shared/utils/pattern-masker';
import { IdColumn } from '../column-mapping/mapper';
import { PatternPairs } from './pattern-pairs';

describe('PatternPairs', () => {

   const sample = [
      { Message: 'Request r1 failed', Host: 'node-1', Amount: 1 },
      { Message: 'Request r2 failed', Host: 'node-2', Amount: 2 }
   ];

   let message: ColumnPair;
   let host: ColumnPair;
   let amount: ColumnPair;
   let columnMappings: ColumnPair[];
   let patternPairs: PatternPairs;

   beforeEach(() => {
      message = pairOf('Message', DataType.TEXT);
      host = pairOf('Host', DataType.TEXT);
      amount = pairOf('Amount', DataType.NUMBER);
      columnMappings = [message, host, amount];
      patternPairs = new PatternPairs();
   });

   function pairOf(name: string, dataType: DataType): ColumnPair {
      return { source: { name, dataType, width: 20 }, target: { name, dataType, width: 20 } };
   }

   function pattern(): ColumnPair {
      return columnMappings.find(cp => !!cp.target.patternOf);
   }

   it('#canAdd should allow pattern of free text column only', () => {
      expect(columnMappings.map(cp => patternPairs.canAdd(cp, columnMappings, sample))).toEqual([true, false, false]);
   });

   it('#canAdd should not allow pattern without sample', () => {
      expect(patternPairs.canAdd(message, columnMappings, undefined)).toBe(false);
   });

   it('#canAdd should not allow pattern of skipped column', () => {

      // given
      message.skip = true;

      // when
      const canAdd = patternPairs.canAdd(message, columnMappings, sample);

      // then
      expect(canAdd).toBe(false);
   });

   it('#canAdd should not allow second pattern nor pattern of pattern', () => {

      // given
      patternPairs.add(message, columnMappings, 'pattern');

      // when
      const canAdd = [patternPairs.canAdd(message, columnMappings, sample), patternPairs.canAdd(pattern(), columnMappings, sample)];

      // then
      expect(canAdd).toEqual([false, false]);
   });

   it('#canAdd should allow pattern again when pattern column was deleted', () => {

      // given
      patternPairs.add(message, columnMappings, 'pattern');
      pattern().skip = true;

      // when
      const canAdd = patternPairs.canAdd(message, columnMappings, sample);

      // then
      expect(canAdd).toBe(true);
   });

   it('#canAdd should judge each column once per sample', () => {

      // given
      const suitsColumnSpy = vi.spyOn(PatternMasker, 'suitsColumn');
      const otherSample = [...sample];

      // when
      patternPairs.canAdd(message, columnMappings, sample);
      patternPairs.canAdd(message, columnMappings, sample);
      patternPairs.canAdd(host, columnMappings, sample);
      patternPairs.canAdd(message, columnMappings, otherSample);

      // then
      expect(suitsColumnSpy.mock.calls).toEqual([[sample, 'Message'], [sample, 'Host'], [otherSample, 'Message']]);
   });

   it('#add should insert pattern mapping after message mapping', () => {

      // when
      patternPairs.add(message, columnMappings, 'pattern');

      // then
      expect(columnMappings.map(cp => cp.target.name)).toEqual(['Message', 'Message pattern', 'Host', 'Amount']);
      expect(pattern().source).toEqual(message.source);
      expect(pattern().source).not.toBe(message.source);
      expect(pattern().target).toEqual({ name: 'Message pattern', dataType: DataType.TEXT, width: 20, indexed: true, patternOf: 'Message' });
   });

   it('#add should number name when it is in use', () => {

      // given
      host.target.name = 'Message pattern';

      // when
      patternPairs.add(message, columnMappings, 'pattern');

      // then
      expect(pattern().target.name).toBe('Message pattern (2)');
   });

   it('#updatePatternOf should let pattern refer to renamed message column', () => {

      // given
      patternPairs.add(message, columnMappings, 'pattern');
      message.target.name = 'Text';

      // when
      patternPairs.updatePatternOf(columnMappings);

      // then
      expect(pattern().target.patternOf).toBe('Text');
   });

   it('#updatePatternOf should let pattern refer to source column of deleted message column', () => {

      // given
      patternPairs.add(message, columnMappings, 'pattern');
      message.target.name = 'Text';
      message.skip = true;

      // when
      patternPairs.updatePatternOf(columnMappings);

      // then
      expect(pattern().target.patternOf).toBe('Message');
   });

   it('#updatePatternOf should keep pattern that is not linked', () => {

      // given
      const unlinked = { ...pairOf('Body pattern', DataType.TEXT), target: { name: 'Body pattern', dataType: DataType.TEXT, width: 20, patternOf: 'Body' } };

      // when
      patternPairs.updatePatternOf([unlinked]);

      // then
      expect(unlinked.target.patternOf).toBe('Body');
   });

   it('#link should link pattern to message column it refers to', () => {

      // given
      const patternPair = { source: { ...host.source }, target: { name: 'P', dataType: DataType.TEXT, width: 20, patternOf: 'Host' } };
      host.source.name = 'Other';
      const mappings = [message, host, patternPair];

      // when
      patternPairs.link(mappings);
      host.target.name = 'Server';
      patternPairs.updatePatternOf(mappings);

      // then
      expect(patternPair.target.patternOf).toBe('Server');
   });

   it('#link should link pattern to message column of same source when referred column is missing', () => {

      // given
      const patternPair = { source: { ...message.source }, target: { name: 'P', dataType: DataType.TEXT, width: 20, patternOf: 'Gone' } };
      const mappings = [message, host, patternPair];

      // when
      patternPairs.link(mappings);
      patternPairs.updatePatternOf(mappings);

      // then
      expect(patternPair.target.patternOf).toBe('Message');
   });

   it('#link should not link pattern mapping to ID mapping of same source name', () => {

      // given
      const patternPair = {
         source: { name: 'ID', dataType: DataType.TEXT, width: 20 },
         target: { name: 'P', dataType: DataType.TEXT, width: 20, patternOf: 'Gone' }
      };
      const mappings = [IdColumn.applyTo([], true)[0], patternPair];

      // when
      patternPairs.link(mappings);
      patternPairs.updatePatternOf(mappings);

      // then
      expect(patternPair.target.patternOf).toBe('Gone');
   });

   it('#link should keep pattern without message column', () => {

      // given
      const patternPair = { source: { ...message.source, name: 'Body' }, target: { name: 'P', dataType: DataType.TEXT, width: 20, patternOf: 'Gone' } };

      // when
      patternPairs.link([patternPair]);
      patternPairs.updatePatternOf([patternPair]);

      // then
      expect(patternPair.target.patternOf).toBe('Gone');
   });
});
