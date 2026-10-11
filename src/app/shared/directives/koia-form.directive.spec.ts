import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { KoiaFormDirective } from './koia-form.directive';

@Component({
  template: `
    <div id="host" koiaForm>
      <mat-form-field id="inside"><mat-label>L</mat-label><input matInput>
        <button id="suffix" matSuffix mat-icon-button><mat-icon>x</mat-icon></button></mat-form-field>
      <button id="flat" mat-flat-button>B</button>
    </div>
    <mat-form-field id="outside"><mat-label>L</mat-label><input matInput></mat-form-field>
    <button id="flat_outside" mat-flat-button>B</button>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent { }

describe('KoiaFormDirective', () => {

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KoiaFormDirective, HostComponent],
      imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule]
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  function element(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function customProperty(selector: string, name: string): string {
    return getComputedStyle(element(selector)).getPropertyValue(name).trim();
  }

  it('should add koia-form class to host', () => {

    // then
    expect(element('#host').classList).toContain('koia-form');
  });

  it('should make descendant form fields outlined', () => {

    // then
    expect(element('#inside').classList).toContain('mat-form-field-appearance-outline');
  });

  it('should size subscript of descendant form fields dynamically', () => {

    // then
    expect(element('#inside .mat-mdc-form-field-subscript-dynamic-size')).not.toBeNull();
  });

  it('should keep default fill appearance for form fields outside', () => {

    // then
    expect(element('#outside').classList).toContain('mat-form-field-appearance-fill');
  });

  it('should give descendant form fields compact height', () => {

    // then
    expect(getComputedStyle(element('#inside .mat-mdc-form-field-infix')).minHeight).toBe('40px');
    expect(element('#inside .mat-mdc-text-field-wrapper').offsetHeight).toBe(40);
  });

  it('should round outline of descendant form fields', () => {

    // then
    expect(getComputedStyle(element('#inside .mdc-notched-outline__leading')).borderTopLeftRadius).toBe('8px');
  });

  it('should give descendant buttons field height', () => {

    // then
    expect(customProperty('#flat', '--mat-button-filled-container-height')).toBe('40px');
    expect(customProperty('#flat', '--mat-button-outlined-container-height')).toBe('40px');
  });

  it('should not set button height outside host', () => {

    // then
    expect(customProperty('#flat_outside', '--mat-button-filled-container-height')).toBe('');
  });

  it('should size suffix icon buttons of descendant form fields to field height', () => {

    // then
    expect(customProperty('#suffix', '--mat-icon-button-state-layer-size')).toBe('40px');
    expect(getComputedStyle(element('#suffix')).paddingTop).toBe('8px');
  });
});
