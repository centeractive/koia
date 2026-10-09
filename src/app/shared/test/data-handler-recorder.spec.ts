import { DataHandlerRecorder } from './data-handler-recorder';

describe('DataHandlerRecorder', () => {

   let recorder: DataHandlerRecorder;

   beforeEach(() => {
      recorder = new DataHandlerRecorder();
   });

   it('#onValues should accumulate rows of all calls', () => {

      // when
      recorder.onValues([['a', '1']]);
      recorder.onValues([['b', '2'], ['c', '3']]);

      // then
      expect(recorder.values).toEqual([['a', '1'], ['b', '2'], ['c', '3']]);
   });

   it('#onEntries should accumulate entries of all calls', () => {

      // when
      recorder.onEntries([{ x: 1 }]);
      recorder.onEntries([{ x: 2 }, { x: 3 }]);

      // then
      expect(recorder.entries).toEqual([{ x: 1 }, { x: 2 }, { x: 3 }]);
   });

   it('#completion should resolve on complete', async () => {

      // when
      recorder.onComplete();

      // then
      await expect(recorder.completion).resolves.toBeUndefined();
   });

   it('#completion should reject with error on error', async () => {

      // when
      recorder.onError('read failed');

      // then
      await expect(recorder.completion).rejects.toBe('read failed');
   });

   it('#isCanceled should return false', () => {
      expect(recorder.isCanceled()).toBe(false);
   });
});
