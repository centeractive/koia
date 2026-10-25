import { View } from 'app/shared/model/view-config';

export interface ViewRename<T> {
   view: T;
   name: string;
}

export interface ManageViewContext<T extends { name: string, modifiedTime: number } = View> {
   views: T[];

   /**
    * deletes and renames the views, the dialog leaves the views unchanged
    */
   updateViews(deletedViews: T[], renames: ViewRename<T>[]): void
}
