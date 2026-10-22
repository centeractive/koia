import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule, UrlTree } from '@angular/router';
import { Route } from 'app/shared/model';
import { NavButtonsComponent } from './nav-buttons.component';
import type { Mock } from 'vitest';

@Component({
  template: `
    <koia-nav-buttons [active]="active" [scenesExist]="scenesExist">
      <button id="but_projected" mat-icon-button>x</button>
    </koia-nav-buttons>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  active: Route;
  scenesExist = true;
}

describe('NavButtonsComponent', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let navigateByUrlSpy: Mock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, NavButtonsComponent],
      imports: [RouterModule.forRoot([]), MatButtonModule, MatIconModule, MatTooltipModule]
    });
    navigateByUrlSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(undefined);
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function button(id: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector('#' + id);
  }

  function activeButtonIds(): string[] {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('koia-nav-buttons > button'))
      .filter(b => b.classList.contains('koia-toggle-active') && b.getAttribute('aria-current') === 'page')
      .map(b => b.id);
  }

  it('should show home button, projected content, scenes button and add scene button in order', () => {

    // when
    fixture.detectChanges();

    // then
    const ids = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('koia-nav-buttons > button')).map(b => b.id);
    expect(ids).toEqual(['butHome', 'but_projected', 'butScenes', 'butScene']);
  });

  [
    ['butHome', Route.FRONT, 'Front Page'],
    ['butScenes', Route.SCENES, 'Scenes'],
    ['butScene', Route.SCENE, 'Add Scene']
  ].forEach(([id, route, label]) => {

    it(id + ' should be labeled "' + label + '" and navigate to ' + route, () => {

      // given
      fixture.detectChanges();

      // when
      button(id).click();

      // then
      expect(button(id).getAttribute('aria-label')).toBe(label);
      const urlTree: UrlTree = navigateByUrlSpy.mock.lastCall[0];
      expect(urlTree.toString()).toBe('/' + route);
    });
  });

  it('should mark scenes button as current page when scenes page is active', () => {

    // given
    host.active = Route.SCENES;

    // when
    fixture.detectChanges();

    // then
    expect(activeButtonIds()).toEqual(['butScenes']);
  });

  it('should mark add scene button as current page when scene page is active', () => {

    // given
    host.active = Route.SCENE;

    // when
    fixture.detectChanges();

    // then
    expect(activeButtonIds()).toEqual(['butScene']);
  });

  it('should mark no button when no navigation target is active', () => {

    // when
    fixture.detectChanges();

    // then
    expect(activeButtonIds()).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('[aria-current]').length).toBe(0);
  });

  it('should disable scenes button when no scenes exist', () => {

    // given
    host.scenesExist = false;

    // when
    fixture.detectChanges();

    // then
    expect(button('butScenes').disabled).toBe(true);
    expect(button('butScene').disabled).toBe(false);
  });

  it('should enable scenes button by default', () => {

    // when
    fixture.detectChanges();

    // then
    expect(button('butScenes').disabled).toBe(false);
  });
});
