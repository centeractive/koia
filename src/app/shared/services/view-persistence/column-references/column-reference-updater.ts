import { ConfigRecord, SavedView, TabDef, View } from 'app/shared/model/view-config';
import type { ComputedColumnChange } from '../../computed-column.service';
import { ChangeLog } from './change-log';
import { ReferenceEditor } from './reference-editor';

interface PivotRecordData {
   valueGroupings?: object[];
   pivotOptions?: object;
}

/**
 * propagates the rename or removal of a computed column to all references to it, other changes leave them untouched
 */
export class ColumnReferenceUpdater {

   constructor(private readonly change: ComputedColumnChange) { }

   isRename(): boolean {
      return this.change.name !== undefined && this.change.name !== this.change.previousName;
   }

   isRemoval(): boolean {
      return this.change.name === undefined;
   }

   affectsReferences(): boolean {
      return this.isRename() || this.isRemoval();
   }

   /**
    * @returns the previous name keyed by the new name of a renamed column, empty otherwise
    */
   renamedFrom(): Map<string, string> {
      return new Map(this.isRename() ? [[this.change.name, this.change.previousName]] : []);
   }

   /**
    * updates the dashboard tabs, pivot tabs and raw data column widths of the specified saved views in place
    *
    * @returns a function that restores exactly the values changed by the update
    */
   inSavedViews(views: SavedView[]): () => void {
      const log = this.edit(e => views.forEach(v => {
         this.editTabs(v.tabs, e);
         e.editKey(v.rawData.data.columnWidths);
      }));
      return () => log.undo();
   }

   inTabs(tabs: TabDef[]): void {
      this.edit(e => this.editTabs(tabs, e));
   }

   inView(view: View): void {
      this.edit(e => this.editView(view, e));
   }

   inRecord(record: ConfigRecord): void {
      this.edit(e => this.editRecord(record, e));
   }

   inWidths(widths: Record<string, number>): void {
      this.edit(e => e.editKey(widths));
   }

   private edit(apply: (editor: ReferenceEditor) => void): ChangeLog {
      const log = new ChangeLog();
      if (this.affectsReferences()) {
         apply(new ReferenceEditor(this.change.previousName, this.change.name, log));
      }
      return log;
   }

   private editTabs(tabs: TabDef[], editor: ReferenceEditor): void {
      tabs.forEach(t => {
         if (t.view) {
            this.editView(t.view, editor);
         }
         if (t.record) {
            this.editRecord(t.record, editor);
         }
      });
   }

   private editView(view: View, editor: ReferenceEditor): void {
      view.elements.forEach(e => {
         ['dataColumns', 'splitColumns', 'groupByColumns'].forEach(k => editor.editNamed(e, k, 'name'));
         ['valueScales', 'valueGroupings'].forEach(k => editor.editNamed(e, k, 'columnName'));
      });
   }

   private editRecord(record: ConfigRecord, editor: ReferenceEditor): void {
      const data = record.data as PivotRecordData;
      editor.editNamed(data, 'valueGroupings', 'columnName');
      if (data.pivotOptions) {
         ['rows', 'cols', 'vals'].forEach(k => editor.editNames(data.pivotOptions, k));
         ['exclusions', 'inclusions', 'inclusionsInfo'].forEach(k => editor.editKey(data.pivotOptions[k]));
      }
   }
}
