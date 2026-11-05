export interface Box {
   x: number;
   y: number;
   width: number;
   height: number;
}

export function centerXOf(box: Box): number {
   return box.x + box.width / 2;
}

export function centerYOf(box: Box): number {
   return box.y + box.height / 2;
}

export function intersects(a: Box, b: Box): boolean {
   return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}
