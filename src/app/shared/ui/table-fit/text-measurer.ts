export class TextMeasurer {

  private readonly context: CanvasRenderingContext2D;

  constructor(font: string, letterSpacing = '0px') {
    this.context = document.createElement('canvas').getContext('2d');
    this.context.font = font;
    this.context.letterSpacing = letterSpacing;
  }

  width(text: string): number {
    return this.context.measureText(text).width;
  }
}
