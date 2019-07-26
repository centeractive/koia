import { TextareaMaxRowsDirective } from './textarea-max-rows.directive';
import { ElementRef } from '@angular/core';

describe('TextareaMaxRowsDirective', () => {

  it('should create an instance', () => {

    // given
    const textArea = <HTMLTextAreaElement> document.createElement('TEXTAREA');
    const textAreaRef: ElementRef<HTMLTextAreaElement> = new ElementRef(textArea);

    // when
    const directive = new TextareaMaxRowsDirective(textAreaRef);

    // then
    expect(directive).toBeTruthy();
  });

  it('#keyPress should accept char key', () => {

    // given
    const textArea = <HTMLTextAreaElement> document.createElement('TEXTAREA');
    textArea.value = 'a';
    spyOn(textArea, 'blur');
    const directive = new TextareaMaxRowsDirective(new ElementRef(textArea));
    directive.maxRows = 2;
    const event = new KeyboardEvent('keypress', { key: 'c' });
    spyOn(event, 'preventDefault');

    // when
    directive.keyPress(event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(textArea.blur).not.toHaveBeenCalled();
  });

  it('#keyPress should accept "Enter" key when max rows is not exceeded', () => {

    // given
    const textArea = <HTMLTextAreaElement> document.createElement('TEXTAREA');
    textArea.value = 'a';
    spyOn(textArea, 'blur');
    const directive = new TextareaMaxRowsDirective(new ElementRef(textArea));
    directive.maxRows = 2;
    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    // when
    directive.keyPress(event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(textArea.blur).not.toHaveBeenCalled();
  });

  it('#keyPress should ignore "Enter" key and leave textare when max rows is exceeded', () => {

    // given
    const textArea = <HTMLTextAreaElement> document.createElement('TEXTAREA');
    textArea.value = 'a\nb';
    spyOn(textArea, 'blur');
    const directive = new TextareaMaxRowsDirective(new ElementRef(textArea));
    directive.maxRows = 2;
    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    // when
    directive.keyPress(event);

    // then
    expect(event.preventDefault).toHaveBeenCalled();
    expect(textArea.blur).toHaveBeenCalled();
  });
});
