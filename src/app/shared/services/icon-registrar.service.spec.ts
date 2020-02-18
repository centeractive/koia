import { TestBed } from '@angular/core/testing';

import { IconRegistrarService } from './icon-registrar.service';
import { MatIconRegistry } from '@angular/material/icon';

describe('IconRegistrarService', () => {

  let service: IconRegistrarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.get(IconRegistrarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#registerSvgIcons should register icons', () => {

    // given
    const iconRegistry = TestBed.get(MatIconRegistry);
    spyOn(iconRegistry, 'addSvgIcon');

    // when
    service.registerSvgIcons();

    // then
    expect(iconRegistry.addSvgIcon).toHaveBeenCalledTimes(service.svgIcons.length);
  });
});
