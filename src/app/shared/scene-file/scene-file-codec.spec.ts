import { DataType } from 'app/shared/model';
import { SCENE_FILE_FORMAT, SCENE_FILE_VERSION, SceneFile } from './scene-file';
import { SceneFileCodec } from './scene-file-codec';

describe('SceneFileCodec', () => {

   const sceneFile: SceneFile = {
      format: SCENE_FILE_FORMAT,
      version: SCENE_FILE_VERSION,
      scene: {
         creationTime: 1, name: 'Sales', shortDescription: '', database: 'data_1', columnMappings: [],
         columns: [{ name: 'Amount', dataType: DataType.NUMBER, width: 10 }], config: { savedViews: [] }
      },
      tabs: [],
      entries: [{ Amount: 1 }, { Amount: 2 }]
   };

   async function gzipped(text: string): Promise<Blob> {
      return new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).blob();
   }

   it('#encode should gzip scene file', async () => {

      // when
      const blob = await SceneFileCodec.encode(sceneFile);

      // then
      expect(blob.type).toBe('application/gzip');
      expect([...new Uint8Array(await blob.arrayBuffer()).slice(0, 2)]).toEqual([0x1f, 0x8b]);
   });

   it('#decode should restore encoded scene file', async () => {

      // given
      const blob = await SceneFileCodec.encode(sceneFile);

      // when
      const content = await SceneFileCodec.decode(blob);

      // then
      expect(content).toEqual(sceneFile);
   });

   it('#decode should reject plain text', async () => {

      // when
      const result = SceneFileCodec.decode(new Blob(['a,b\n1,2']));

      // then
      await expect(result).rejects.toBeDefined();
   });

   it('#decode should reject gzipped text that is no JSON', async () => {

      // when
      const result = SceneFileCodec.decode(await gzipped('a,b\n1,2'));

      // then
      await expect(result).rejects.toThrow(SyntaxError);
   });
});
