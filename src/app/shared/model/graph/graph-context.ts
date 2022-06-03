import { ElementContext, Column, ExportFormat } from '..';
import { ColorProviderFactory, ColorProvider } from 'app/shared/color';

/**
 * Context for d3-force graph
 *
 * @see https://github.com/d3/d3-force
 */
export class GraphContext extends ElementContext {

   private _colorProvider: ColorProvider;
   private _linkStrength = 0.3;
   private _friction = 0.9;
   private _linkDist = 20;
   private _charge = -400;
   private _gravity = 0.1;
   private _theta = 0.8;
   private _alpha = 0.1;

   constructor(columns: Column[],) {
      super(columns);
      this._colorProvider = ColorProviderFactory.create();
   }

   get colorProvider(): ColorProvider {
      return this._colorProvider;
   }

   set colorProvider(colorProvider: ColorProvider) {
      if (this._colorProvider.colorScheme.type !== colorProvider.colorScheme.type ||
         this._colorProvider.colorScheme.scheme !== colorProvider.colorScheme.scheme) {
         this._colorProvider = colorProvider;
         this.fireLookChanged();
      }
   }

   get linkStrength(): number {
      return this._linkStrength;
   }

   set linkStrength(linkStrength: number) {
      if (this._linkStrength !== linkStrength) {
         this._linkStrength = linkStrength;
         this.fireLookChanged();
      }
   }

   get friction(): number {
      return this._friction;
   }

   set friction(friction: number) {
      if (this._friction !== friction) {
         this._friction = friction;
         this.fireLookChanged();
      }
   }

   get linkDist(): number {
      return this._linkDist;
   }

   set linkDist(linkDist: number) {
      if (this._linkDist !== linkDist) {
         this._linkDist = linkDist;
         this.fireLookChanged();
      }
   }

   get charge(): number {
      return this._charge;
   }

   set charge(charge: number) {
      if (this._charge !== charge) {
         this._charge = charge;
         this.fireLookChanged();
      }
   }

   get gravity(): number {
      return this._gravity;
   }

   set gravity(gravity: number) {
      if (this._gravity !== gravity) {
         this._gravity = gravity;
         this.fireLookChanged();
      }
   }

   get theta(): number {
      return this._theta;
   }

   set theta(theta: number) {
      if (this._theta !== theta) {
         this._theta = theta;
         this.fireLookChanged();
      }
   }

   get alpha(): number {
      return this._alpha;
   }

   set alpha(alpha: number) {
      if (this._alpha !== alpha) {
         this._alpha = alpha;
         this.fireLookChanged();
      }
   }

   getTitle(): string {
      if (this.title) {
         return this.title;
      }
      if (this.groupByColumns.length === 0) {
         return 'Relationship: to be defined';
      }
      return 'Relationship: Root⯈' + this.groupByColumns.map(c => c.name).join('⯈');
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [];
   }
}
