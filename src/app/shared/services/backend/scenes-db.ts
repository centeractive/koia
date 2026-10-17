export const SCENES_DB = 'scenes';

const SCENE_TABS_SUFFIX = '_tabs';

/**
 * @returns the _id of the document holding the open tabs of the specified scene
 */
export function sceneTabsId(sceneId: string): string {
   return sceneId + SCENE_TABS_SUFFIX;
}

const SCENE_ACTIVATION_SUFFIX = '_activation';

/**
 * @returns the _id of the document holding the last activation time of the specified scene
 */
export function sceneActivationId(sceneId: string): string {
   return sceneId + SCENE_ACTIVATION_SUFFIX;
}
