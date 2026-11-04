import { ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { ZOrder } from './z-order';

describe('ZOrder', () => {

  const zOrder = new ZOrder();

  function tile(z?: number): ElementContext {
    const context = new SummaryContext([]);
    context.z = z;
    return context;
  }

  function note(z?: number): ElementContext {
    const context = new TextBoxContext([]);
    context.z = z;
    return context;
  }

  function zsOf(contexts: ElementContext[]): number[] {
    return contexts.map(c => c.z);
  }

  it('#toFront should rank tile above others', () => {

    // given
    const contexts = [tile(1), tile(2), tile(3)];

    // when
    zOrder.toFront([contexts[0]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([3, 1, 2]);
  });

  it('#toFront should rank tile without z-order as lowest', () => {

    // given
    const contexts = [tile(2), tile(), tile(), tile(1)];

    // when
    zOrder.toFront([contexts[3]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([3, 1, 2, 4]);
  });

  it('#toFront should keep order among targets', () => {

    // given
    const contexts = [tile(3), tile(1), tile(2), tile(4)];

    // when
    zOrder.toFront([contexts[0], contexts[1]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([4, 3, 1, 2]);
  });

  it('#toBack should rank tile below others', () => {

    // given
    const contexts = [tile(1), tile(2), tile(3)];

    // when
    zOrder.toBack([contexts[2]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([2, 3, 1]);
  });

  it('#toBack should keep order among targets', () => {

    // given
    const contexts = [tile(1), tile(4), tile(2), tile(3)];

    // when
    zOrder.toBack([contexts[1], contexts[3]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([3, 2, 4, 1]);
  });

  it('#forward should swap tile with tile directly above', () => {

    // given
    const contexts = [tile(1), tile(2), tile(3)];

    // when
    zOrder.forward([contexts[0]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([2, 1, 3]);
  });

  it('#forward should move block of targets up by one', () => {

    // given
    const contexts = [tile(1), tile(2), tile(3)];

    // when
    zOrder.forward([contexts[0], contexts[1]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([2, 3, 1]);
  });

  it('#forward should keep topmost tile', () => {

    // given
    const contexts = [tile(1), tile(2)];

    // when
    zOrder.forward([contexts[1]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([1, 2]);
  });

  it('#forward should pass tiles only, not notes drawn above them', () => {

    // given
    const contexts = [tile(1), note(2), tile(3)];

    // when
    zOrder.forward([contexts[0]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([3, 2, 1]);
  });

  it('#forward should rank contexts without z-order first', () => {

    // given
    const contexts = [tile(), tile()];

    // when
    zOrder.forward([contexts[0]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([2, 1]);
  });

  it('#backward should swap note with note directly below', () => {

    // given
    const contexts = [note(1), tile(2), note(3)];

    // when
    zOrder.backward([contexts[2]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([3, 2, 1]);
  });

  it('#backward should move block of targets down by one', () => {

    // given
    const contexts = [tile(1), tile(2), tile(3)];

    // when
    zOrder.backward([contexts[1], contexts[2]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([3, 1, 2]);
  });

  it('#backward should keep lowest tile', () => {

    // given
    const contexts = [tile(1), tile(2)];

    // when
    zOrder.backward([contexts[0]], contexts);

    // then
    expect(zsOf(contexts)).toEqual([1, 2]);
  });
});
