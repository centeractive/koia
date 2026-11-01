import { Injectable } from '@angular/core';

/**
 * remembers the scenes added since the scenes page was last opened
 */
@Injectable({
  providedIn: 'root'
})
export class NewScenesService {

  private sceneIds = new Set<string>();

  add(sceneId: string): void {
    this.sceneIds.add(sceneId);
  }

  /**
   * @returns the IDs of the scenes added since the last call, they are no longer new afterwards
   */
  take(): Set<string> {
    const sceneIds = this.sceneIds;
    this.sceneIds = new Set();
    return sceneIds;
  }
}
