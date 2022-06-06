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
      rawDataRevealService = new RawDataRevealService(null);
      handler = new NodeDoubleClickHandler(rawDataRevealService);
      spyOn(rawDataRevealService, 'ofTimeUnit');
      spyOn(rawDataRevealService, 'ofQuery');
   });

   it('#onNodeDoubleClicked should reveal raw data of root node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '25' };
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(rootNode, graphContext);

      // then
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(graphContext.query, [], [], graphContext);
   });

   it('#onNodeDoubleClicked should reveal raw data of leaf node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '25' };
      graphContext.groupByColumns = [levelColumn];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(graphContext.query, ['Level'], ['ERROR'], graphContext);
   });

   it('#onNodeDoubleClicked should reveal raw data of leaf node with <empty> value', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: PropertyFilter.EMPTY_VALUE, info: '25' };
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      const expectedQuery = new Query(new PropertyFilter('Level', Operator.EMPTY, ''));
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(expectedQuery, [], [], graphContext);
   });

   it('#onNodeDoubleClicked should reveal raw data of time node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Time (per hour)', value: oneHourAgo, info: '25' };
      timeColumn.groupingTimeUnit = TimeUnit.HOUR;
      graphContext.groupByColumns = [timeColumn];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      expect(rawDataRevealService.ofTimeUnit).toHaveBeenCalledWith(graphContext.query, [timeColumn], [oneHourAgo], [], [], graphContext);
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
