import { SceneInfo } from 'app/shared/model';

/**
 * @returns the active scene first, followed by the others sorted by their last activation time (newest first),
 * scenes that were never activated are sorted by their creation time instead
 */
export function orderSceneInfos(sceneInfos: SceneInfo[], activationTimes: Map<string, number>, activeSceneId: string): SceneInfo[] {
  const sortTime = (si: SceneInfo) => activationTimes.get(si._id) ?? si.creationTime;
  const active = sceneInfos.filter(si => si._id === activeSceneId);
  const others = sceneInfos
    .filter(si => si._id !== activeSceneId)
    .sort((si1, si2) => sortTime(si2) - sortTime(si1));
  return [...active, ...others];
}
