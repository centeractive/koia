import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Scene, SceneInfo } from 'app/shared/model';
import { DialogService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';

@Component({
  selector: 'koia-scene-table',
  templateUrl: './scene-table.component.html',
  styleUrls: ['./scene-table.component.css']
})
export class SceneTableComponent implements OnChanges {

  @Input() sceneInfos: SceneInfo[];
  @Input() activeScene: Scene;

  @Output() onActivate = new EventEmitter<SceneInfo>();
  @Output() onDelete = new EventEmitter<SceneInfo>();

  tableData: SceneInfo[] = []
  columns = ['actions', 'name', 'shortDescription', 'creationTime'];

  constructor(private dbService: DBService, private dialogService: DialogService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.sceneInfos) {
      this.tableData = this.sceneInfos;
    } else {
      this.tableData = [this.activeScene];
    }
  }

  showSceneDetails(sceneID: string): void {
    this.dbService.findScene(sceneID)
      .then(s => this.dialogService.showSceneDetailsDialog(s));
  }
}
