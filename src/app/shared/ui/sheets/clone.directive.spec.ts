import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CloneDirective } from './clone.directive';

@Component({
  template: '<div id="host" [koiaClone]="source"></div>',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  source: HTMLElement | undefined;
}

describe('CloneDirective', () => {

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, CloneDirective]
    });
    fixture = TestBed.createComponent(HostComponent);
  });

  function host(): HTMLElement {
    return fixture.nativeElement.querySelector('#host');
  }

  function element(text: string): HTMLElement {
    const span = document.createElement('span');
    span.textContent = text;
    return span;
  }

  it('should show copy of source and leave source untouched', () => {

    // given
    const source = element('a');
    fixture.componentInstance.source = source;

    // when
    fixture.detectChanges();

    // then
    expect(host().innerHTML).toBe('<span>a</span>');
    expect(host().firstChild).not.toBe(source);
    expect(source.parentNode).toBeNull();
  });

  it('should replace copy when source changes', () => {

    // given
    fixture.componentInstance.source = element('a');
    fixture.detectChanges();
    fixture.componentInstance.source = element('b');

    // when
    fixture.detectChanges();

    // then
    expect(host().innerHTML).toBe('<span>b</span>');
  });

  it('should be empty without source', () => {

    // given
    fixture.componentInstance.source = element('a');
    fixture.detectChanges();
    fixture.componentInstance.source = undefined;

    // when
    fixture.detectChanges();

    // then
    expect(host().childNodes.length).toBe(0);
  });
});
