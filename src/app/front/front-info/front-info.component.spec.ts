import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { ReaderService } from 'app/shared/services/reader';
import { findUnsafeExternalLinks, stylesOf, textsOf } from 'app/shared/test';
import { page, userEvent } from 'vitest/browser';
import { FrontInfoComponent } from './front-info.component';

describe('FrontInfoComponent', () => {

  let fixture: ComponentFixture<FrontInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FrontInfoComponent],
      imports: [MatIconModule]
    });
    fixture = TestBed.createComponent(FrontInfoComponent);
  });

  function render(): HTMLElement {
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function topics(host: HTMLElement): HTMLDetailsElement[] {
    return Array.from(host.querySelectorAll<HTMLDetailsElement>('.front-info-topic'));
  }

  function summaryOf(topic: HTMLDetailsElement): HTMLElement {
    return topic.querySelector<HTMLElement>('summary');
  }

  it('should show four topics in order', () => {

    // when
    const host = render();

    // then
    expect(textsOf(host, '.front-info-topic summary h3')).toEqual(['Features', 'Data formats', 'What is a scene?', 'Views']);
  });

  it('should show teaser for every topic', () => {

    // when
    const host = render();

    // then
    expect(textsOf(host, '.front-info-topic summary .front-info-teaser')).toEqual([
      'Raw data is always one click away',
      'CSV, Excel and JSON with full control over the import',
      'One scene per data set, switch between them at any time',
      'Raw data table, pivot tables and dashboards'
    ]);
  });

  it('should collapse all topics initially', () => {

    // when
    const host = render();

    // then
    topics(host).forEach(topic => expect(topic.open).toBe(false));
  });

  it('should open topic when its summary is clicked', () => {

    // given
    const all = topics(render());

    // when
    summaryOf(all[1]).click();

    // then
    expect(all[1].open).toBe(true);
  });

  it('should keep only one topic open', () => {

    // given
    const all = topics(render());
    summaryOf(all[0]).click();

    // when
    summaryOf(all[2]).click();

    // then
    expect(all.map(t => t.open)).toEqual([false, false, true, false]);
  });

  it('should flip chevron of open topic', () => {

    // given
    const all = topics(render());

    // when
    summaryOf(all[0]).click();

    // then
    expect(getComputedStyle(all[0].querySelector('.front-info-chevron')).transform).toBe('matrix(1, 0, 0, -1, 0, 0)');
    expect(getComputedStyle(all[1].querySelector('.front-info-chevron')).transform).toBe('none');
  });

  describe('on hover', () => {

    afterEach(() => userEvent.unhover(summaryOf(topics(fixture.nativeElement)[0])));

    it('should tint hovered topic row', async () => {

      // given
      const summary = summaryOf(topics(render())[0]);

      // when
      await userEvent.hover(summary);

      // then
      expect(getComputedStyle(summary).backgroundColor).toBe('rgba(48, 63, 159, 0.1)');
    });
  });

  it('should hide native disclosure marker', () => {

    // when
    const styles = stylesOf(render(), 'summary');

    // then
    expect(styles.length).toBe(4);
    styles.forEach(s => {
      expect(s.listStyleType).toBe('none');
      expect(s.cursor).toBe('pointer');
    });
  });

  it('should list every reader with name, extension and description', () => {

    // given
    const readers = TestBed.inject(ReaderService).getReaders();

    // when
    const host = render();

    // then
    expect(textsOf(host, '.front-info-readers li')).toEqual(readers
      .map(r => `${r.getSourceName()} (${r.getFileExtension()}) – ${r.getDescription()}`.replace(/\s+/g, ' ').trim()));
  });

  it('should show decorative 40px topic icons', async () => {

    // given
    const icons = Array.from(render().querySelectorAll<HTMLImageElement>('.front-info-topic .landing-tile-icon'));

    // when
    await Promise.all(icons.map(icon => icon.decode()));

    // then
    expect(icons.length).toBe(4);
    icons.forEach(icon => {
      expect(icon.alt).toBe('');
      expect(icon.getBoundingClientRect().width).toBe(40);
      expect(icon.getBoundingClientRect().height).toBe(40);
    });
  });

  it('should open external links in new tab without opener', () => {

    // when
    const host = render();

    // then
    expect(findUnsafeExternalLinks(host)).toEqual([]);
  });

  it('should share tile surface with other tiles', () => {

    // when
    const info = render().querySelector<HTMLElement>('.front-info');

    // then
    const style = getComputedStyle(info);
    expect(info.classList).toContain('landing-tile');
    expect(style.paddingTop).toBe('0px');
    expect(style.borderTopLeftRadius).toBe('12px');
  });

  it('should indent lists moderately', () => {

    // when
    const styles = stylesOf(render(), '.front-info-body ul');

    // then
    expect(styles.length).toBe(5);
    styles.forEach(s => expect(s.paddingLeft).toBe('20px'));
  });

  it('should end topic body with its padding only', () => {

    // when
    const styles = stylesOf(render(), '.front-info-body > :last-child');

    // then
    expect(styles.length).toBe(4);
    styles.forEach(s => expect(s.marginBottom).toBe('0px'));
  });

  it('should separate list items', () => {

    // when
    const styles = stylesOf(render(), '.front-info-body li + li');

    // then
    expect(styles.length).toBe(16);
    styles.forEach(s => expect(s.marginTop).toBe('8px'));
  });

  describe('on desktop', () => {

    beforeAll(() => page.viewport(1280, 800));

    afterAll(() => page.viewport(414, 896));

    it('should keep every list in one column on desktop', () => {

      // when
      const styles = stylesOf(render(), '.front-info-body ul');

      // then
      expect(styles.length).toBe(5);
      styles.forEach(s => expect(s.columnCount).toBe('auto'));
    });

    it('should span topic body across tile width', () => {

      // given
      const topic = topics(render())[0];

      // when
      summaryOf(topic).click();

      // then
      const styles = stylesOf(fixture.nativeElement, '.front-info-body');
      expect(topic.querySelector('.front-info-body').getBoundingClientRect().width).toBe(topic.clientWidth);
      expect(styles.length).toBe(4);
      styles.forEach(s => {
        expect(s.maxWidth).toBe('none');
        expect(s.paddingLeft).toBe('24px');
        expect(s.paddingRight).toBe('24px');
      });
    });

    it('should start topic body at icon edge', () => {

      // given
      const topic = topics(render())[0];

      // when
      summaryOf(topic).click();

      // then
      expect(topic.querySelector('.front-info-body p').getBoundingClientRect().left)
        .toBe(topic.querySelector('.landing-tile-icon').getBoundingClientRect().left);
    });

    it('should span topics across content width', () => {

      // when
      const host = render();

      // then
      const info = host.querySelector<HTMLElement>('.front-info');
      expect(info.getBoundingClientRect().width).toBe(host.getBoundingClientRect().width);
      expect(topics(host)[0].getBoundingClientRect().width).toBe(info.clientWidth);
    });
  });
});
