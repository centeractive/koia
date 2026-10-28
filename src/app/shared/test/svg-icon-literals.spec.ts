import { TestBed } from '@angular/core/testing';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { registerSvgIconLiterals } from './svg-icon-literals';

describe('registerSvgIconLiterals', () => {

  beforeEach(() => TestBed.configureTestingModule({ imports: [MatIconModule] }));

  it('#registerSvgIconLiterals should make icons resolvable by MatIconRegistry', async () => {

    // when
    registerSvgIconLiterals('file_export');

    // then
    const icon = await firstValueFrom(TestBed.inject(MatIconRegistry).getNamedSvgIcon('file_export'));
    expect(icon).toBeInstanceOf(SVGElement);
  });
});
