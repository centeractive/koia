import { DataType, Column, TimeUnit } from 'app/shared/model';
import { GraphNode, GraphContext } from 'app/shared/model/graph';
import { GraphUtils } from './graph-utils';
import { DatePipe } from '@angular/common';

describe('GraphUtils', () => {

   const now = new Date().getTime();
   const datePipe = new DatePipe('en-US');
   const rootNode: GraphNode = { parent: null, group: 0, name: '', value: '', info: null };

   it('#createDisplayText should return empty string for root node', () => {

      // when
      const text = GraphUtils.createDisplayText(rootNode, new GraphContext([]));

      // then
      expect(text).toEqual('');
   });

   it('#createDisplayText should return display text for leaf node', () => {

      // given
      const graphContext = new GraphContext([]);
      graphContext.groupByColumns = [createColumn('Path', DataType.TEXT)];
      const node: GraphNode = { parent: rootNode, group: 0, name: 'Path', value: '/var/log/messages', info: '51' };

      // when
      const text = GraphUtils.createDisplayText(node, graphContext);

      // then
      expect(text).toEqual('Path: /var/log/messages (51)');
   });

   it('#findColumnValue should return empty string when no node matches column name', () => {

      // given
      const graphContext = new GraphContext([]);
      graphContext.groupByColumns = [createColumn('Path', DataType.TEXT), createColumn('Level', DataType.TEXT)];
      const pathNode: GraphNode = { parent: rootNode, group: 0, name: 'Path', value: '/var/log/messages', info: '51' };
      const levelNode: GraphNode = { parent: pathNode, group: 0, name: 'Level', value: 'ERROR', info: '7' };

      // when
      const value = GraphUtils.findColumnValue(levelNode, 'Host');

      // then
      expect(value).toEqual('');
   });

   it('#findColumnValue should return value when provided node matches column name', () => {

      // given
      const pathNode: GraphNode = { parent: rootNode, group: 0, name: 'Path', value: '/var/log/messages', info: '51' };
      const levelNode: GraphNode = { parent: pathNode, group: 0, name: 'Level', value: 'ERROR', info: '7' };

      // when
      const value = GraphUtils.findColumnValue(levelNode, 'Level');

      // then
      expect(value).toEqual('ERROR');
   });

   it('#findColumnValue should return value when parent node matches column name', () => {

      // given
      const pathNode: GraphNode = { parent: rootNode, group: 0, name: 'Path', value: '/var/log/messages', info: '51' };
      const levelNode: GraphNode = { parent: pathNode, group: 0, name: 'Level', value: 'ERROR', info: '7' };

      // when
      const value = GraphUtils.findColumnValue(levelNode, 'Path');

      // then
      expect(value).toEqual('/var/log/messages');
   });

   it('#collectNonTimeColumnNames should return empty array when root node', () => {

      // when
      const columnNames = GraphUtils.collectNonTimeColumnNames(rootNode, new GraphContext([]));

      // then
      expect(columnNames).toEqual([]);
   });

   it('#collectNonTimeColumnNames should return empty array when no non-time column is found', () => {

      // given
      const graphContext = new GraphContext([]);
      graphContext.groupByColumns = [createColumn('Created', DataType.TIME, TimeUnit.SECOND)];
      const timeNode: GraphNode = { parent: rootNode, group: 0, name: 'Created (per second)', value: now, info: '88' };

      // when
      const columnNames = GraphUtils.collectNonTimeColumnNames(timeNode, graphContext);

      // then
      expect(columnNames).toEqual([]);
   });

   it('#collectNonTimeColumnNames should return non-time column names', () => {

      // given
      const graphContext = new GraphContext([]);
      graphContext.groupByColumns = [
         createColumn('Date/Time', DataType.TIME, TimeUnit.MINUTE),
         createColumn('Path', DataType.TEXT),
         createColumn('Level', DataType.TEXT),
      ];
      const timeNode: GraphNode = { parent: rootNode, group: 0, name: 'Date/Time (per minute)', value: now, info: '88' };
      const pathNode: GraphNode = { parent: timeNode, group: 0, name: 'Path', value: '/var/log/messages', info: '27' };
      const levelNode: GraphNode = { parent: pathNode, group: 0, name: 'Level', value: 'WARN', info: '4' };

      // when
      const columnNames = GraphUtils.collectNonTimeColumnNames(levelNode, graphContext);

      // then
      expect(columnNames).toEqual(['Path', 'Level']);
   });

   it('#formattedValueOf should return formatted time', () => {

      // given
      const graphContext = new GraphContext([]);
      graphContext.groupByColumns = [createColumn('Date', DataType.TIME, TimeUnit.YEAR)];
      const graphNode: GraphNode = { parent: rootNode, group: 0, name: 'Date (per year)', value: now, info: '156' };

      // when
      const formattedValue = GraphUtils.formattedValueOf(graphNode, graphContext);

      // then
      expect(formattedValue).toEqual(datePipe.transform(now, 'yyyy'));
   });

   it('#formattedValueOf should return non-time value', () => {

      // given
      const graphContext = new GraphContext([]);
      graphContext.groupByColumns = [createColumn('Path', DataType.TEXT)];
      const graphNode: GraphNode = { parent: rootNode, group: 0, name: 'Path', value: 'var/log/messages', info: '51' };

      // when
      const formattedValue = GraphUtils.formattedValueOf(graphNode, graphContext);

      // then
      expect(formattedValue).toEqual('var/log/messages');
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
