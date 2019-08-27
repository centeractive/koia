import { NodeDoubleClickHandler } from './node-double-click-handler';
import { Query, DataType, Column, TimeUnit, GraphNode, PropertyFilter, GraphContext, Operator } from 'app/shared/model';
import { RawDataRevealService } from 'app/shared/services';

describe('NodeDoubleClickHandler', () => {

   const now = new Date().getTime();
   const min = 60_000;
   const oneHourAgo = now - (60 * min);

   let rawDataRevealService: RawDataRevealService;
   let handler: NodeDoubleClickHandler;

   beforeEach(() => {
      rawDataRevealService = new RawDataRevealService(null, null);
      handler = new NodeDoubleClickHandler(rawDataRevealService);
      spyOn(rawDataRevealService, 'ofTimeUnit');
      spyOn(rawDataRevealService, 'ofQuery');
   });

   it('#onNodeDoubleClicked should reveal raw data of root node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '25' };
      const graphContext = new GraphContext([]);
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(rootNode, graphContext);

      // then
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(graphContext.query, [], []);
   });

   it('#onNodeDoubleClicked should reveal raw data of leaf node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: 'ERROR', info: '25' };
      const graphContext = new GraphContext([]);
      graphContext.groupByColumns = [createColumn('Level', DataType.TEXT)];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(graphContext.query, ['Level'], ['ERROR']);
   });

   it('#onNodeDoubleClicked should reveal raw data of leaf node with <empty> value', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Level', value: PropertyFilter.EMPTY_VALUE, info: '25' };
      const graphContext = new GraphContext([]);
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      const expectedQuery = new Query(new PropertyFilter('Level', Operator.EMPTY, ''));
      expect(rawDataRevealService.ofQuery).toHaveBeenCalledWith(expectedQuery, [], []);
   });

   it('#onNodeDoubleClicked should reveal raw data of time node', () => {

      // given
      const rootNode: GraphNode = { parent: null, group: 0, name: '', value: null, info: '' };
      const node: GraphNode = { parent: rootNode, group: 1, name: 'Time (per hour)', value: oneHourAgo, info: '25' };
      const graphContext = new GraphContext([]);
      const timeColumn = createColumn('Time', DataType.TIME, TimeUnit.HOUR);
      graphContext.groupByColumns = [timeColumn];
      graphContext.query = new Query();

      // when
      handler.onNodeDoubleClicked(node, graphContext);

      // then
      expect(rawDataRevealService.ofTimeUnit).toHaveBeenCalledWith(graphContext.query, [timeColumn], [oneHourAgo], [], []);
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
