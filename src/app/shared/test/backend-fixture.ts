import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import PouchDB from 'pouchdb';
import { Column, DataType, Scene } from '../model';
import { DBService } from '../services/backend';
import { CouchDBService } from '../services/backend/couchdb';
import { CouchDBConfig } from '../services/backend/couchdb/couchdb-config';
import { waitFrames, waitStable } from './animation-frames';
import { SceneFactory } from './scene-factory';

export interface Backend {
   name: 'CouchDB' | 'PouchDB';
   init: (db: DBService) => Promise<unknown>;
}

export const BACKENDS: Backend[] = [
   { name: 'CouchDB', init: db => db.initBackend(false) },
   { name: 'PouchDB', init: db => db.useIndexedDb() }
];

export const IT_DB_PREFIX = 'test_';

export const IT_COLUMNS: Column[] = [
   { name: 'ID', dataType: DataType.NUMBER, width: 6, indexed: true },
   { name: 'Level', dataType: DataType.TEXT, width: 8, indexed: true },
   { name: 'Amount', dataType: DataType.NUMBER, width: 8, indexed: true },
   { name: 'Data', dataType: DataType.TEXT, width: 20 }
];

export const IT_PROVIDERS = [CouchDBService, provideHttpClient(withXhr(), withInterceptorsFromDi())];

export interface SceneData {
   scene: Scene;
   entries: object[];
}

export function createEntries(count: number): object[] {
   return Array.from({ length: count }, (_, index) => {
      const id = index + 1;
      const entry = {
         _id: String(id).padStart(4, '0'),
         ID: id,
         Level: ['INFO', 'WARN', 'ERROR'][index % 3],
         Amount: id * 10,
         Data: id % 5 === 0 ? 'word '.repeat(60) + id : 'line ' + id
      };
      return id % 7 === 0 ? { ...entry, bgcolor: '#ffeeee', fgcolor: '#990000' } : entry;
   });
}

export interface BackendRun {
   db: DBService;
   prefix: string;
   scenes: SceneData[];
}

let runCounter = 0;

export function sceneData(name: string, entryCount: number): SceneData {
   return { scene: SceneFactory.createScene(name, IT_COLUMNS), entries: createEntries(entryCount) };
}

export async function setUpBackend(backend: Backend, scenes: SceneData[]): Promise<BackendRun> {
   const prefix = IT_DB_PREFIX + Date.now() + '_' + runCounter++ + '_';
   scenes.forEach(s => s.scene.database = prefix + 'data_' + s.scene._id);
   const db = new DBService(TestBed.inject(CouchDBService), TestBed.inject(NgZone));
   db.setDbPrefix(prefix);
   await backend.init(db);
   expect(db.isCouchDbInUse()).toBe(backend.name === 'CouchDB');
   for (const { scene, entries } of scenes) {
      await db.persistScene(scene, true);
      await db.writeEntries(scene.database, entries);
   }
   return { db, prefix, scenes };
}

export async function tearDownBackend(run: BackendRun): Promise<void> {
   new CouchDBConfig().reset();
   if (run.db.isCouchDbInUse()) {
      await TestBed.inject(CouchDBService).clear(run.prefix);
   } else {
      const databases = [run.prefix + DBService.SCENES, ...run.scenes.map(s => s.scene.database)];
      await Promise.all(databases.map(database => new PouchDB(database).destroy()));
   }
}

export async function scrollTableTo(root: HTMLElement, offset: number): Promise<void> {
   const scroller: HTMLElement = root.querySelector('.vt');
   scroller.scrollTop = offset;
   const rowVisible = () => {
      const viewport = scroller.getBoundingClientRect();
      return Array.from(root.querySelectorAll('.vt-row')).some(row => {
         const rect = row.getBoundingClientRect();
         return rect.bottom > viewport.top && rect.top < viewport.bottom;
      });
   };
   await waitFrames(() => rowVisible() && !root.querySelector('.vt-loading') && !root.querySelector('mat-progress-bar'), 600);
   await waitStable(() => root.querySelectorAll('.vt-row').length, 3, 60);
}
