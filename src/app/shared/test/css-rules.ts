/**
 * Rules are identified by shape rather than by instanceof, so style sheets of other documents (iframes) are supported.
 */
export function findStyleRule(sheets: Iterable<CSSStyleSheet>, selectorText: string, mediaText?: string): CSSStyleRule | undefined {
  for (const sheet of sheets) {
    let rules: CSSRule[];
    try {
      rules = Array.from(sheet.cssRules);
    } catch {
      continue;
    }
    const candidates = mediaText === undefined ? rules : rules
      .filter(r => isMediaRule(r) && r.media.mediaText === mediaText)
      .flatMap(r => Array.from((r as CSSMediaRule).cssRules));
    const rule = candidates.find(r => isStyleRule(r) && r.selectorText === selectorText);
    if (rule) {
      return rule as CSSStyleRule;
    }
  }
  return undefined;
}

function isMediaRule(rule: CSSRule): rule is CSSMediaRule {
  return 'media' in rule && 'cssRules' in rule;
}

function isStyleRule(rule: CSSRule): rule is CSSStyleRule {
  return 'selectorText' in rule;
}
