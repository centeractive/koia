export interface Box {
   x: number;
   y: number;
   width: number;
   height: number;
}

export function centerXOf(box: Box): number {
   return box.x + box.width / 2;
}
