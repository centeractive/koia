import { GraphOptionsProvider } from './graph-options-provider';
import { GraphContext, GraphNode, DataType, Column, TimeUnit } from 'app/shared/model';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { RawDataRevealService } from 'app/shared/services';

describe('GraphOptionsProvider', () => {

   const sec = 1000;
   const min = 60 * sec;

   let now: number;
   let entries: Object[];
   let context: GraphContext;
   let router: Router;
   let dialogService: MatDialog;
   let optionsProvider: GraphOptionsProvider;

   beforeAll(() => {
      const date = new Date();
      date.setMilliseconds(0);
      date.setSeconds(0);
      now = date.getTime();
      entries = [
         { Time: now, /*                 */ c1: 'a', c2: null },
         { Time: now + 30 * sec, /*      */ c1: 'b', c2: 2 },
         { Time: now + min + sec, /*     */ c1: 'b', c2: 3 },
         { Time: now + min + 30 * sec, /**/ c1: 'b', c2: 3 },
      ];
   });

   beforeEach(() => {
      context = new GraphContext([]);
      context.groupByColumns = [createColumn('Time', DataType.TIME, TimeUnit.MINUTE), createColumn('c1', DataType.TEXT)];
      context.entries = entries;
      router = <Router> { navigateByUrl: (url: string) => null };
      dialogService = <MatDialog> {};
      const rawDataRevealService = new RawDataRevealService(router, dialogService);
      rawDataRevealService.setUseDialog(false);
      optionsProvider = new GraphOptionsProvider(rawDataRevealService);
   });

   it('#createOptions should adopt chart size from context when parent div is undefined', () => {

      // when
      const options = optionsProvider.createOptions(context, undefined);

      // then
      const chart = options['chart'];
      expect(chart.width).toBe(context.width);
      expect(chart.height).toBe(context.height);
   });

   it('#createOptions should adopt chart size from parent div when present', () => {

      // given
      const div = { clientWidth: 111, clientHeight: 222 };

      // when
      const options = optionsProvider.createOptions(context, <HTMLDivElement>div);

      // then
      const chart = options['chart'];
      expect(chart.width).toBe(111);
      expect(chart.height).toBe(222);
   });

   it('#createOptions should adopt rendering options from context', () => {

      // when
      const options = optionsProvider.createOptions(context, undefined);

      // then
      const chart = options['chart'];
      expect(chart.linkStrength).toEqual(context.linkStrength);
      expect(chart.friction).toEqual(context.friction);
      expect(chart.linkDist).toEqual(context.linkDist);
      expect(chart.charge).toEqual(context.charge);
      expect(chart.gravity).toEqual(context.gravity);
      expect(chart.theta).toEqual(context.theta);
      expect(chart.alpha).toEqual(context.alpha);
   });

   it('#createOptions tooltip generator should generate tooltip for root node', () => {

      // when
      const options = optionsProvider.createOptions(context, undefined);

      // then
      const generateTooltip: Function = options['chart'].tooltip.contentGenerator;
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '25' };
      rootNode['series'] = [{ color: 'blue' }];
      const expectedTooltip = '<div class="div_tooltip">'
         + '<span class="tooltip_colored_box" style="background:blue;margin-right:10px;"></span>'
         + 'Root Node (25 Entries)<br><br>Double-click to show data...</div>';
      expect(generateTooltip(rootNode, context)).toEqual(expectedTooltip);
   });

   it('#createOptions tooltip generator should generate tooltip for leaf node representing single item', () => {

      // when
      const options = optionsProvider.createOptions(context, undefined);

      // then
      const generateTooltip: Function = options['chart'].tooltip.contentGenerator;
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: null };
      const leafNode: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '1' };
      leafNode['series'] = [{ color: 'red' }];
      const expectedTooltip = '<div class="div_tooltip">'
         + '<span class="tooltip_colored_box" style="background:red;margin-right:10px;"></span>'
         + 'Level: <b>ERROR</b> (1 Entry)<br><br>Double-click to show data...</div>';
      expect(generateTooltip(leafNode, context)).toEqual(expectedTooltip);
   });

   it('#createOptions tooltip generator should generate tooltip for leaf node representing multiple items', () => {

      // when
      const options = optionsProvider.createOptions(context, undefined);

      // then
      const generateTooltip: Function = options['chart'].tooltip.contentGenerator;
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: null };
      const leafNode: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '3' };
      leafNode['series'] = [{ color: 'red' }];
      const expectedTooltip = '<div class="div_tooltip">'
         + '<span class="tooltip_colored_box" style="background:red;margin-right:10px;"></span>'
         + 'Level: <b>ERROR</b> (3 Entries)<br><br>Double-click to show data...</div>';
      expect(generateTooltip(leafNode, context)).toEqual(expectedTooltip);
   });

   function createColumn(name: string, dataType: DataType, timeUnit?: TimeUnit): Column {
      return {
         name: name,
         dataType: dataType,
         width: 10,
         groupingTimeUnit: timeUnit
      };
   }
});
