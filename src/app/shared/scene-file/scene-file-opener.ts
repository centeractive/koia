import { Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { Route } from 'app/shared/model';
import { LanguageService } from 'app/shared/services/language';
import { CommonUtils } from 'app/shared/utils';
import { SCENE_FILE_EXTENSION } from './scene-file';
import { SceneFileService } from './scene-file.service';

/**
 * opens the .koia file selected in a file input as new scene and shows its raw data, the import can be canceled
 */
export class SceneFileOpener {

  readonly extension = SCENE_FILE_EXTENSION;
  importing = false;
  private sceneFileImport: AbortController;
  private destroyed = false;

  constructor(private sceneFileService: SceneFileService, private router: Router, private notifier: AbstractComponent) { }

  /**
   * true while an import runs that was not canceled yet
   */
  get cancelable(): boolean {
    return !!this.sceneFileImport && !this.sceneFileImport.signal.aborted;
  }

  /**
   * opens the file selection of the input unless an import runs
   */
  select(input: HTMLInputElement): void {
    if (!this.importing) {
      input.click();
    }
  }

  /**
   * inserts the scene of the selected .koia file as new scene and shows its raw data
   */
  open(input: HTMLInputElement): void {
    const file = input.files[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.importing = true;
    const sceneFileImport = this.sceneFileImport = new AbortController();
    CommonUtils.afterNextPaint()
      .then(() => this.sceneFileService.import(file, sceneFileImport.signal))
      .then(() => {
        (this.router.routeReuseStrategy as AppRouteReuseStrategy).clear();
        return this.destroyed ? false : this.router.navigateByUrl(Route.RAWDATA);
      })
      .catch(err => {
        this.importing = false;
        this.sceneFileImport = undefined;
        if (sceneFileImport.signal.aborted) {
          this.notifier.notifyWarning(LanguageService.instant('sceneFile.importCanceled'));
        } else {
          this.notifier.notifyError(err);
        }
      });
  }

  /**
   * aborts the running import, the partially inserted scene is deleted
   */
  cancel(): void {
    this.sceneFileImport.abort();
  }

  /**
   * aborts the running import when the page of this opener is left, a completed import no longer shows its raw data
   */
  destroy(): void {
    this.destroyed = true;
    this.sceneFileImport?.abort();
  }
}
