import { claimClick, isClickClaimed } from './claimed-click';

describe('claimed click', () => {

   it('#isClickClaimed should be true for claimed click', () => {

      // given
      const event = new MouseEvent('click');

      // when
      claimClick(event);

      // then
      expect(isClickClaimed(event)).toBe(true);
   });

   it('#isClickClaimed should be false for other click', () => {

      // given
      claimClick(new MouseEvent('click'));

      // when
      const claimed = isClickClaimed(new MouseEvent('click'));

      // then
      expect(claimed).toBe(false);
   });
});
