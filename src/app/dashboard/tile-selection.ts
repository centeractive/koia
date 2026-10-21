/**
 * the tile showing its resize handles, a press outside of it ends the selection
 */
export class TileSelection<T> {

  private selected: T;
  private pressed: T;

  isSelected(tile: T): boolean {
    return this.selected !== undefined && tile === this.selected;
  }

  select(tile: T): void {
    this.selected = tile;
  }

  /**
   * @returns whether a tile was selected
   */
  clear(): boolean {
    const cleared = this.selected !== undefined;
    this.selected = undefined;
    return cleared;
  }

  /**
   * notes the tile pressed, before the press reaches the document
   */
  press(tile: T): void {
    this.pressed = tile;
  }

  /**
   * ends the press reaching the document, the selection is cleared unless the selected tile was pressed
   *
   * @returns whether the selection was cleared
   */
  endPress(): boolean {
    const cleared = this.pressed !== this.selected && this.clear();
    this.pressed = undefined;
    return cleared;
  }
}
