import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Language, LANGUAGE_ABBREVIATIONS, LANGUAGE_NAMES, LANGUAGES, LanguageService } from 'app/shared/services/language';

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
    </mat-menu>`,
  styles: [`
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
    }`],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class LanguageSelectComponent {

  readonly languages = LANGUAGES;

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
}
