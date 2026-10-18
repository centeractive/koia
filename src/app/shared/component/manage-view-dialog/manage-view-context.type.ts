import { View } from 'app/shared/model/view-config';

export interface ManageViewContext<T extends { name: string, modifiedTime: number } = View> {
   views: T[];
   updateViews(deletedViews: T[], renamedViews: T[]): void
}
