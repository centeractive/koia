import { ElementContext } from 'app/shared/model';

/**
 * changes the stacking order of tiles, the targets keep their order among each other; overlays are always drawn above the
 * tiles, a step forward or backward hence passes the elements of the same kind only
 */
export class ZOrder {

  toFront(targets: ElementContext[], all: ElementContext[]): void {
    const ranked = this.byZ(all);
    this.rank([...ranked.filter(c => !targets.includes(c)), ...ranked.filter(c => targets.includes(c))]);
  }

  toBack(targets: ElementContext[], all: ElementContext[]): void {
    const ranked = this.byZ(all);
    this.rank([...ranked.filter(c => targets.includes(c)), ...ranked.filter(c => !targets.includes(c))]);
  }

  forward(targets: ElementContext[], all: ElementContext[]): void {
    this.step(targets, all, kind => {
      for (let i = kind.length - 2; i >= 0; i--) {
        if (targets.includes(kind[i]) && !targets.includes(kind[i + 1])) {
          [kind[i], kind[i + 1]] = [kind[i + 1], kind[i]];
        }
      }
    });
  }

  backward(targets: ElementContext[], all: ElementContext[]): void {
    this.step(targets, all, kind => {
      for (let i = 1; i < kind.length; i++) {
        if (targets.includes(kind[i]) && !targets.includes(kind[i - 1])) {
          [kind[i], kind[i - 1]] = [kind[i - 1], kind[i]];
        }
      }
    });
  }

  /**
   * ranks all contexts, then reorders each kind within the z values its elements hold
   *
   * @param reorder reorders the given contexts of a kind, sorted by z, in place
   */
  private step(targets: ElementContext[], all: ElementContext[], reorder: (kind: ElementContext[]) => void): void {
    this.rank(this.byZ(all));
    [true, false].forEach(overlay => {
      const kind = this.byZ(all.filter(c => c.isOverlay() === overlay));
      const zs = kind.map(c => c.z);
      if (kind.some(c => targets.includes(c))) {
        reorder(kind);
        kind.forEach((c, i) => c.z = zs[i]);
      }
    });
  }

  /**
   * @returns the contexts sorted by z, contexts without z lowest, keeping the order of equal ones
   */
  private byZ(contexts: ElementContext[]): ElementContext[] {
    return [...contexts].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  }

  private rank(contexts: ElementContext[]): void {
    contexts.forEach((c, i) => c.z = i + 1);
  }
}
