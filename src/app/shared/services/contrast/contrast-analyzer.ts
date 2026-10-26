import { Column, DataType } from 'app/shared/model';
import { isComputedColumn } from 'app/shared/utils/column-utils';
import { ContrastFinding, ContrastResult, ValueKind } from './contrast.types';
import { normalQuantile } from './normal-quantile';

interface ValueCount {
   kind: ValueKind;
   value?: string | number | boolean;
   selected: number;
   rest: number;
}

/**
 * Finds the column values that are over-represented among selected rows compared with the rest of the rows.
 *
 * Each value is tested with a one-sided two-proportion z-test. Values are only tested if they appear at least
 * [[MIN_SELECTED_COUNT]] times and in at least [[MIN_SELECTED_SHARE]] of the selected rows. To keep false findings rare
 * when many values are tested, the required z-score grows with the number of tests (Bonferroni correction).
 */
export class ContrastAnalyzer {

   static readonly MIN_SELECTED_COUNT = 3;
   static readonly MIN_SELECTED_SHARE = 0.05;
   static readonly MIN_Z = 3;
   static readonly FAMILY_ERROR_RATE = 0.01;
   static readonly MAX_NUMBER_VALUES = 50;
   static readonly MAX_TEXT_VALUES = 500;
   static readonly MAX_FINDINGS = 15;

   /**
    * @param selected the selected rows
    * @param rest the other rows
    * @param columns the columns of the scene
    * @param pinnedColumns names of the columns whose values are determined by the selection
    */
   analyze(selected: object[], rest: object[], columns: Column[], pinnedColumns: Set<string>): ContrastResult {
      const result: ContrastResult = { findings: [], skippedColumns: [] };
      const n1 = selected.length;
      const n2 = rest.length;
      if (n1 === 0 || n2 === 0) {
         return result;
      }
      const tested: { column: Column, count: ValueCount }[] = [];
      for (const column of columns.filter(c => this.isCandidate(c, pinnedColumns))) {
         const counts = this.countValues(column, selected, rest);
         if (counts.length > this.maxValuesOf(column)) {
            if (column.dataType === DataType.TEXT) {
               result.skippedColumns.push(column.name);
            }
            continue;
         }
         counts
            .filter(c => c.selected >= ContrastAnalyzer.MIN_SELECTED_COUNT && c.selected / n1 >= ContrastAnalyzer.MIN_SELECTED_SHARE)
            .forEach(c => tested.push({ column, count: c }));
      }
      if (tested.length === 0) {
         return result;
      }
      const minZ = Math.max(ContrastAnalyzer.MIN_Z, normalQuantile(1 - ContrastAnalyzer.FAMILY_ERROR_RATE / tested.length));
      result.findings = tested
         .filter(t => t.count.selected / n1 > t.count.rest / n2)
         .map(t => this.toFinding(t.column, t.count, n1, n2))
         .filter(f => f.z >= minZ)
         .sort((f1, f2) => this.compare(f1, f2))
         .slice(0, ContrastAnalyzer.MAX_FINDINGS);
      return result;
   }

   private isCandidate(column: Column, pinnedColumns: Set<string>): boolean {
      return !!column.indexed && !isComputedColumn(column) && !pinnedColumns.has(column.name) &&
         [DataType.TEXT, DataType.BOOLEAN, DataType.NUMBER].includes(column.dataType);
   }

   private maxValuesOf(column: Column): number {
      if (column.dataType === DataType.NUMBER) {
         return ContrastAnalyzer.MAX_NUMBER_VALUES;
      }
      return column.dataType === DataType.TEXT ? ContrastAnalyzer.MAX_TEXT_VALUES : Number.MAX_SAFE_INTEGER;
   }

   private countValues(column: Column, selected: object[], rest: object[]): ValueCount[] {
      const counts = new Map<string, ValueCount>();
      const count = (entry: object, isSelected: boolean) => {
         const valueCount = this.valueCountOf(counts, entry, column.name);
         if (isSelected) {
            valueCount.selected++;
         } else {
            valueCount.rest++;
         }
      };
      selected.forEach(e => count(e, true));
      rest.forEach(e => count(e, false));
      return [...counts.values()];
   }

   private valueCountOf(counts: Map<string, ValueCount>, entry: object, columnName: string): ValueCount {
      const value = entry[columnName];
      const kind = this.kindOf(entry, columnName);
      const key = kind === ValueKind.VALUE ? typeof value + ':' + String(value) : kind;
      let valueCount = counts.get(key);
      if (!valueCount) {
         valueCount = { kind, selected: 0, rest: 0 };
         if (kind === ValueKind.VALUE) {
            valueCount.value = value;
         }
         counts.set(key, valueCount);
      }
      return valueCount;
   }

   private kindOf(entry: object, columnName: string): ValueKind {
      const value = entry[columnName];
      if (value === undefined) {
         return ValueKind.EMPTY;
      } else if (value === null) {
         return ValueKind.NULL;
      }
      return value === '' ? ValueKind.BLANK : ValueKind.VALUE;
   }

   private toFinding(column: Column, count: ValueCount, n1: number, n2: number): ContrastFinding {
      const p1 = count.selected / n1;
      const p2 = count.rest / n2;
      const p = (count.selected + count.rest) / (n1 + n2);
      const z = (p1 - p2) / Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
      const lift = ((count.selected + 1) / (n1 + 2)) / ((count.rest + 1) / (n2 + 2));
      return {
         column: column.name,
         kind: count.kind,
         value: count.value,
         selectedCount: count.selected,
         selectedShare: p1,
         restShare: p2,
         lift,
         z,
         isNew: count.rest === 0
      };
   }

   private compare(f1: ContrastFinding, f2: ContrastFinding): number {
      return f2.z - f1.z || f2.lift - f1.lift || f1.column.localeCompare(f2.column) ||
         String(f1.value ?? f1.kind).localeCompare(String(f2.value ?? f2.kind));
   }
}
