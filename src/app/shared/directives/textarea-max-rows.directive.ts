import { Directive, Input, ElementRef, HostListener } from '@angular/core';
import { StringUtils } from '../utils';

@Directive({
  selector: 'textarea[textareaMaxRows]'
})
export class TextareaMaxRowsDirective {

  @Input('textareaMaxRows') maxRows: number;

  private textarea: HTMLTextAreaElement;

  constructor(textareaRef: ElementRef<HTMLTextAreaElement>) {
    this.textarea = textareaRef.nativeElement;
  }

  @HostListener('keypress', ['$event'])
  onKeyPressed(event: KeyboardEvent): void {
    const rowCount = this.textarea.value.split('\n').length;
    if (event.key === 'Enter' && rowCount >= this.maxRows) {
      event.preventDefault();
      this.textarea.blur();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const v = this.nonSelectedText() + event.clipboardData.getData('text/plain');
    const rows = v.split('\n').length;
    if (rows > this.maxRows) {
      event.preventDefault();
    }
  }

  private nonSelectedText(): string {
    return StringUtils.nonSelected(this.textarea.value, this.textarea.selectionStart, this.textarea.selectionEnd);
  }
}