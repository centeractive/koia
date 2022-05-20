import { Component } from '@angular/core';
import { FilterValueInputDirective } from './filter-value-input.directive';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PropertyFilter, Operator, DataType } from 'app/shared/model';

@Component({
   template: `<input [koiaFilterValueInput]="filter">`
})
class TestComponent {
   filter = new PropertyFilter('x', Operator.EQUAL, '', DataType.NUMBER);
}

describe('FilterValueInputDirective', () => {

   let fixture: ComponentFixture<TestComponent>;
   let component: TestComponent;
   let inputElement: HTMLInputElement;

   beforeEach(() => {
      TestBed.configureTestingModule({
         declarations: [FilterValueInputDirective, TestComponent]
      });
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      component = fixture.componentInstance;
      inputElement = <HTMLInputElement>fixture.debugElement.nativeElement.querySelector('INPUT');
      spyOn(inputElement, 'setSelectionRange');
   });

   it('#keydown should not set caret position when filter data type is TEXT', fakeAsync(() => {

      // given
      component.filter.dataType = DataType.TEXT;
      inputElement.value = '123';
      const event = new KeyboardEvent('keydown', { key: '4' });

      // when
      inputElement.dispatchEvent(event);
      tick();

      // then
      expect(inputElement.setSelectionRange).not.toHaveBeenCalled();
   }));

   it('#keydown should not set caret position when key is letter', fakeAsync(() => {

      // given
      inputElement.value = '123';
      const event = new KeyboardEvent('keydown', { key: 'x' });

      // when
      inputElement.dispatchEvent(event);
      tick();

      // then
      expect(inputElement.setSelectionRange).not.toHaveBeenCalled();
   }));

   it('#keydown should not set caret position when text was selected', fakeAsync(() => {

      // given
      inputElement.value = '123';
      inputElement.selectionStart = 1;
      inputElement.selectionEnd = 3;
      const event = new KeyboardEvent('keydown', { key: '4' });

      // when
      inputElement.dispatchEvent(event);
      tick();

      // then
      expect(inputElement.setSelectionRange).not.toHaveBeenCalled();
   }));

   it('#keydown should set caret position at end when thousands separator was added', fakeAsync(() => {

      // given
      inputElement.value = '123';
      const event = new KeyboardEvent('keydown', { key: '4' });

      // when
      inputElement.dispatchEvent(event);
      tick();

      // then
      expect(inputElement.setSelectionRange).toHaveBeenCalledWith(5, 5);
   }));

   it('#keydown should set caret position when last digit is removed through <Delete>', fakeAsync(() => {

      // given
      inputElement.value = '123';
      inputElement.setSelectionRange(2, 2);
      const event = new KeyboardEvent('keydown', { key: 'Delete' });

      // when
      inputElement.dispatchEvent(event);
      tick();

      // then
      expect(inputElement.setSelectionRange).toHaveBeenCalledWith(2, 2);
   }));

   it('#keydown should set caret position when last digit is removed through <Backspace>', fakeAsync(() => {

      // given
      inputElement.value = '123';
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });

      // when
      inputElement.dispatchEvent(event);
      tick();

      // then
      expect(inputElement.setSelectionRange).toHaveBeenCalledWith(2, 2);
   }));

   it('#keydown should set caret position when when thousands separator was removed', fakeAsync(() => {

      // given
      inputElement.value = (1_234).toLocaleString();
      inputElement.selectionStart = 4;
      inputElement.selectionEnd = 4;
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });

      // when
      inputElement.dispatchEvent(event);
      tick();

      // then
      expect(inputElement.setSelectionRange).toHaveBeenCalledWith(2, 2);
   }));
});
