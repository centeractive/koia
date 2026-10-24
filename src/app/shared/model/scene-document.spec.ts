import type { SceneDocument } from '@centeractive/koia-scene-schema';
import { Scene } from './scene.type';

describe('Scene', () => {

   it('should keep scene assignable to published scene document', () => {
      expectTypeOf<Scene>().toExtend<SceneDocument>();
   });
});
