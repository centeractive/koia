export interface StaticPageOptions {
  width?: number;
  scripts?: boolean;
}

/**
 * loads a static page into a same origin sandboxed iframe; the caller removes the returned iframe
 */
export function loadStaticPage(path: string, { width, scripts }: StaticPageOptions = {}): Promise<HTMLIFrameElement> {
  const iframe = document.createElement('iframe');
  iframe.sandbox.add('allow-same-origin');
  if (scripts) {
    iframe.sandbox.add('allow-scripts');
  }
  if (width) {
    iframe.style.width = width + 'px';
    iframe.style.height = '800px';
  }
  const loaded = new Promise<HTMLIFrameElement>(resolve => iframe.addEventListener('load', () => resolve(iframe)));
  iframe.src = path;
  document.body.appendChild(iframe);
  return loaded;
}
