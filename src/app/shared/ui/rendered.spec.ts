import { isRendered } from './rendered';

describe('isRendered', () => {

   let parent: HTMLDivElement;

   beforeEach(() => {
      parent = document.createElement('div');
      document.body.appendChild(parent);
   });

   afterEach(() => parent.remove());

   it('should return false for undefined element', () => {
      expect(isRendered(undefined)).toBe(false);
   });

   it('should return false for element not in document', () => {
      expect(isRendered(document.createElement('div'))).toBe(false);
   });

   it('should return false for element hidden by ancestor', () => {

      // given
      const element = document.createElement('div');
      parent.appendChild(element);

      // when
      parent.style.display = 'none';

      // then
      expect(isRendered(element)).toBe(false);
   });

   it('should return true for displayed element in document', () => {

      // given
      const element = document.createElement('div');

      // when
      parent.appendChild(element);

      // then
      expect(isRendered(element)).toBe(true);
   });
});
