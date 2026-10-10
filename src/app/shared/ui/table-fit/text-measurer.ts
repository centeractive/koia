export class TextMeasurer {

  private readonly context: CanvasRenderingContext2D;

  constructor(font: string) {
    this.context = document.createElement('canvas').getContext('2d');
    this.context.font = font;
  }

  width(text: string): number {
    return this.context.measureText(text).width;
  }
}
