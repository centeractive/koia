/** control points of the easing with which Playwright animates the cursor of recorded actions */
const X1 = 0.5, Y1 = 0, X2 = 0.3, Y2 = 1;
const BISECTIONS = 40;

function bezier(s: number, p1: number, p2: number): number {
   return 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;
}

/**
 * @returns the share of its way the cursor of a recorded video has moved at the share of the animation time
 */
export function cursorProgressAt(time: number): number {
   let low = 0;
   let high = 1;
   for (let i = 0; i < BISECTIONS; i++) {
      const middle = (low + high) / 2;
      if (bezier(middle, X1, X2) < time) {
         low = middle;
      } else {
         high = middle;
      }
   }
   return bezier((low + high) / 2, Y1, Y2);
}
