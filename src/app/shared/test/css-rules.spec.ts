import { findPageRule, findStyleRule } from './css-rules';

describe('findStyleRule', () => {

  function createSheet(): CSSStyleSheet {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('.a { color: red } @media print { .a { color: blue } }');
    return sheet;
  }

  it('should find top level style rule by selector', () => {

    // when
    const rule = findStyleRule([createSheet()], '.a');

    // then
    expect(rule.style.color).toBe('red');
  });

  it('should find style rule inside matching media rule', () => {

    // when
    const rule = findStyleRule([createSheet()], '.a', 'print');

    // then
    expect(rule.style.color).toBe('blue');
  });

  it('should ignore style rule inside other media rule', () => {

    // when
    const rule = findStyleRule([createSheet()], '.a', 'screen');

    // then
    expect(rule).toBeUndefined();
  });

  it('should return undefined when selector is not found', () => {

    // when
    const rule = findStyleRule([createSheet()], '.b');

    // then
    expect(rule).toBeUndefined();
  });

  it('should skip style sheets whose rules cannot be read', () => {

    // given
    const unreadable = { get cssRules(): CSSRuleList { throw new DOMException('x', 'SecurityError'); } } as unknown as CSSStyleSheet;

    // when
    const rule = findStyleRule([unreadable, createSheet()], '.a');

    // then
    expect(rule.style.color).toBe('red');
  });

  it('should find style rule in style sheet of other document', () => {

    // given
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument;
    const style = iframeDoc.createElement('style');
    style.textContent = '.a { color: green }';
    iframeDoc.head.appendChild(style);

    // when
    const rule = findStyleRule(Array.from(iframeDoc.styleSheets), '.a');

    // then
    expect(rule.style.color).toBe('green');
    iframe.remove();
  });
});

describe('findPageRule', () => {

  function createSheet(): CSSStyleSheet {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('@page { margin: 1mm } @media print { @page { size: landscape } }');
    return sheet;
  }

  it('should find top level page rule', () => {

    // when
    const rule = findPageRule([createSheet()]);

    // then
    expect(rule.style.getPropertyValue('margin')).toBe('1mm');
  });

  it('should find page rule inside matching media rule', () => {

    // when
    const rule = findPageRule([createSheet()], 'print');

    // then
    expect(rule.style.getPropertyValue('size')).toBe('landscape');
  });

  it('should ignore page rule inside other media rule', () => {

    // when
    const rule = findPageRule([createSheet()], 'screen');

    // then
    expect(rule).toBeUndefined();
  });

  it('should find named page rule by name', () => {

    // given
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('@page wide { size: landscape } @page { margin: 1mm } @page narrow { size: portrait }');

    // when
    const rule = findPageRule([sheet], undefined, 'narrow');

    // then
    expect(rule.style.getPropertyValue('size')).toBe('portrait');
  });

  it('should find unnamed page rule by default', () => {

    // given
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('@page wide { size: landscape } @page { margin: 1mm }');

    // when
    const rule = findPageRule([sheet]);

    // then
    expect(rule.style.getPropertyValue('margin')).toBe('1mm');
  });

  it('should return undefined when no page rule exists', () => {

    // given
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('.a { color: red }');

    // when
    const rule = findPageRule([sheet]);

    // then
    expect(rule).toBeUndefined();
  });

  it('should skip style sheets whose rules cannot be read', () => {

    // given
    const unreadable = { get cssRules(): CSSRuleList { throw new DOMException('x', 'SecurityError'); } } as unknown as CSSStyleSheet;

    // when
    const rule = findPageRule([unreadable, createSheet()]);

    // then
    expect(rule.style.getPropertyValue('margin')).toBe('1mm');
  });
});
