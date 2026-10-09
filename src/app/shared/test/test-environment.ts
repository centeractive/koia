import { getTestBed } from '@angular/core/testing';

export async function installJQueryPlugins(target: Record<string, unknown>): Promise<void> {
   const { default: jQuery } = await import('jquery');
   target['$'] = target['jQuery'] = jQuery;
   await import('jquery-ui-dist/jquery-ui');
   await import('pivottable');
}

export function resetTestDoubles(): void {
   getTestBed().resetTestingModule();
   vi.restoreAllMocks();
}
