import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';

export class DragDropEventFactory<T> {

   createInContainerEvent(containerId: string, data: T[], fromIndex: number, toIndex: number): CdkDragDrop<T[], T[]> {
      const event = this.createEvent(fromIndex, toIndex);
      const container: any = { id: containerId, data: data };
      event.container = <CdkDropList<T[]>>container;
      event.previousContainer = event.container;
      event.item = <CdkDrag<T>>{ data: data[fromIndex] };
      return event;
   }

   createCrossContainerEvent(from: ContainerModel<T>, to: ContainerModel<T>): CdkDragDrop<T[], T[]> {
      const event = this.createEvent(from.index, to.index);
      event.container = this.createContainer(to);
      event.previousContainer = this.createContainer(from);
      event.item = <CdkDrag<T>>{ data: from.data[from.index] };
      return event;
   }

   private createEvent(previousIndex: number, currentIndex: number): CdkDragDrop<T[], T[]> {
      return {
         previousIndex: previousIndex,
         currentIndex: currentIndex,
         item: undefined,
         container: undefined,
         previousContainer: undefined,
         isPointerOverContainer: true,
         distance: { x: 0, y: 0 },
         dropPoint: undefined,
         event: new MouseEvent(null)
      };
   }

   private createContainer(model: ContainerModel<T>): CdkDropList<T[]> {
      const container: any = { id: model.id, data: model.data };
      return <CdkDropList<T[]>>container;
   }
}

export interface ContainerModel<T> {
   id: string,
   data: T[],
   index: number
}
