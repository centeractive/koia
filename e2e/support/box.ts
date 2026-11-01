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
