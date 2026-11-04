import { Injectable } from '@angular/core';
import { ViewElement } from 'app/shared/model/view-config';
import { CommonUtils } from 'app/shared/utils';

export interface ClipboardContent {
  elements: ViewElement[];
  /** width of the pages the elements were copied from */
  pageWidth: number;
  /** number of steps the pasted elements are offset by from the copied ones */
  steps: number;
}

/**
 * holds tiles copied from a dashboard for pasting into the dashboards of the same scene
 */
@Injectable({ providedIn: 'root' })
export class CanvasClipboard {

  private sceneId: string;
  private content: ClipboardContent;

  /**
   * @param cut whether the elements were removed, the first paste then keeps their position
   */
  copy(sceneId: string, elements: ViewElement[], pageWidth: number, cut: boolean): void {
    this.sceneId = sceneId;
    this.content = { elements: CommonUtils.clone(elements) as ViewElement[], pageWidth, steps: cut ? 0 : 1 };
  }

  has(sceneId: string): boolean {
    return !!this.content && this.sceneId === sceneId;
  }

  /**
   * @returns copies of the elements, each paste offset by one step more
   */
  paste(): ClipboardContent {
    const pasted = { ...this.content, elements: CommonUtils.clone(this.content.elements) as ViewElement[] };
    this.content.steps++;
    return pasted;
  }
}
