/** seconds of a recording cut out of the mixed video, relative to its trimmed start */
export interface Cut {
   readonly start: number;
   readonly end: number;
}

function millisecondsRounded(seconds: number): number {
   return Math.round(seconds * 1000) / 1000;
}

function lengthOf(cut: Cut): number {
   return millisecondsRounded(millisecondsRounded(cut.end) - millisecondsRounded(cut.start));
}

/**
 * @returns the duration left after the cuts
 */
export function keptDurationOf(duration: number, cuts: readonly Cut[]): number {
   return cuts.reduce((kept, cut) => kept - lengthOf(cut), duration);
}

/**
 * @returns the ffmpeg video filter dropping the frames of the cuts and moving the later frames back by their lengths, undefined without
 * cuts
 */
export function cutFilterOf(cuts: readonly Cut[]): string | undefined {
   if (!cuts.length) {
      return undefined;
   }
   const dropped = cuts.map(c => `between(t,${millisecondsRounded(c.start)},${millisecondsRounded(c.end)})`).join('+');
   const shifts = cuts.map(c => `gte(T,${millisecondsRounded(c.end)})*${lengthOf(c)}`).join('+');
   return `select='not(${dropped})',setpts='PTS-(${shifts})/TB'`;
}
