import { Column, ComputeOperator, DataType } from 'app/shared/model';
import { ContrastAnalyzer } from './contrast-analyzer';
import { ValueKind } from './contrast.types';
import { normalQuantile } from './normal-quantile';

describe('ContrastAnalyzer', () => {

   const NONE = new Set<string>();

   const level = column('Level', DataType.TEXT);
   const host = column('Host', DataType.TEXT);

   let analyzer: ContrastAnalyzer;

   beforeEach(() => analyzer = new ContrastAnalyzer());

   it('should find over-represented value with shares, lift and z-score', () => {

      // given
      const selected = rows(100, i => ({ Host: i < 60 ? 'node-7' : 'node-1' }));
      const rest = rows(1900, i => ({ Host: i < 95 ? 'node-7' : 'node-1' }));

      // when
      const result = analyzer.analyze(selected, rest, [host], NONE);

      // then
      expect(result.findings.length).toBe(1);
      const finding = result.findings[0];
      expect(finding.column).toBe('Host');
      expect(finding.kind).toBe(ValueKind.VALUE);
      expect(finding.value).toBe('node-7');
      expect(finding.selectedCount).toBe(60);
      expect(finding.selectedShare).toBe(0.6);
      expect(finding.restShare).toBe(0.05);
      expect(finding.lift).toBeCloseTo((61 / 102) / (96 / 1902), 10);
      expect(finding.z).toBeCloseTo(20.05, 2);
      expect(finding.isNew).toBe(false);
      expect(result.skippedColumns).toEqual([]);
   });

   it('should mark value not appearing in rest as new', () => {

      // given
      const selected = rows(10, i => ({ Version: i < 5 ? '2.4.1' : '2.4.0' }));
      const rest = rows(100, () => ({ Version: '2.4.0' }));

      // when
      const result = analyzer.analyze(selected, rest, [column('Version', DataType.TEXT)], NONE);

      // then
      expect(result.findings.map(f => [f.value, f.isNew, f.restShare])).toEqual([['2.4.1', true, 0]]);
   });

   it('should return no findings when selection is empty', () => {

      // when
      const result = analyzer.analyze([], rows(10, () => ({ Level: 'INFO' })), [level], NONE);

      // then
      expect(result).toEqual({ findings: [], skippedColumns: [] });
   });

   it('should return no findings when rest is empty', () => {

      // when
      const result = analyzer.analyze(rows(10, () => ({ Level: 'INFO' })), [], [level], NONE);

      // then
      expect(result).toEqual({ findings: [], skippedColumns: [] });
   });

   it('should return no findings when no value is tested', () => {

      // given
      const selected = rows(100, i => ({ Level: 'L' + i }));

      // when
      const result = analyzer.analyze(selected, rows(100, () => ({ Level: 'INFO' })), [level], NONE);

      // then
      expect(result.findings).toEqual([]);
   });

   it('should not test value appearing twice only', () => {

      // given
      const selected = rows(2, () => ({ Level: 'ERROR' }));
      const rest = rows(10_000, () => ({ Level: 'INFO' }));

      // when
      const result = analyzer.analyze(selected, rest, [level], NONE);

      // then
      expect(result.findings).toEqual([]);
   });

   it('should test value appearing three times', () => {

      // given
      const selected = rows(3, () => ({ Level: 'ERROR' }));
      const rest = rows(10_000, () => ({ Level: 'INFO' }));

      // when
      const result = analyzer.analyze(selected, rest, [level], NONE);

      // then
      expect(result.findings.map(f => f.value)).toEqual(['ERROR']);
   });

   it('should not test value of less than 5 percent of selected rows', () => {

      // given
      const selected = rows(2001, i => ({ Level: i < 100 ? 'ERROR' : 'INFO' }));
      const rest = rows(10_000, () => ({ Level: 'INFO' }));

      // when
      const result = analyzer.analyze(selected, rest, [level], NONE);

      // then
      expect(result.findings).toEqual([]);
   });

   it('should test value of 5 percent of selected rows', () => {

      // given
      const selected = rows(2000, i => ({ Level: i < 100 ? 'ERROR' : 'INFO' }));
      const rest = rows(10_000, () => ({ Level: 'INFO' }));

      // when
      const result = analyzer.analyze(selected, rest, [level], NONE);

      // then
      expect(result.findings.map(f => f.value)).toEqual(['ERROR']);
   });

   it('should not report value that is not more frequent than in rest', () => {

      // given
      const selected = rows(100, i => ({ Level: i < 50 ? 'ERROR' : 'INFO' }));
      const rest = rows(100, i => ({ Level: i < 50 ? 'ERROR' : 'INFO' }));

      // when
      const result = analyzer.analyze(selected, rest, [level], NONE);

      // then
      expect(result.findings).toEqual([]);
   });

   it('should not report value of constant column', () => {

      // when
      const result = analyzer.analyze(rows(10, () => ({ Level: 'INFO' })), rows(10, () => ({ Level: 'INFO' })), [level], NONE);

      // then
      expect(result.findings).toEqual([]);
   });

   it('should require z-score of at least 3 when few values are tested', () => {

      // given rest share 0.1 and selected share 0.2 => z-score of slightly above or below 3 depending on row count
      const below = analyzer.analyze(sharedRows(90, 0.2), sharedRows(900, 0.1), [level], NONE);
      const above = analyzer.analyze(sharedRows(110, 0.2), sharedRows(1100, 0.1), [level], NONE);

      // then
      expect(zScoreOf(90, 0.2, 900, 0.1)).toBeLessThan(3);
      expect(below.findings).toEqual([]);
      expect(zScoreOf(110, 0.2, 1100, 0.1)).toBeGreaterThan(3);
      expect(above.findings.map(f => f.value)).toEqual(['ERROR']);
   });

   it('should require higher z-score when many values are tested', () => {

      // given 201 tested values (199 columns with value 'x' plus ERROR and INFO) => required z-score of quantile at 1 - 0.01 / 201
      const minZ = normalQuantile(1 - 0.01 / 201);
      const columns = Array.from({ length: 199 }, (_, i) => column('C' + i, DataType.TEXT));
      const selected = rows(110, () => Object.fromEntries(columns.map(c => [c.name, 'x'])));
      const rest = rows(1100, () => Object.fromEntries(columns.map(c => [c.name, 'x'])));
      selected.forEach((r, i) => r['Level'] = i < 22 ? 'ERROR' : 'INFO');
      rest.forEach((r, i) => r['Level'] = i < 110 ? 'ERROR' : 'INFO');

      // when
      const result = analyzer.analyze(selected, rest, [level, ...columns], NONE);

      // then
      expect(minZ).toBeGreaterThan(zScoreOf(110, 0.2, 1100, 0.1));
      expect(result.findings).toEqual([]);
   });

   it('should skip pinned, unindexed, computed, time and object columns', () => {

      // given
      const columns = [
         column('Level', DataType.TEXT),
         { ...column('Host', DataType.TEXT), indexed: false },
         { ...column('Share', DataType.NUMBER), computation: { leftColumn: 'A', operator: ComputeOperator.ADD, rightColumn: 'B' } },
         column('Time', DataType.TIME),
         column('Data', DataType.OBJECT)
      ];
      const selected = rows(100, () => ({ Level: 'ERROR', Host: 'h1', Share: 1, Time: 1, Data: 'o' }));
      const rest = rows(100, () => ({ Level: 'INFO', Host: 'h2', Share: 2, Time: 2, Data: 'p' }));

      // when
      const result = analyzer.analyze(selected, rest, columns, new Set(['Level']));

      // then
      expect(result.findings).toEqual([]);
   });

   it('should analyze boolean column', () => {

      // given
      const selected = rows(100, () => ({ Failed: true }));
      const rest = rows(100, () => ({ Failed: false }));

      // when
      const result = analyzer.analyze(selected, rest, [column('Failed', DataType.BOOLEAN)], NONE);

      // then
      expect(result.findings.map(f => f.value)).toEqual([true]);
   });

   it('should analyze number column with 50 distinct values', () => {

      // given
      const selected = rows(100, () => ({ Code: 500 }));
      const rest = rows(490, i => ({ Code: i % 49 }));

      // when
      const result = analyzer.analyze(selected, rest, [column('Code', DataType.NUMBER)], NONE);

      // then
      expect(result.findings.map(f => f.value)).toEqual([500]);
   });

   it('should skip number column with 51 distinct values silently', () => {

      // given
      const selected = rows(100, () => ({ Code: 500 }));
      const rest = rows(500, i => ({ Code: i % 50 }));

      // when
      const result = analyzer.analyze(selected, rest, [column('Code', DataType.NUMBER)], NONE);

      // then
      expect(result).toEqual({ findings: [], skippedColumns: [] });
   });

   it('should analyze text column with 500 distinct values', () => {

      // given
      const selected = rows(100, () => ({ Path: '/error' }));
      const rest = rows(4990, i => ({ Path: '/p' + (i % 499) }));

      // when
      const result = analyzer.analyze(selected, rest, [column('Path', DataType.TEXT)], NONE);

      // then
      expect(result.findings.map(f => f.value)).toEqual(['/error']);
      expect(result.skippedColumns).toEqual([]);
   });

   it('should report text column with 501 distinct values as skipped', () => {

      // given
      const selected = rows(100, () => ({ Path: '/error' }));
      const rest = rows(5000, i => ({ Path: '/p' + (i % 500) }));

      // when
      const result = analyzer.analyze(selected, rest, [column('Path', DataType.TEXT), level], NONE);

      // then
      expect(result).toEqual({ findings: [], skippedColumns: ['Path'] });
   });

   it('should distinguish missing, null and blank values', () => {

      // given
      const selected = [
         ...rows(30, () => ({})),
         ...rows(30, () => ({ Host: null })),
         ...rows(30, () => ({ Host: '' })),
         ...rows(10, () => ({ Host: 'h1' }))
      ];
      const rest = rows(1000, () => ({ Host: 'h1' }));

      // when
      const result = analyzer.analyze(selected, rest, [host], NONE);

      // then
      expect(result.findings.map(f => [f.kind, f.value, f.selectedCount, f.isNew])).toEqual([
         [ValueKind.BLANK, undefined, 30, true],
         [ValueKind.EMPTY, undefined, 30, true],
         [ValueKind.NULL, undefined, 30, true]
      ]);
   });

   it('should distinguish number from text of same digits', () => {

      // given
      const selected = rows(100, i => ({ Code: i < 50 ? 1 : '1' }));
      const rest = rows(100, () => ({ Code: 2 }));

      // when
      const result = analyzer.analyze(selected, rest, [column('Code', DataType.TEXT)], NONE);

      // then
      expect(result.findings.map(f => f.value)).toEqual([1, '1']);
   });

   it('should order findings by z-score, lift, column and value', () => {

      // given
      const selected = rows(100, i => ({ A: i < 50 ? 'a' : 'b', B: i < 50 ? 'a' : 'b', C: i < 80 ? 'x' : 'y' }));
      const rest = rows(1000, () => ({ A: 'c', B: 'c', C: 'y' }));

      // when
      const result = analyzer.analyze(selected, rest, ['B', 'A', 'C'].map(n => column(n, DataType.TEXT)), NONE);

      // then
      expect(result.findings.map(f => f.column + '=' + f.value)).toEqual(['C=x', 'A=a', 'A=b', 'B=a', 'B=b']);
   });

   it('should order findings of different kinds of same scores by kind', () => {

      // given
      const selected = [...rows(50, () => ({ A: null })), ...rows(50, () => ({}))];
      const rest = rows(1000, () => ({ A: 'c' }));

      // when
      const result = analyzer.analyze(selected, rest, [column('A', DataType.TEXT)], NONE);

      // then
      expect(result.findings.map(f => f.kind)).toEqual([ValueKind.EMPTY, ValueKind.NULL]);
   });

   it('should return top 15 findings', () => {

      // given
      const columns = Array.from({ length: 20 }, (_, i) => column('C' + String(i).padStart(2, '0'), DataType.TEXT));
      const selected = rows(100, () => Object.fromEntries(columns.map(c => [c.name, 'x'])));
      const rest = rows(100, () => Object.fromEntries(columns.map(c => [c.name, 'y'])));

      // when
      const result = analyzer.analyze(selected, rest, columns, NONE);

      // then
      expect(result.findings.map(f => f.column)).toEqual(columns.slice(0, 15).map(c => c.name));
   });

   function sharedRows(count: number, errorShare: number): object[] {
      return rows(count, i => ({ Level: i < count * errorShare ? 'ERROR' : 'INFO' }));
   }

   function zScoreOf(n1: number, p1: number, n2: number, p2: number): number {
      const p = (n1 * p1 + n2 * p2) / (n1 + n2);
      return (p1 - p2) / Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
   }

   function rows(count: number, rowOf: (i: number) => object): object[] {
      return Array.from({ length: count }, (_, i) => rowOf(i));
   }

   function column(name: string, dataType: DataType): Column {
      return { name, dataType, width: 10, indexed: true };
   }
});
