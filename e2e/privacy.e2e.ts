import { expect, test } from './support/fixtures';

const INTROS = ['/intro/index.html', '/intro/index.de.html', '/intro/index.ja.html'];

test('front page, sample raw data and intros request no third-party host', async ({ page, front, baseURL }) => {
   const urls: URL[] = [];
   page.on('request', request => urls.push(new URL(request.url())));

   await front.open('en');
   await front.openSample();
   for (const intro of INTROS) {
      await page.goto(intro);
   }

   const hostnames = urls.filter(url => url.protocol === 'http:' || url.protocol === 'https:').map(url => url.hostname);
   expect([...new Set(hostnames)]).toEqual([new URL(baseURL).hostname]);
});

test('front page renders icons with self-hosted material icons font', async ({ page, front }) => {
   await front.open('en');

   await expect.poll(() => page.evaluate(() => [...document.fonts]
      .some(f => f.family.replace(/"/g, '') === 'Material Icons' && f.status === 'loaded'))).toBe(true);
});
