import { RowSpanComputer, Span } from './row-span-computer';

describe('RowSpanComputer', () => {

   let data: object[];
   let rowSpanComputer: RowSpanComputer;

   beforeAll(() => {
      data = [
         { c1: 'a', c2: 1, c3: 'y', c4: '-' },
         { c1: 'a', c2: 1, c3: 'y', c4: '+' },
         { c1: 'a', c2: 2, c3: 'y', c4: '-' },
         { c1: 'b', c2: 2, c3: 'x', c4: '+' },
         { c1: 'b', c2: 3, c3: 'x', c4: '-' },
         { c1: 'b', c2: 3, c3: 'x', c4: '+' }
      ];
      rowSpanComputer = new RowSpanComputer();
   });

   it('#compute should return no spanned rows when non exist in single column', () => {

      // when
      const rowSpans: Array<Span[]> = rowSpanComputer.compute(data, ['c4']);

      // then
      expect(rowSpans).toBeTruthy();
      expect(rowSpans.length).toEqual(1);

      const rowSpansC4 = rowSpans[0];
      expect(rowSpansC4.length).toEqual(6);
      expect(rowSpansC4[0].span).toEqual(1);
      expect(rowSpansC4[1].span).toEqual(1);
      expect(rowSpansC4[2].span).toEqual(1);
      expect(rowSpansC4[3].span).toEqual(1);
      expect(rowSpansC4[4].span).toEqual(1);
      expect(rowSpansC4[5].span).toEqual(1);
   });

   it('#compute should return spanned rows when such exist in single text column', () => {

      // when
      const rowSpans: Array<Span[]> = rowSpanComputer.compute(data, ['c1']);

      // then
      expect(rowSpans).toBeTruthy();
      expect(rowSpans.length).toEqual(1);

      const rowSpansC1 = rowSpans[0];
      expect(rowSpansC1.length).toEqual(6);
      expect(rowSpansC1[0].span).toEqual(3);
      expect(rowSpansC1[1].span).toEqual(0);
      expect(rowSpansC1[2].span).toEqual(0);
      expect(rowSpansC1[3].span).toEqual(3);
      expect(rowSpansC1[4].span).toEqual(0);
      expect(rowSpansC1[5].span).toEqual(0);
   });

   it('#compute should return spanned rows when such exist in single number column', () => {

      // when
      const rowSpans: Array<Span[]> = rowSpanComputer.compute(data, ['c2']);

      // then
      expect(rowSpans).toBeTruthy();
      expect(rowSpans.length).toEqual(1);

      const rowSpansC2 = rowSpans[0];
      expect(rowSpansC2.length).toEqual(6);
      expect(rowSpansC2[0].span).toEqual(2);
      expect(rowSpansC2[1].span).toEqual(0);
      expect(rowSpansC2[2].span).toEqual(2);
      expect(rowSpansC2[3].span).toEqual(0);
      expect(rowSpansC2[4].span).toEqual(2);
      expect(rowSpansC2[5].span).toEqual(0);
   });

   it('#compute should return spanned rows when such exist in two columns', () => {

      // when
      const rowSpans: Array<Span[]> = rowSpanComputer.compute(data, ['c1', 'c2']);

      // then
      expect(rowSpans).toBeTruthy();
      expect(rowSpans.length).toEqual(2);

      const rowSpansC1 = rowSpans[0];
      expect(rowSpansC1.length).toEqual(6);
      expect(rowSpansC1[0].span).toEqual(3);
      expect(rowSpansC1[1].span).toEqual(0);
      expect(rowSpansC1[2].span).toEqual(0);
      expect(rowSpansC1[3].span).toEqual(3);
      expect(rowSpansC1[4].span).toEqual(0);
      expect(rowSpansC1[5].span).toEqual(0);

      const rowSpansC2 = rowSpans[1];
      expect(rowSpansC2.length).toEqual(6);
      expect(rowSpansC2[0].span).toEqual(2);
      expect(rowSpansC2[1].span).toEqual(0);
      expect(rowSpansC2[2].span).toEqual(1);
      expect(rowSpansC2[3].span).toEqual(1);
      expect(rowSpansC2[4].span).toEqual(2);
      expect(rowSpansC2[5].span).toEqual(0);
   });

   it('#compute should return spanned rows when such exist in three columns', () => {

      const rowSpans: Array<Span[]> = rowSpanComputer.compute(data, ['c1', 'c2', 'c3']);

      expect(rowSpans).toBeTruthy();
      expect(rowSpans.length).toEqual(3);

      const rowSpansC1 = rowSpans[0];
      expect(rowSpansC1.length).toEqual(6);
      expect(rowSpansC1[0].span).toEqual(3);
      expect(rowSpansC1[1].span).toEqual(0);
      expect(rowSpansC1[2].span).toEqual(0);
      expect(rowSpansC1[3].span).toEqual(3);
      expect(rowSpansC1[4].span).toEqual(0);
      expect(rowSpansC1[5].span).toEqual(0);

      const rowSpansC2 = rowSpans[1];
      expect(rowSpansC2.length).toEqual(6);
      expect(rowSpansC2[0].span).toEqual(2);
      expect(rowSpansC2[1].span).toEqual(0);
      expect(rowSpansC2[2].span).toEqual(1);
      expect(rowSpansC2[3].span).toEqual(1);
      expect(rowSpansC2[4].span).toEqual(2);
      expect(rowSpansC2[5].span).toEqual(0);

      const rowSpansC3 = rowSpans[2];
      expect(rowSpansC3.length).toEqual(6);
      expect(rowSpansC3[0].span).toEqual(2);
      expect(rowSpansC3[1].span).toEqual(0);
      expect(rowSpansC3[2].span).toEqual(1);
      expect(rowSpansC3[3].span).toEqual(1);
      expect(rowSpansC3[4].span).toEqual(2);
      expect(rowSpansC3[5].span).toEqual(0);
   });
});
