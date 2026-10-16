/**
 * Rules are identified by shape or type rather than by instanceof, so style sheets of other documents (iframes) are supported.
 */
export function findStyleRule(sheets: Iterable<CSSStyleSheet>, selectorText: string, mediaText?: string): CSSStyleRule | undefined {
  return rulesOf(sheets, mediaText).find(r => isStyleRule(r) && r.selectorText === selectorText) as CSSStyleRule;
}

export function findPageRule(sheets: Iterable<CSSStyleSheet>, mediaText?: string): CSSPageRule | undefined {
  return rulesOf(sheets, mediaText).find(r => r.type === CSSRule.PAGE_RULE) as CSSPageRule;
}

function rulesOf(sheets: Iterable<CSSStyleSheet>, mediaText: string | undefined): CSSRule[] {
  return Array.from(sheets).flatMap(sheet => {
    let rules: CSSRule[];
    try {
      rules = Array.from(sheet.cssRules);
    } catch {
      return [];
    }
    return mediaText === undefined ? rules : rules
      .filter(r => isMediaRule(r) && r.media.mediaText === mediaText)
      .flatMap(r => Array.from((r as CSSMediaRule).cssRules));
  });
}

function isMediaRule(rule: CSSRule): rule is CSSMediaRule {
  return 'media' in rule && 'cssRules' in rule;
}

function isStyleRule(rule: CSSRule): rule is CSSStyleRule {
  return 'selectorText' in rule;
}
