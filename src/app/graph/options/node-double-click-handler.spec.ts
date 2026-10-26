import { NodeDoubleClickHandler } from './node-double-click-handler';
import { Query, DataType, Column, TimeUnit, PropertyFilter, Operator } from 'app/shared/model';
import { GraphContext, GraphNode } from 'app/shared/model/graph';
import { RawDataRevealService } from 'app/shared/services';

describe('NodeDoubleClickHandler', () => {

   const now = new Date().getTime();
   const min = 60_000;
   const oneHourAgo = now - (60 * min);

   const timeColumn = createColumn('Time', DataType.TIME, TimeUnit.MINUTE);
   const levelColumn = createColumn('Level', DataType.TEXT);

   let graphContext: GraphContext;
   let rawDataRevealService: RawDataRevealService;
   let handler: NodeDoubleClickHandler;

   beforeEach(() => {
      graphContext = new GraphContext([timeColumn, levelColumn]);
      rawDataRevealService = new RawDataRevealService(null, null, null, null);
      handler = new NodeDoubleClickHandler(rawDataRevealService);
      vi.spyOn(rawDataRevealService, 'ofTimeUnit').mockReturnValue(undefined);
      vi.spyOn(rawDataRevealService, 'ofQuery').mockReturnValue(undefined);
   });

   it('#onNodeDoubleClicked should reveal raw data of root node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '25', count: 25 };
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(rootNode, graphContext);

      // then
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(graphContext.query, [], [], graphContext, graphContext.query);
   });

   it('#onNodeDoubleClicked should reveal raw data of leaf node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '', count: 0 };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '25', count: 25 };
      graphContext.groupByColumns = [levelColumn];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(graphContext.query, ['Level'], ['ERROR'], graphContext, graphContext.query);
   });

   it('#onNodeDoubleClicked should reveal raw data of leaf node with <empty> value', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '', count: 0 };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: PropertyFilter.EMPTY_VALUE, info: '25', count: 25 };
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      const expectedQuery = new Query(new PropertyFilter('Level', Operator.EMPTY, ''));
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(expectedQuery, [], [], graphContext, graphContext.query);
   });

   it('#onNodeDoubleClicked should reveal raw data of time node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '', count: 0 };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Time (per hour)', value: oneHourAgo, info: '25', count: 25 };
      timeColumn.groupingTimeUnit = TimeUnit.HOUR;
      graphContext.groupByColumns = [timeColumn];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      expect(rawDataRevealService.ofTimeUnit).toHaveBeenCalledWith(graphContext.query, [timeColumn], [oneHourAgo], [], [], graphContext, graphContext.query);
   });

   it('#onNodeDoubleClicked should reveal raw data of time node within time columns of its hierarchy level', () => {

      // given
      const endColumn = createColumn('End', DataType.TIME, TimeUnit.MINUTE);
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '', count: 0 };
      const timeNode: GraphNode = { parent: rootNode, group: 1, name: 'Time (per hour)', value: oneHourAgo, info: '25', count: 25 };
      const levelNode: GraphNode = { parent: timeNode, group: 2, name: 'Level', value: 'ERROR', info: '10', count: 10 };
      timeColumn.groupingTimeUnit = TimeUnit.HOUR;
      graphContext = new GraphContext([timeColumn, levelColumn, endColumn]);
      graphContext.groupByColumns = [timeColumn, levelColumn, endColumn];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(levelNode, graphContext);

      // then
      expect(rawDataRevealService.ofTimeUnit).toHaveBeenCalledWith(graphContext.query, [timeColumn], [oneHourAgo], ['Level'], ['ERROR'],
         graphContext, graphContext.query);
   });

   it('#onNodeDoubleClicked should reveal raw data of time node with <empty> value', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '', count: 0 };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Time (per hour)', value: PropertyFilter.EMPTY_VALUE, info: '3', count: 3 };
      timeColumn.groupingTimeUnit = TimeUnit.HOUR;
      graphContext.groupByColumns = [timeColumn];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      const expectedQuery = new Query(new PropertyFilter('Time', Operator.EMPTY, ''));
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(expectedQuery, [], [], graphContext, graphContext.query);
      expect(rawDataRevealService.ofTimeUnit).not.toHaveBeenCalled();
   });

   it('#onNodeDoubleClicked should reveal raw data of leaf node below grouped time node and time node with <empty> value', () => {

      // given
      const endColumn = createColumn('End', DataType.TIME, TimeUnit.MINUTE);
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '', count: 0 };
      const timeNode: GraphNode = { parent: rootNode, group: 1, name: 'Time (per hour)', value: oneHourAgo, info: '', count: 10 };
      const endNode: GraphNode = { parent: timeNode, group: 1, name: 'End (per minute)', value: PropertyFilter.EMPTY_VALUE, info: '', count: 10 };
      const levelNode: GraphNode = { parent: endNode, group: 1, name: 'Level', value: 'ERROR', info: '10', count: 10 };
      timeColumn.groupingTimeUnit = TimeUnit.HOUR;
      graphContext = new GraphContext([timeColumn, levelColumn, endColumn]);
      graphContext.groupByColumns = [timeColumn, endColumn, levelColumn];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(levelNode, graphContext);

      // then
      const expectedQuery = new Query(new PropertyFilter('End', Operator.EMPTY, ''));
      expect(rawDataRevealService.ofTimeUnit).toHaveBeenCalledWith(expectedQuery, [timeColumn], [oneHourAgo], ['Level'], ['ERROR'],
         graphContext, graphContext.query);
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
