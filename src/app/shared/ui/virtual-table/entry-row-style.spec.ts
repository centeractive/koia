import { entryRowStyle } from './entry-row-style';

describe('entryRowStyle', () => {

   it('should style row with colors of entry', () => {
      expect(entryRowStyle({ Level: 'ERROR', bgcolor: '#ff785a', fgcolor: '#000000' })).toEqual({ background: '#ff785a', color: '#000000' });
   });

   it('should style row without colors when entry has none', () => {
      expect(entryRowStyle({ Level: 'INFO' })).toEqual({ background: undefined, color: undefined });
   });
});
