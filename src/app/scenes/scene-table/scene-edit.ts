import { SceneUtils } from 'app/scene/utils';
import { SceneInfo, SceneLabels } from 'app/shared/model';

export class SceneEdit {

  name: string;
  shortDescription: string;

  constructor(readonly sceneInfo: SceneInfo, private readonly existingSceneNames: Set<string>) {
    this.name = sceneInfo.name;
    this.shortDescription = sceneInfo.shortDescription;
  }

  isNameTaken(): boolean {
    return this.isNameChanged() && this.existingSceneNames.has(this.trimmedName());
  }

  isNameTooLong(): boolean {
    return this.isNameChanged() && this.trimmedName().length > SceneUtils.SCENE_NAME_MAX_LENGTH;
  }

  isSavable(): boolean {
    return !!this.trimmedName() && !!this.trimmedShortDescription() && !this.isNameTaken() && !this.isNameTooLong() &&
      (this.isNameChanged() || this.isShortDescriptionChanged());
  }

  toLabels(): SceneLabels {
    return {
      _id: this.sceneInfo._id,
      name: this.isNameChanged() ? this.trimmedName() : this.sceneInfo.name,
      shortDescription: this.isShortDescriptionChanged() ? this.trimmedShortDescription() : this.sceneInfo.shortDescription
    };
  }

  /** stored values may have surrounding blanks, a value is changed only when its trimmed form differs */
  private isNameChanged(): boolean {
    return this.trimmedName() !== this.sceneInfo.name.trim();
  }

  private isShortDescriptionChanged(): boolean {
    return this.trimmedShortDescription() !== this.sceneInfo.shortDescription.trim();
  }

  private trimmedName(): string {
    return this.name.trim();
  }

  private trimmedShortDescription(): string {
    return this.shortDescription.trim();
  }
}
