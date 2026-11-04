/**
 * the tiles selected, a single selected tile shows its resize handles, a press outside of them ends the selection unless
 * the press adds to it
 */
export class TileSelection<T> {

  private selected: T[] = [];
  private pressed: T;
  private additivePress = false;

  isSelected(tile: T): boolean {
    return tile !== undefined && this.selected.includes(tile);
  }

  isSoleSelected(tile: T): boolean {
    return this.selected.length === 1 && this.isSelected(tile);
  }

  tiles(): T[] {
    return [...this.selected];
  }

  select(tile: T): void {
    this.selected = [tile];
  }

  toggle(tile: T): void {
    this.selected = this.isSelected(tile) ? this.selected.filter(t => t !== tile) : [...this.selected, tile];
  }

  /**
   * @param additive whether the tiles are added to the selection instead of replacing it
   */
  selectAll(tiles: T[], additive: boolean): void {
    const kept = additive ? this.selected : [];
    this.selected = [...kept, ...tiles.filter(t => !kept.includes(t))];
  }

  remove(tile: T): void {
    this.selected = this.selected.filter(t => t !== tile);
  }

  /**
   * @returns whether a tile was selected
   */
  clear(): boolean {
    const cleared = this.selected.length > 0;
    this.selected = [];
    return cleared;
  }

  /**
   * notes the tile pressed, before the press reaches the document
   */
  press(tile: T, additive = false): void {
    this.pressed = tile;
    this.additivePress = additive;
  }

  /**
   * notes a press of the selection as a whole, before the press reaches the document
   */
  pressSelection(): void {
    this.press(this.selected[0]);
  }

  /**
   * notes a press beside the tiles, before the press reaches the document
   */
  pressBackground(additive: boolean): void {
    this.press(undefined, additive);
  }

  /**
   * ends the press reaching the document, the selection is cleared unless a selected tile was pressed or the press adds
   * to the selection
   *
   * @returns whether the selection was cleared
   */
  endPress(): boolean {
    const cleared = !this.additivePress && !this.isSelected(this.pressed) && this.clear();
    this.pressed = undefined;
    this.additivePress = false;
    return cleared;
  }
}
