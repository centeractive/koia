import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  template: `
    <mat-sidenav-container style="height: 200px; width: 300px">
      <mat-sidenav-content>
        <div style="width: 600px; height: 50px"></div>
      </mat-sidenav-content>
    </mat-sidenav-container>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class SidenavHostComponent { }

describe('global styles', () => {

  function printRule(selectorText: string): CSSStyleRule {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRule[];
      try {
        rules = Array.from(sheet.cssRules);
      } catch {
        continue;
      }
      const printRules = rules
        .filter(r => r instanceof CSSMediaRule && r.media.mediaText === 'print')
        .flatMap(r => Array.from((r as CSSMediaRule).cssRules));
      const rule = printRules.find(r => r instanceof CSSStyleRule && r.selectorText === selectorText);
      if (rule) {
        return rule as CSSStyleRule;
      }
    }
    return undefined;
  }

  it('mat-sidenav-content should hide horizontal overflow and keep vertical scrolling', async () => {

    // given
    TestBed.configureTestingModule({
      declarations: [SidenavHostComponent],
      imports: [MatSidenavModule]
    });
    const fixture = TestBed.createComponent(SidenavHostComponent);

    // when
    fixture.detectChanges();
    await fixture.whenStable();

    // then
    const content: HTMLElement = fixture.nativeElement.querySelector('mat-sidenav-content');
    const style = getComputedStyle(content);
    expect(style.overflowX).toBe('hidden');
    expect(style.overflowY).toBe('auto');
    expect(content.scrollWidth).toBeGreaterThan(content.clientWidth);
    expect(content.offsetHeight - content.clientHeight).toBe(0);
  });

  it('print styles should keep dashboard tiles on one page', () => {

    // when
    const rule = printRule('.div_grid_element, .div_flex_element');

    // then
    expect(rule).toBeDefined();
    expect(rule.style.breakInside).toBe('avoid');
    expect(rule.style.getPropertyPriority('break-inside')).toBe('important');
  });
});
