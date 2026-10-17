import { SceneInfo } from 'app/shared/model';
import { orderSceneInfos } from './scene-order';

describe('orderSceneInfos', () => {

  const sceneA = sceneInfo('a', 100);
  const sceneB = sceneInfo('b', 200);
  const sceneC = sceneInfo('c', 300);

  it('should put active scene first despite older activation time', () => {

    // given
    const activationTimes = new Map([['a', 1000], ['b', 3000], ['c', 2000]]);

    // when
    const ordered = orderSceneInfos([sceneA, sceneB, sceneC], activationTimes, 'a');

    // then
    expect(ids(ordered)).toEqual(['a', 'b', 'c']);
  });

  it('should sort other scenes by last activation time descending', () => {

    // given
    const activationTimes = new Map([['a', 1000], ['b', 2000], ['c', 3000]]);

    // when
    const ordered = orderSceneInfos([sceneA, sceneB, sceneC], activationTimes, 'b');

    // then
    expect(ids(ordered)).toEqual(['b', 'c', 'a']);
  });

  it('should sort never activated scenes by creation time descending', () => {

    // when
    const ordered = orderSceneInfos([sceneA, sceneB, sceneC], new Map(), 'a');

    // then
    expect(ids(ordered)).toEqual(['a', 'c', 'b']);
  });

  it('should interleave activation and creation times', () => {

    // given
    const activationTimes = new Map([['a', 250]]);

    // when
    const ordered = orderSceneInfos([sceneA, sceneB, sceneC], activationTimes, undefined);

    // then
    expect(ids(ordered)).toEqual(['c', 'a', 'b']);
  });

  it('should only sort scenes when active scene is unknown', () => {

    // when
    const ordered = orderSceneInfos([sceneA, sceneB, sceneC], new Map(), 'x');

    // then
    expect(ids(ordered)).toEqual(['c', 'b', 'a']);
  });

  it('should not change specified scene infos', () => {

    // given
    const sceneInfos = [sceneA, sceneB, sceneC];

    // when
    orderSceneInfos(sceneInfos, new Map(), 'c');

    // then
    expect(ids(sceneInfos)).toEqual(['a', 'b', 'c']);
  });

  function sceneInfo(id: string, creationTime: number): SceneInfo {
    return { _id: id, creationTime, name: 'Scene ' + id, shortDescription: '', database: 'data_' + id, columnMappings: [] };
  }

  function ids(sceneInfos: SceneInfo[]): string[] {
    return sceneInfos.map(si => si._id);
  }
});
