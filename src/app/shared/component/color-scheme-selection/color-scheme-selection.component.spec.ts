import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { CategoricalColorScheme, ColorSchemeType, SequentialColorScheme } from 'app/shared/color';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ColorSchemeSelectionComponent } from './color-scheme-selection.component';

describe('ColorSchemeSelectionComponent', () => {

  let context: ChartContext;
  let component: ColorSchemeSelectionComponent;
  let fixture: ComponentFixture<ColorSchemeSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ColorSchemeSelectionComponent],
      imports: [MatSliderModule, MatFormFieldModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorSchemeSelectionComponent);
    component = fixture.componentInstance;
    context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    fixture.componentRef.setInput('context', context);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize categorical color schemes', () => {
    expect(component.categoricalSchemes).toEqual([
      CategoricalColorScheme.ACCENT,
      CategoricalColorScheme.CATEGORY_10,
      CategoricalColorScheme.DARK_2,
      CategoricalColorScheme.PAIRED,
      CategoricalColorScheme.PASTEL_1,
      CategoricalColorScheme.PASTEL_2,
      CategoricalColorScheme.SET_1,
      CategoricalColorScheme.SET_2,
      CategoricalColorScheme.SET_3,
      CategoricalColorScheme.TABLEAU_10
    ]);
  });

  it('should initialize sequential color schemes', () => {
    expect(component.sequentialSchemes).toEqual([
      SequentialColorScheme.COOL,
      SequentialColorScheme.INFERNO,
      SequentialColorScheme.PLASMA,
      SequentialColorScheme.RAINBOW,
      SequentialColorScheme.SINEBOW,
      SequentialColorScheme.SPECTRAL,
      SequentialColorScheme.TURBO,
      SequentialColorScheme.VIRIDIS,
      SequentialColorScheme.WARM
    ]);
  });

  it('#ngOnChanges should copy color options of context', () => {
    expect(component.colorOptions).toEqual(context.colorProvider.options);
    expect(component.colorOptions).not.toBe(context.colorProvider.options);
  });

  it('#selectCategoricalScheme should change color provider and keep opacities', () => {

    // given
    component.colorOptions.bgColorOpacity = 0.5;
    component.colorOptions.borderColorOpacity = 0.25;

    // when
    component.selectCategoricalScheme(CategoricalColorScheme.SET_1);

    // then
    expect(context.colorProvider.options).toEqual({
      type: ColorSchemeType.CATEGORICAL,
      scheme: CategoricalColorScheme.SET_1,
      bgColorOpacity: 0.5,
      borderColorOpacity: 0.25
    });
  });

  it('#selectSequentialScheme should change color provider and keep opacities', () => {

    // given
    component.colorOptions.bgColorOpacity = 0.5;
    component.colorOptions.borderColorOpacity = 0.25;

    // when
    component.selectSequentialScheme(SequentialColorScheme.VIRIDIS);

    // then
    expect(context.colorProvider.options).toEqual({
      type: ColorSchemeType.SEQUENTIAL,
      scheme: SequentialColorScheme.VIRIDIS,
      bgColorOpacity: 0.5,
      borderColorOpacity: 0.25
    });
  });

  it('#changeColorProvider should change color provider and keep scheme', () => {

    // given
    const options = context.colorProvider.options;
    component.colorOptions.bgColorOpacity = 0.3;
    component.colorOptions.borderColorOpacity = 0.6;

    // when
    component.changeColorProvider();

    // then
    expect(context.colorProvider.options).toEqual({
      type: options.type,
      scheme: options.scheme,
      bgColorOpacity: 0.3,
      borderColorOpacity: 0.6
    });
  });

  function schemeButton(scheme: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.but_color_scheme[aria-label="' + scheme + '"]');
  }

  function slide(selector: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
  }

  it('#click on categorical scheme button should select scheme', () => {

    // when
    schemeButton(CategoricalColorScheme.SET_1).click();
    fixture.detectChanges();

    // then
    expect(context.colorProvider.options.type).toBe(ColorSchemeType.CATEGORICAL);
    expect(context.colorProvider.options.scheme).toBe(CategoricalColorScheme.SET_1);
    expect(schemeButton(CategoricalColorScheme.SET_1).getAttribute('aria-pressed')).toBe('true');
  });

  it('#click on sequential scheme button should select scheme', () => {

    // when
    schemeButton(SequentialColorScheme.VIRIDIS).click();
    fixture.detectChanges();

    // then
    expect(context.colorProvider.options.type).toBe(ColorSchemeType.SEQUENTIAL);
    expect(context.colorProvider.options.scheme).toBe(SequentialColorScheme.VIRIDIS);
    expect(schemeButton(SequentialColorScheme.VIRIDIS).getAttribute('aria-pressed')).toBe('true');
  });

  it('#change of background opacity slider should change color provider', () => {

    // when
    slide('#input_bg_opacity', '0.4');

    // then
    expect(context.colorProvider.options.bgColorOpacity).toBe(0.4);
  });

  it('#change of border opacity slider should change color provider', () => {

    // when
    slide('#input_border_opacity', '0.6');

    // then
    expect(context.colorProvider.options.borderColorOpacity).toBe(0.6);
  });
});
