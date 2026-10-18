export function waitFrames(condition: () => boolean, maxFrames: number): Promise<boolean> {
  return new Promise(resolve => {
    const check = (remaining: number) => {
      if (condition()) {
        resolve(true);
      } else if (remaining === 0) {
        resolve(false);
      } else {
        requestAnimationFrame(() => check(remaining - 1));
      }
    };
    check(maxFrames);
  });
}

export function waitStable(read: () => unknown, stableFrames: number, maxFrames: number): Promise<boolean> {
  return new Promise(resolve => {
    let previous = read();
    let unchanged = 0;
    const check = (remaining: number) => {
      const current = read();
      unchanged = current === previous ? unchanged + 1 : 0;
      previous = current;
      if (unchanged >= stableFrames) {
        resolve(true);
      } else if (remaining === 0) {
        resolve(false);
      } else {
        requestAnimationFrame(() => check(remaining - 1));
      }
    };
    requestAnimationFrame(() => check(maxFrames));
  });
}
