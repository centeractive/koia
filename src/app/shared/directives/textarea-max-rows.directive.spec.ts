import { TextareaMaxRowsDirective } from './textarea-max-rows.directive';
import { ElementRef } from '@angular/core';

describe('TextareaMaxRowsDirective', () => {

  let textArea: HTMLTextAreaElement;
  let directive: TextareaMaxRowsDirective;

  beforeEach(() => {
    textArea = document.createElement('TEXTAREA') as HTMLTextAreaElement;
    directive = new TextareaMaxRowsDirective(new ElementRef(textArea));
    spyOn(textArea, 'blur');
  });


  it('#press character key should be accepted on first line', () => {

    // given
    const event = new KeyboardEvent('keypress', { key: 'c' });
    spyOn(event, 'preventDefault');

    // when
    textArea.dispatchEvent(event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(textArea.blur).not.toHaveBeenCalled();
  });

  it('#press character key should be accepted on last line', () => {

    // given
    textArea.value = 'a\nb\nc';
    directive.maxRows = 3;
    const event = new KeyboardEvent('keypress', { key: 'd' });
    spyOn(event, 'preventDefault');

    // when
    textArea.dispatchEvent(event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(textArea.blur).not.toHaveBeenCalled();
  });

  it('#press "Enter" key should be accepted when max rows is not exceeded', () => {

    // given
    textArea.value = 'a';
    directive.maxRows = 2;
    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    // when
    textArea.dispatchEvent(event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(textArea.blur).not.toHaveBeenCalled();
  });

  it('#press "Enter" key should be ignored and textare be left when max rows is exceeded', () => {

    // given
    textArea.value = 'a\nb';
    directive.maxRows = 2;
    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    // when
    textArea.dispatchEvent(event);

    // then
    expect(event.preventDefault).toHaveBeenCalled();
    expect(textArea.blur).toHaveBeenCalled();
  });
});
