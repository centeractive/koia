import { routes } from './app-routing.module';
import { Route } from './shared/model';
import { ViewTabComponent } from './view-tab/view-tab.component';

describe('AppRoutingModule', () => {

   it('#routes should map view tab route to view tab component', () => {

      // when
      const route = routes.find(r => r.path === 'view/:id');

      // then
      expect(route.component).toBe(ViewTabComponent);
   });

   it('#routes should not contain former pivot, grid and flex routes', () => {

      // when
      const paths = routes.map(r => r.path);

      // then
      expect(paths).not.toContain(Route.PIVOT);
      expect(paths).not.toContain(Route.GRID);
      expect(paths).not.toContain(Route.FLEX);
   });

   it('#routes should redirect unknown paths to front page', () => {

      // when
      const route = routes.find(r => r.path === '**');

      // then
      expect(route.redirectTo).toBe('/' + Route.FRONT);
   });
});
