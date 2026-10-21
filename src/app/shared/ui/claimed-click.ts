const claimed = new WeakSet<Event>();

/**
 * marks a click as handled by the content it hit, the tile around it must not take it for its own
 */
export function claimClick(event: Event): void {
   claimed.add(event);
}

export function isClickClaimed(event: Event): boolean {
   return claimed.has(event);
}
