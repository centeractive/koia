import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Language, LANGUAGE_ABBREVIATIONS, LANGUAGE_NAMES, LANGUAGES, LanguageService } from 'app/shared/services/language';

/**
 * lets the user switch the language of the user interface at any time
 */
@Component({
  selector: 'koia-language-select',
  template: `
    <button id="but_language" type="button" [class.language-text-button]="showName" [attr.lang]="languageService.current()"
      [matMenuTriggerFor]="languageMenu" [matTooltip]="'language.select' | translate" [attr.aria-label]="'language.select' | translate">
      {{ showName ? nameOf(languageService.current()) : abbreviationOf(languageService.current()) }}
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
      min-width: 40px;
      height: 40px;
      padding: 0 8px;
      border: none;
      border-radius: 8px;
      background: none;
      color: inherit;
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    button#but_language.language-text-button {
      height: auto;
      padding: 4px 8px;
      font-weight: inherit;
    }
    button#but_language:hover {
      background: rgba(0, 0, 0, 0.06);
    }`],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class LanguageSelectComponent {

  @Input() showName = false;

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
