import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Language, LANGUAGE_NAMES, LANGUAGES, LanguageService } from 'app/shared/services/language';

/**
 * lets the user switch the language of the user interface at any time
 */
@Component({
  selector: 'koia-language-select',
  template: `
    <button id="but_language" type="button" [class.language-text-button]="showName"
      [matMenuTriggerFor]="languageMenu" [matTooltip]="'language.select' | translate" [attr.aria-label]="'language.select' | translate">
      <mat-icon>translate</mat-icon>
      @if (showName) {
        <span>{{ nameOf(languageService.current()) }}</span>
      }
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
      gap: 4px;
      padding: 8px;
      border: none;
      border-radius: 50%;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    button#but_language.language-text-button {
      border-radius: 8px;
      padding: 4px 8px;
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

  select(language: Language): void {
    this.languageService.use(language);
  }
}
