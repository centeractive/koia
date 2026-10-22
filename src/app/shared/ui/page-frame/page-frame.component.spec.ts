import { CdkScrollable, CdkScrollableModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { Route } from 'app/shared/model';
import { rightInsetOf } from 'app/shared/test/dom-queries';
import { LanguageSelectComponent } from 'app/shared/ui/language-select/language-select.component';
import { NavButtonsComponent } from 'app/shared/ui/nav-buttons/nav-buttons.component';
import { page } from 'vitest/browser';
import { PageFrameComponent } from './page-frame.component';

@Component({
  template: `
    <koia-page-frame heading="My Page" [active]="active" [scenesExist]="scenesExist">
      <p id="projected">content</p>
    </koia-page-frame>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  active = Route.SCENE;
  scenesExist = false;
}

describe('PageFrameComponent', () => {

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, PageFrameComponent, NavButtonsComponent, LanguageSelectComponent],
      imports: [RouterModule.forRoot([]), CdkScrollableModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule]
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  function element<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector);
  }

  it('should show heading as page title', () => {
    expect(element('h1.page_title').textContent).toBe('My Page');
  });

  it('should pass active page and scenes existence to navigation buttons', () => {

    // when
    const navButtons: NavButtonsComponent = fixture.debugElement.query(By.directive(NavButtonsComponent)).componentInstance;

    // then
    expect(navButtons.active).toBe(Route.SCENE);
    expect(navButtons.scenesExist).toBe(false);
  });

  it('should cover window on canvas below header on header surface', () => {

    // when
    const frame = element('koia-page-frame').getBoundingClientRect();

    // then
    expect([frame.left, frame.top, frame.width, frame.height]).toEqual([0, 0, window.innerWidth, window.innerHeight]);
    expect(getComputedStyle(element('koia-page-frame')).backgroundColor).toBe('rgb(236, 239, 241)');
    expect(getComputedStyle(element('header')).backgroundColor).toBe('rgb(232, 234, 246)');
  });

  it('should project content into scrollable page content', () => {

    // when
    const scrollable = fixture.debugElement.query(By.directive(CdkScrollable)).nativeElement as HTMLElement;

    // then
    expect(scrollable.classList).toContain('page_content');
    expect(scrollable.querySelector('#projected')).toBeTruthy();
  });

  describe('on desktop', () => {

    beforeAll(() => page.viewport(1280, 800));

    afterAll(() => page.viewport(414, 896));

    it('should show language selection at right end of header', () => {

      // when
      const header = element('header');

      // then
      expect(header.lastElementChild.tagName).toBe('KOIA-LANGUAGE-SELECT');
      expect(rightInsetOf(element('#but_language'), header)).toBe(8);
    });
  });
});
