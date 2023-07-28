import { View } from 'app/shared/model/view-config';

export interface ManageViewContext {
   views: View[];
   updateViews(deletedViews: View[], renamedViews: View[]): void
}
