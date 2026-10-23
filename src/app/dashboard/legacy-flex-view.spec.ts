import { CanvasPaging, Route } from 'app/shared/model';
import { View, ViewElement } from 'app/shared/model/view-config';
import { isLegacyFlexView } from './legacy-flex-view';

describe('isLegacyFlexView', () => {

  function viewOf(route: Route, canvasPaging: CanvasPaging, xs: number[]): View {
    return { route, canvasPaging, elements: xs.map(x => ({ x }) as ViewElement) } as View;
  }

  it.each([
    { case: 'flex view without positions', view: viewOf(Route.FLEX, undefined, [undefined, undefined]), expected: true },
    { case: 'grid view', view: viewOf(Route.GRID, undefined, [undefined]), expected: false },
    { case: 'flex view with paging', view: viewOf(Route.FLEX, CanvasPaging.PORTRAIT, [undefined]), expected: false },
    { case: 'flex view with positions', view: viewOf(Route.FLEX, undefined, [0]), expected: false },
    { case: 'flex view partly positioned', view: viewOf(Route.FLEX, undefined, [0, undefined]), expected: false },
    { case: 'empty flex view', view: viewOf(Route.FLEX, undefined, []), expected: false }
  ])('should recognise $case as legacy flex view: $expected', ({ view, expected }) => {

    // when
    const result = isLegacyFlexView(view);

    // then
    expect(result).toBe(expected);
  });
});
