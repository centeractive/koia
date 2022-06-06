import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorSchemeSelectionComponent } from './color-scheme-selection.component';

describe('ColorSchemeSelectionComponent', () => {
  let component: ColorSchemeSelectionComponent;
  let fixture: ComponentFixture<ColorSchemeSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ColorSchemeSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorSchemeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
