import { Directive, Input, ElementRef } from '@angular/core';

@Directive({
  selector: '[koiaTextareaMaxRows]'
})
export class TextareaMaxRowsDirective {

  @Input('koiaTextareaMaxRows') maxRows: number;

  private textarea: HTMLTextAreaElement;

  constructor(textareaRef: ElementRef<HTMLTextAreaElement>) {
    this.textarea = textareaRef.nativeElement;
    this.textarea.addEventListener('keypress', e => this.onKeyPressed(e), false);
  }

  private onKeyPressed(event: KeyboardEvent): void {
    const lineCount = this.textarea.value.split('\n').length;
    if (event.key === 'Enter' && lineCount >= this.maxRows) {
      event.preventDefault();
      this.textarea.blur();
    }
  }
}
