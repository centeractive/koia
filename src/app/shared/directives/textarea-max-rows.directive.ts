import { Directive, Input, ElementRef } from '@angular/core';

@Directive({
  selector: '[retroTextareaMaxRows]'
})
export class TextareaMaxRowsDirective {

  @Input('retroTextareaMaxRows') maxRows: number;

  private textarea: HTMLTextAreaElement;

  constructor(textareaRef: ElementRef<HTMLTextAreaElement>) {
    this.textarea = textareaRef.nativeElement;
    this.textarea.addEventListener('keypress', e => this.keyPress(e), false);
  }

  keyPress(event: KeyboardEvent): void {
    const lineCount = this.textarea.value.split('\n').length;
    if (event.which === 13 && lineCount >= this.maxRows) {
      event.preventDefault();
      this.textarea.blur();
    }
  }
}
