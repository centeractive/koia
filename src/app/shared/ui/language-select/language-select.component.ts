import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AUTOMATIC_NUMBER_FORMAT, Language, LANGUAGE_ABBREVIATIONS, LANGUAGE_NAMES, LANGUAGES, LanguageService, NumberFormat, NUMBER_FORMATS } from 'app/shared/services/language';
import { LocalizedNumberPipe } from 'app/shared/pipes';

/**
 * lets the user switch the language of the user interface at any time
 */
@Component({
  selector: 'koia-language-select',
  template: `
    <button id="but_language" type="button" [attr.lang]="languageService.current()"
      [matMenuTriggerFor]="languageMenu" [matTooltip]="'language.select' | translate" [attr.aria-label]="'language.select' | translate">
      <span class="language-code">{{ abbreviationOf(languageService.current()) }}</span>
      <mat-icon class="language-caret" aria-hidden="true">arrow_drop_down</mat-icon>
    </button>
    <mat-menu #languageMenu="matMenu">
      @for (language of languages; track language) {
        <button mat-menu-item class="menu_item_language" [attr.lang]="language" (click)="select(language)">
          <mat-icon>{{ language === languageService.current() ? 'check' : '' }}</mat-icon>
          <span>{{ nameOf(language) }}</span>
        </button>
      }
      <mat-divider />
      <div role="group" aria-labelledby="number_format_title">
        <div id="number_format_title" class="number-format-title">{{ 'language.numberFormat' | translate }}</div>
        @for (format of numberFormats; track format) {
          <button mat-menu-item class="menu_item_number_format" [attr.data-format]="format" (click)="selectNumberFormat(format)">
            <mat-icon>{{ format === languageService.numberFormat() ? 'check' : '' }}</mat-icon>
            <span>{{ labelOf(format) }}</span>
          </button>
        }
      </div>
    </mat-menu>`,
  styles: [`
    :host {
      display: inline-flex;
    }
    button#but_language {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 56px;
      height: 32px;
      margin: 4px 0;
      padding: 0 4px 0 12px;
      border: none;
      border-radius: 16px;
      background: var(--koia-language-bg, rgba(48, 63, 159, 0.10));
      color: var(--koia-language-color, var(--koia-primary, #303f9f));
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    button#but_language:hover, button#but_language:focus-visible {
      background: var(--koia-language-bg-hover, rgba(48, 63, 159, 0.18));
    }
    .language-caret {
      width: 20px;
      height: 20px;
      font-size: 20px;
    }
    .number-format-title {
      padding: 8px 16px 4px;
      font-size: 12px;
      color: var(--koia-text-secondary, rgba(0, 0, 0, 0.6));
    }`],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class LanguageSelectComponent {

  static readonly NUMBER_SAMPLE = 1234.5;

  readonly languages = LANGUAGES;

  readonly numberFormats = NUMBER_FORMATS;

  constructor(public languageService: LanguageService) { }

  nameOf(language: Language): string {
    return LANGUAGE_NAMES[language];
  }

  abbreviationOf(language: Language): string {
    return LANGUAGE_ABBREVIATIONS[language];
  }

  select(language: Language): void {
    this.languageService.use(language);
  }

  /**
   * @returns the sample number in the specified format, for the automatic one with its name, for the Swiss one with the country
   */
  labelOf(format: NumberFormat): string {
    const sample = LocalizedNumberPipe.format(LanguageSelectComponent.NUMBER_SAMPLE, this.languageService.localeIdOfNumberFormat(format));
    if (format === AUTOMATIC_NUMBER_FORMAT) {
      return this.languageService.instant('language.automatic', { sample });
    }
    return format === 'de-CH' ? this.languageService.instant('language.switzerland', { sample }) : sample;
  }

  selectNumberFormat(format: NumberFormat): void {
    this.languageService.useNumberFormat(format);
  }
}
