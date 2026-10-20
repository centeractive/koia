import { LanguageService } from 'app/shared/services/language/language.service';
import { Column, Computation, ComputeOperator } from '../model';
import { EnumLabelKeys } from '../model/enum-label-keys';
import { isComputedColumn } from './column-utils';

/**
 * @returns the computed value or undefined when an operand is no number or the result is not finite
 */
export function computeValue(computation: Computation, entry: object): number | undefined {
   const left = entry[computation.leftColumn];
   const right = entry[computation.rightColumn];
   if (typeof left !== 'number' || typeof right !== 'number') {
      return undefined;
   }
   const value = rawValueOf(computation.operator, left, right);
   return Number.isFinite(value) ? rounded(computation.operator, value) : undefined;
}

/**
 * sets the values of the computed columns on the specified entries, deletes the property when a value is undefined
 *
 * @returns the specified entries
 */
export function withComputedValues<T extends object>(entries: T[], columns: Column[]): T[] {
   const computedColumns = columns.filter(isComputedColumn);
   entries.forEach(entry => computedColumns.forEach(c => {
      const value = computeValue(c.computation, entry);
      if (value === undefined) {
         delete entry[c.name];
      } else {
         entry[c.name] = value;
      }
   }));
   return entries;
}

export function formulaOf(computation: Computation): string {
   return LanguageService.instant(EnumLabelKeys.computeOperatorFormula(computation.operator),
      { left: computation.leftColumn, right: computation.rightColumn });
}

export function computedColumnTooltipOf(column: Column): string {
   return isComputedColumn(column) ? formulaOf(column.computation) : '';
}

function rawValueOf(operator: ComputeOperator, left: number, right: number): number | undefined {
   switch (operator) {
      case ComputeOperator.ADD:
         return left + right;
      case ComputeOperator.SUBTRACT:
         return left - right;
      case ComputeOperator.MULTIPLY:
         return left * right;
      case ComputeOperator.DIVIDE:
         return left / right;
      case ComputeOperator.PERCENTAGE:
         return left / right * 100;
      default:
         return undefined;
   }
}

function rounded(operator: ComputeOperator, value: number): number {
   switch (operator) {
      case ComputeOperator.PERCENTAGE:
         return Number(value.toFixed(2));
      case ComputeOperator.DIVIDE:
         return Number(value.toFixed(4));
      default:
         return Number(value.toPrecision(15));
   }
}
