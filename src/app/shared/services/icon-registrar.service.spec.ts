import { TestBed } from '@angular/core/testing';

import { IconRegistrarService } from './icon-registrar.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

describe('IconRegistrarService', () => {

  let service: IconRegistrarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IconRegistrarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#registerSvgIcons should register icons', () => {

    // given
    const iconRegistry = TestBed.inject(MatIconRegistry);
    vi.spyOn(iconRegistry, 'addSvgIcon').mockReturnValue(undefined);

    // when
    service.registerSvgIcons();

    // then
    expect(iconRegistry.addSvgIcon).toHaveBeenCalledTimes(service.svgIcons.length);
  });

  it('#registerSvgIcons should register snap grid icon from svg icons folder', () => {

    // given
    const iconRegistry = TestBed.inject(MatIconRegistry);
    const sanitizer = TestBed.inject(DomSanitizer);
    vi.spyOn(iconRegistry, 'addSvgIcon').mockReturnValue(undefined);

    // when
    service.registerSvgIcons();

    // then
    expect(iconRegistry.addSvgIcon).toHaveBeenCalledWith('snap_grid',
      sanitizer.bypassSecurityTrustResourceUrl('/assets/svg-icons/snap_grid.svg'));
  });
});
