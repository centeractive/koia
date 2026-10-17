import type { Randomizer } from './randomizer';

export interface GridDef {
  columns: number;
  cellRatio: string;
}

export const GENERATED_CELL_RATIO = '1:1';
export const GENERATED_GRID_COLUMNS: readonly number[] = [3, 4, 5];
export const TARGET_CELLS = 12;

export function rowsOf(gridColumns: number): number {
  return Math.ceil(TARGET_CELLS / gridColumns);
}

export class GridChooser {

  constructor(private readonly randomizer: Randomizer) { }

  next(current: GridDef): GridDef {
    return {
      columns: this.randomizer.pick(GENERATED_GRID_COLUMNS.filter(c => c !== current.columns)),
      cellRatio: GENERATED_CELL_RATIO
    };
  }
}
