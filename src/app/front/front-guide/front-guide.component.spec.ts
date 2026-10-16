import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { rowCountOf, textsOf } from 'app/shared/test';
import { page } from 'vitest/browser';
import { FrontGuideComponent } from './front-guide.component';

describe('FrontGuideComponent', () => {

  let fixture: ComponentFixture<FrontGuideComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FrontGuideComponent],
      imports: [MatIconModule]
    });
    fixture = TestBed.createComponent(FrontGuideComponent);
  });

  function render(): HTMLElement {
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function configureTileIcon(host: HTMLElement): HTMLElement {
    return host.querySelector<HTMLElement>('.landing-tile:nth-child(4) .landing-tile-icon');
  }

  it('should explain that views are added next to raw data', () => {

    // when
    const host = render();

    // then
    expect(textsOf(host, '.front-guide-intro')).toEqual(['Once your data is loaded, Koia opens its raw data. Add views as tabs next to it.']);
  });

  it('should show four guide tiles in order', () => {

    // when
    const host = render();

    // then
    expect(textsOf(host, '.landing-tile h3')).toEqual(['Explore raw data', 'Pivot table', 'Dashboard', 'Configure elements']);
  });

  it('should show the toolbar icons used in the app', async () => {

    // given
    const images = Array.from(render().querySelectorAll('img'));

    // when
    await Promise.all(images.map(img => img.decode()));

    // then
    const names = new Set(images.map(img => new URL(img.src).pathname));
    expect(names).toEqual(new Set(['raw_data_view', 'pivot_table', 'grid_view']
      .map(name => '/assets/svg-icons/' + name + '.svg')));
    images.forEach(img => expect(img.naturalWidth).toBeGreaterThan(0));
  });

  it('should show settings gear as configure tile icon', () => {

    // when
    const icon = configureTileIcon(render());

    // then
    expect(icon.textContent.trim()).toBe('settings');
    expect(getComputedStyle(icon).fontSize).toBe('40px');
  });

  it('should name toolbar controls', () => {

    // when
    const text = render().textContent;

    // then
    expect(text).toContain('Add Filter');
    expect(text).toContain('New Pivot Table');
    expect(text).toContain('New Dashboard');
  });

  it('should align inline icons with text', () => {

    // when
    const icons = Array.from(render().querySelectorAll('.landing-inline-icon'));

    // then
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach(icon => expect(getComputedStyle(icon).verticalAlign).toBe('middle'));
  });

  describe('on desktop', () => {

    beforeAll(() => page.viewport(1280, 800));

    afterAll(() => page.viewport(414, 896));

    it('should lay out guide tiles in one row', () => {

      // when
      const host = render();

      // then
      expect(rowCountOf(host, '.landing-grid-4 > .landing-tile')).toBe(1);
    });

    it('should align tile icons and texts when a title wraps', () => {

      // given
      fixture.nativeElement.style.width = '1000px';
      const host = render();
      const titleHeights = Array.from(host.querySelectorAll('h3')).map(h => h.getBoundingClientRect().height);

      // when
      const iconRows = rowCountOf(host, '.landing-tile-icon');
      const textRows = rowCountOf(host, '.landing-tile > p');

      // then
      expect(new Set(titleHeights).size).toBeGreaterThan(1);
      expect(iconRows).toBe(1);
      expect(textRows).toBe(1);
    });

    it('should keep configure tile icon 40px square', () => {

      // when
      const rect = configureTileIcon(render()).getBoundingClientRect();

      // then
      expect(rect.width).toBe(40);
      expect(rect.height).toBe(40);
    });
  });
});
