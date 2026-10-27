import { SceneFile } from './scene-file';

export class SceneFileCodec {

   static readonly TYPE = 'application/gzip';

   static async encode(sceneFile: SceneFile): Promise<Blob> {
      const stream = new Blob([JSON.stringify(sceneFile)]).stream().pipeThrough(new CompressionStream('gzip'));
      return new Blob([await new Response(stream).arrayBuffer()], { type: SceneFileCodec.TYPE });
   }

   /**
    * rejects when the blob is no gzipped JSON
    */
   static async decode(blob: Blob): Promise<unknown> {
      const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
      return JSON.parse(await new Response(stream).text());
   }
}
