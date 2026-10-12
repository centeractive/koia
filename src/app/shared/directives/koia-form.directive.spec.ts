import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
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
      <mat-accordion><mat-expansion-panel id="panel" expanded="true">P</mat-expansion-panel></mat-accordion>
    </div>
    <mat-form-field id="outside"><mat-label>L</mat-label><input matInput></mat-form-field>
    <button id="flat_outside" mat-flat-button>B</button>
    <mat-form-field id="self" koiaForm><mat-label>L</mat-label><input matInput></mat-form-field>
    <mat-form-field id="disabled" koiaForm><mat-label>L</mat-label><input matInput disabled></mat-form-field>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent { }

describe('KoiaFormDirective', () => {

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KoiaFormDirective, HostComponent],
      imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatExpansionModule]
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

  it('should make own form field outlined and compact', () => {

    // then
    expect(element('#self').classList).toContain('koia-form');
    expect(element('#self').classList).toContain('mat-form-field-appearance-outline');
    expect(element('#self .mat-mdc-text-field-wrapper').offsetHeight).toBe(40);
  });

  it('should give enabled own form field white background', () => {

    // when
    const style = getComputedStyle(element('#self .mat-mdc-text-field-wrapper'));

    // then
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.borderRadius).toBe('8px');
  });

  it('should give enabled descendant form field white background', () => {

    // when
    const style = getComputedStyle(element('#inside .mat-mdc-text-field-wrapper'));

    // then
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.borderRadius).toBe('8px');
  });

  it('should keep disabled form field transparent', () => {

    // when
    const style = getComputedStyle(element('#disabled .mat-mdc-text-field-wrapper'));

    // then
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('should give descendant expansion panels white rounded tile look', () => {

    // when
    const style = getComputedStyle(element('#panel'));

    // then
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.borderTopLeftRadius).toBe('10px');
    expect(style.borderTopWidth).toBe('1px');
    expect(style.marginTop).toBe('0px');
  });

  it('should separate descendant accordion panels by gap', () => {

    // then
    expect(getComputedStyle(element('#host mat-accordion')).rowGap).toBe('12px');
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
