import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TextareaMaxRowsDirective } from './textarea-max-rows.directive';

@Component({
  template: '<textarea type="text" [textareaMaxRows]="2"></textarea>'
})
class TextareaMaxRowsComponent {
}

describe('TextareaMaxRowsDirective', () => {

  let component: TextareaMaxRowsComponent;
  let fixture: ComponentFixture<TextareaMaxRowsComponent>;
  let taDebugElement: DebugElement;
  let textArea: HTMLTextAreaElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextareaMaxRowsComponent, TextareaMaxRowsDirective],
    }).compileComponents();
    fixture = TestBed.createComponent(TextareaMaxRowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    taDebugElement = fixture.debugElement.query(By.css('textarea'));
    textArea = taDebugElement.nativeElement;
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
    // directive.maxLines = 3;
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
    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    // when
    textArea.dispatchEvent(event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(textArea.blur).not.toHaveBeenCalled();
  });

  it('#press "Enter" key should be ignored and textarea be left when max rows is exceeded', () => {

    // given
    textArea.value = 'a\nb';
    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    // when
    textArea.dispatchEvent(event);

    // then
    expect(event.preventDefault).toHaveBeenCalled();
    expect(textArea.blur).toHaveBeenCalled();
  });

  it('paste should be ignored when resulting text contains more than max rows', () => {
    // given
    textArea.value = 'a\nb';
    const event = clipboardEvent('\nc', 3);
    spyOn(event, 'preventDefault');

    // when        
    taDebugElement.triggerEventHandler('paste', event);

    // then
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('paste should be accepted when resulting text contains max rows', () => {
    // given
    textArea.value = 'a';
    const event = clipboardEvent('\nb', 1);
    spyOn(event, 'preventDefault');

    // when        
    taDebugElement.triggerEventHandler('paste', event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('paste should be accepted when resulting text contains max rows (selection at start)', () => {
    // given
    textArea.value = 'a\nb';
    const event = clipboardEvent('\nc', 0, 2);
    spyOn(event, 'preventDefault');

    // when        
    taDebugElement.triggerEventHandler('paste', event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('paste should be accepted when resulting text contains max rows (selection in between)', () => {
    // given
    textArea.value = 'a\nb';
    const event = clipboardEvent('\nc', 1, 2);
    spyOn(event, 'preventDefault');

    // when        
    taDebugElement.triggerEventHandler('paste', event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('paste should be accepted when resulting text contains max rows (selection at end)', () => {
    // given
    textArea.value = 'a\nb';
    const event = clipboardEvent('\nc', 1, 3);
    spyOn(event, 'preventDefault');

    // when        
    taDebugElement.triggerEventHandler('paste', event);

    // then
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  function clipboardEvent(text: string, selectionStart: number, selectionEnd?: number): ClipboardEvent {
    textArea.setSelectionRange(selectionStart, selectionEnd || selectionStart);
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    return new ClipboardEvent('paste', { clipboardData });
  }

});
