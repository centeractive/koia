import { Route } from '../../model';
import { TabContent } from '../../model/view-config';

export interface TabContentProvider {

   /**
    * @returns the current content of the tab in its persistable form
    */
   tabContent(): TabContent;

   layout(): Route;
}
