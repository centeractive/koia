import { DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
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
});
