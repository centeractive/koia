export class DomMetrics {

  static scrollbarWidth(doc: Document = document): number {
    const probe = doc.createElement('div');
    probe.style.cssText = 'position: absolute; top: -9999px; width: 100px; height: 100px; overflow: scroll;';
    doc.body.appendChild(probe);
    const width = probe.offsetHeight - probe.clientHeight;
    probe.remove();
    return width;
  }
}
