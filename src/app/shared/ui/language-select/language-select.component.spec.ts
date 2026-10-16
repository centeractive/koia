import { ComponentFixture, TestBed } from '@angular/core/testing';
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
         imports: [MatIconModule, MatMenuModule, MatTooltipModule]
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
   });

   it('should show name of current language when requested', () => {

      // when
      fixture.componentInstance.showName = true;
      fixture.detectChanges();

      // then
      expect(fixture.nativeElement.querySelector('#but_language').textContent).toContain('English');
   });
});
