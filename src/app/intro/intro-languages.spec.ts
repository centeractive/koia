describe('intro page languages', () => {

   const STORAGE_KEY = 'koia.language';
   const COPIES = [['de', '/intro/index.de.html'], ['ja', '/intro/index.ja.html']];
   let iframe: HTMLIFrameElement;

   afterEach(() => {
      iframe?.remove();
      localStorage.removeItem(STORAGE_KEY);
   });

   function load(url: string, runScripts = false): Promise<Document> {
      iframe = document.createElement('iframe');
      iframe.sandbox.add('allow-same-origin');
      if (runScripts) {
         iframe.sandbox.add('allow-scripts');
      }
      const loaded = new Promise<Document>(resolve => iframe.addEventListener('load', () => resolve(iframe.contentDocument)));
      iframe.src = url;
      document.body.appendChild(iframe);
      return loaded;
   }

   /**
    * resolves the document once it is located at the expected path or the timeout elapsed
    */
   async function loadedAt(path: string): Promise<Document> {
      for (let i = 0; i < 50 && iframe.contentWindow?.location.pathname !== path; i++) {
         await new Promise(resolve => setTimeout(resolve, 50));
      }
      return iframe.contentDocument;
   }

   function structureOf(doc: Document): string[] {
      return Array.from(doc.body.querySelectorAll('*')).map(e => e.tagName + '#' + e.id + '.' + e.className
         + (e.getAttribute('href') && !e.closest('.intro-languages') && !e.closest('.landing-header-inner > a') ? '>' + e.getAttribute('href') : ''));
   }

   COPIES.forEach(([language, url]) => {

      it(language + ' copy should have same structure as English intro', async () => {

         // given
         const english = structureOf(await load('/intro/index.html'));
         iframe.remove();

         // when
         const doc = await load(url);

         // then
         expect(doc.documentElement.lang).toBe(language);
         expect(structureOf(doc)).toEqual(english);
      });

      it(language + ' copy should mark its own language and link its own page from logo', async () => {

         // when
         const doc = await load(url);

         // then
         expect(doc.querySelector('.intro-languages a[aria-current="page"]').getAttribute('hreflang')).toBe(language);
         expect(doc.querySelector('.landing-header-inner > a').getAttribute('href')).toBe(url);
         expect(doc.body.textContent).not.toContain('Open Koia');
      });
   });

   it('should link every language with hreflang', async () => {

      // when
      const doc = await load('/intro/index.html');

      // then
      const links = Array.from(doc.querySelectorAll('.intro-languages a'));
      expect(links.map(l => [l.getAttribute('hreflang'), l.getAttribute('href')])).toEqual([
         ['en', '/intro/index.html'], ['de', '/intro/index.de.html'], ['ja', '/intro/index.ja.html']
      ]);
   });

   it('should show intro in last selected language', async () => {

      // given
      localStorage.setItem(STORAGE_KEY, 'ja');

      // when
      await load('/intro/index.html', true);

      // then
      const doc = await loadedAt('/intro/index.ja.html');
      expect(doc.documentElement.lang).toBe('ja');
   });

   it('should show intro in requested language and remember it', async () => {

      // given
      localStorage.setItem(STORAGE_KEY, 'ja');

      // when
      await load('/intro/index.html?lang=de', true);

      // then
      const doc = await loadedAt('/intro/index.de.html');
      expect(doc.documentElement.lang).toBe('de');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('de');
   });

   it('should stay on English intro when English was selected', async () => {

      // given
      localStorage.setItem(STORAGE_KEY, 'en');

      // when
      const doc = await load('/intro/index.html', true);

      // then
      expect(doc.documentElement.lang).toBe('en');
   });

   it('should remember language chosen with language link', async () => {

      // given
      const doc = await load('/intro/index.de.html', true);

      // when
      doc.querySelector<HTMLAnchorElement>('.intro-languages a[hreflang="en"]').dispatchEvent(
         new MouseEvent('click', { bubbles: true, cancelable: true }));

      // then
      expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
   });

   [['en', '/intro/index.html', 'EN'], ['de', '/intro/index.de.html', 'DE'], ['ja', '/intro/index.ja.html', '日']].forEach(([language, url, code]) => {

      it(language + ' intro should show language code on closed language button', async () => {

         // when
         const doc = await load(url);

         // then
         const languages = doc.querySelector<HTMLDetailsElement>('details.intro-languages');
         expect(languages.open).toBe(false);
         expect(languages.querySelector('summary').textContent.trim()).toBe(code);
         expect(languages.querySelector('summary').getAttribute('lang')).toBe(language);
      });
   });

   it('should show language button with background', async () => {

      // when
      const doc = await load('/intro/index.html');

      // then
      const summary = doc.querySelector('.intro-languages summary');
      expect(doc.defaultView.getComputedStyle(summary).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
   });

   it('should close language menu when clicking elsewhere', async () => {

      // given
      const doc = await load('/intro/index.de.html', true);
      const languages = doc.querySelector<HTMLDetailsElement>('details.intro-languages');
      languages.open = true;

      // when
      doc.querySelector('h1').dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // then
      expect(languages.open).toBe(false);
   });

   it('should close language menu when pressing escape', async () => {

      // given
      const doc = await load('/intro/index.ja.html', true);
      const languages = doc.querySelector<HTMLDetailsElement>('details.intro-languages');
      languages.open = true;

      // when
      doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      // then
      expect(languages.open).toBe(false);
   });
});
