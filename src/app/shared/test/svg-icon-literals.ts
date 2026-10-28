import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * registers empty svg icons so that real MatIcons find the icons that IconRegistrarService registers in production
 */
export function registerSvgIconLiterals(...icons: string[]): void {
  const sanitizer = TestBed.inject(DomSanitizer);
  icons.forEach(icon => TestBed.inject(MatIconRegistry).addSvgIconLiteral(icon, sanitizer.bypassSecurityTrustHtml('<svg></svg>')));
}
