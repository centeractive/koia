import { Column, DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
import { PatternMasker } from 'app/shared/utils/pattern-masker';
import { ContrastAnalyzer } from 'app/shared/services/contrast/contrast-analyzer';
import { pinnedColumnsOf } from 'app/shared/services/contrast/pinned-columns';
import { appLogsSampleOf } from './app-logs.sample';
import { SampleData, toEntries } from './sample-data';

/**
 * guards the planted pattern of the log sample, the explanation of its ERROR rows is shown in the intro and tested end-to-end
 */
describe('app logs sample', () => {

   it('explanation of ERROR rows should find host node-7 only and skip messages', async () => {

      // given
      const response = await fetch('/assets/samples/' + appLogsSampleOf('en').file);
      const data: SampleData = await response.json();
      const entries = toEntries(data);
      const selection = new Query(new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT));

      // when
      const result = new ContrastAnalyzer().analyze(
         entries.filter(e => e['Level'] === 'ERROR'),
         entries.filter(e => e['Level'] !== 'ERROR'),
         data.scene.columns,
         pinnedColumnsOf(selection, new Query()));

      // then
      expect(result.findings.length).toBe(1);
      const finding = result.findings[0];
      expect([finding.column, finding.value, finding.selectedCount, finding.selectedShare, finding.restShare])
         .toEqual(['Host', 'node-7', 60, 0.6, 0.05]);
      expect(finding.lift).toBeCloseTo(11.85, 2);
      expect(finding.z).toBeCloseTo(20.05, 2);
      expect(result.skippedColumns).toEqual(['Message']);
   });

   it.each(['en', 'de', 'ja'] as const)('masking messages of %s sample should yield 9 patterns', async language => {

      // given
      const response = await fetch('/assets/samples/' + appLogsSampleOf(language).file);
      const data: SampleData = await response.json();

      // when
      const patterns = new Set(toEntries(data).map(e => PatternMasker.mask(e['Message'])));

      // then
      expect(patterns.size).toBe(9);
   });

   it.each(['en', 'de', 'ja'] as const)('only messages of %s sample should suit a pattern column', async language => {

      // given
      const response = await fetch('/assets/samples/' + appLogsSampleOf(language).file);
      const data: SampleData = await response.json();
      const textColumns = data.scene.columns.filter(c => c.dataType === DataType.TEXT).map(c => c.name);

      // when
      const suitable = textColumns.filter(name => PatternMasker.suitsColumn(toEntries(data), name));

      // then
      expect(textColumns).toEqual(['Level', 'Host', 'Service', 'Version', 'Message']);
      expect(suitable).toEqual(['Message']);
   });

   it('explanation of ERROR rows should find error message patterns before host node-7 when pattern column is added', async () => {

      // given
      const response = await fetch('/assets/samples/' + appLogsSampleOf('en').file);
      const data: SampleData = await response.json();
      const entries = toEntries(data).map(e => ({ ...e, 'Message pattern': PatternMasker.mask(e['Message']) }));
      const pattern: Column = { name: 'Message pattern', dataType: DataType.TEXT, width: 40, indexed: true, patternOf: 'Message' };
      const selection = new Query(new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT));

      // when
      const result = new ContrastAnalyzer().analyze(
         entries.filter(e => e['Level'] === 'ERROR'),
         entries.filter(e => e['Level'] !== 'ERROR'),
         [...data.scene.columns, pattern],
         pinnedColumnsOf(selection, new Query()));

      // then
      expect(result.findings.map(f => [f.column, f.value, f.selectedCount, f.isNew])).toEqual([
         ['Message pattern', 'Request <*> rejected: invalid token', 34, true],
         ['Message pattern', 'Request <*> failed: connection reset', 33, true],
         ['Message pattern', 'Request <*> failed: upstream timeout', 33, true],
         ['Host', 'node-7', 60, false]
      ]);
      expect(result.findings.map(f => f.z)).toEqual([
         expect.closeTo(25.635, 2), expect.closeTo(25.249, 2), expect.closeTo(25.249, 2), expect.closeTo(20.049, 2)
      ]);
      expect(result.skippedColumns).toEqual(['Message']);
   });
});
