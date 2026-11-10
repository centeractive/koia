import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LanguageService } from 'app/shared/services/language';
import { LanguageSelectComponent } from './language-select.component';

describe('LanguageSelectComponent', () => {

   let fixture: ComponentFixture<LanguageSelectComponent>;
   let languageService: LanguageService;

   beforeEach(async () => {
      TestBed.configureTestingModule({
         declarations: [LanguageSelectComponent],
         imports: [MatDividerModule, MatIconModule, MatMenuModule, MatTooltipModule]
      });
      languageService = TestBed.inject(LanguageService);
      vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
      fixture = TestBed.createComponent(LanguageSelectComponent);
      fixture.detectChanges();
   });

   afterEach(() => document.documentElement.lang = 'en');

   function openMenu(): HTMLButtonElement[] {
      fixture.nativeElement.querySelector('#but_language').click();
      fixture.detectChanges();
      return Array.from(document.querySelectorAll<HTMLButtonElement>('.menu_item_language'));
   }

   function numberFormatItems(): HTMLButtonElement[] {
      openMenu();
      return Array.from(document.querySelectorAll<HTMLButtonElement>('.menu_item_number_format'));
   }

   function buttonText(): string {
      return fixture.nativeElement.querySelector('#but_language .language-code').textContent.trim();
   }

   it('should show abbreviation of current language with drop down caret', () => {

      // then
      expect(buttonText()).toBe('EN');
      const icons = fixture.nativeElement.querySelectorAll('#but_language mat-icon');
      expect(icons.length).toBe(1);
      expect(icons[0].textContent.trim()).toBe('arrow_drop_down');
   });

   it('host should be as high as language button including its margins', () => {

      // when
      const host: HTMLElement = fixture.nativeElement;

      // then
      expect(host.getBoundingClientRect().height).toBe(40);
      expect(getComputedStyle(host).display).toBe('inline-flex');
   });

   it('should list languages in their own language and mark current language', () => {

      // when
      const items = openMenu();

      // then
      expect(items.map(i => i.textContent.trim())).toEqual(['checkEnglish', 'Deutsch', '日本語']);
   });

   it('should switch language when language is selected', async () => {

      // given
      const items = openMenu();

      // when
      items[2].click();
      await fixture.whenStable();
      fixture.detectChanges();

      // then
      expect(languageService.current()).toBe('ja');
      expect(fixture.nativeElement.querySelector('#but_language').getAttribute('aria-label')).toBe('言語');
      expect(buttonText()).toBe('日');
      expect(fixture.nativeElement.querySelector('#but_language').getAttribute('lang')).toBe('ja');
   });

   it('should list number formats with sample in own format and mark automatic one', () => {

      // when
      const items = numberFormatItems();

      // then
      expect(items.map(i => i.textContent.trim())).toEqual(['checkAutomatic (1,234.5)', "1'234.5 (Switzerland)", '1,234.5', '1.234,5', '1 234,5']);
   });

   it('should switch number format when number format is selected', () => {

      // given
      const items = numberFormatItems();

      // when
      items[1].click();
      fixture.detectChanges();

      // then
      expect(languageService.numberFormat()).toBe('de-CH');
      expect(languageService.numberLocaleId()).toBe('de-CH');
      const reopened = numberFormatItems();
      expect(reopened[1].textContent.trim().startsWith('check')).toBe(true);
      expect(reopened[0].textContent.trim().startsWith('check')).toBe(false);
   });

   it('should show automatic number format in regional variant of browser language', async () => {

      // given
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-CH']);
      await languageService.use('de');
      await fixture.whenStable();

      // when
      const items = numberFormatItems();

      // then
      expect(items[0].textContent.trim()).toBe("checkAutomatisch (1'234.5)");
   });
});
