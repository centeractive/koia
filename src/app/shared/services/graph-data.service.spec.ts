import { GraphDataService } from './graph-data.service';
import { Column, PropertyFilter, DataType, TimeUnit } from 'app/shared/model';
import { GraphContext, GraphNode } from 'app/shared/model/graph';

describe('GraphDataService', () => {

   const sec = 1000;
   const min = 60 * sec;

   let now: number;
   let entries: object[];
   let columns: Column[];
   let dataService: GraphDataService;
   let context: GraphContext;

   beforeAll(() => {
      const date = new Date();
      date.setMilliseconds(0);
      date.setSeconds(0);
      now = date.getTime();
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
         { name: 'c1', dataType: DataType.TEXT, width: 100, indexed: true },
         { name: 'c2', dataType: DataType.NUMBER, width: 100, indexed: true },
      ];
      entries = [
         { Time: now, /*                 */ c1: 'a', c2: null },
         { Time: now + 30 * sec, /*      */ c1: 'b', c2: 2 },
         { Time: now + min + sec, /*     */ c1: 'b', c2: 3 },
         { Time: now + min + 30 * sec, /**/ c1: 'b', c2: 3 },
      ];
      dataService = new GraphDataService();
   });

   beforeEach(() => {
      context = new GraphContext(columns);
      context.entries = entries;
   });

   /**
    *              o
    *             / \
    *            /   \
    *          a:1   b:3
    */
   it('#createData should return root-child relationship when text column is selected', () => {

      // given
      context.groupByColumns = [findColumn('c1')];

      // when
      const data = dataService.createData(context);

      // then
      const nodes: GraphNode[] = data['nodes'];
      expect(nodes.length).toEqual(3);
      const rootNode = nodes[0];
      expect(rootNode).toEqual({ parent: null, group: 0, name: '', value: '', info: null });

      expect(nodes[1].parent).toEqual(rootNode);
      expect(nodes[1].group).toEqual(1);
      expect(nodes[1].name).toEqual('c1');
      expect(nodes[1].value).toEqual('a');
      expect(nodes[1].info).toEqual('1');

      expect(nodes[2].parent).toEqual(rootNode);
      expect(nodes[2].group).toEqual(2);
      expect(nodes[2].name).toEqual('c1');
      expect(nodes[2].value).toEqual('b');
      expect(nodes[2].info).toEqual('3');
   });

   /**
    *              o
    *             / \
    *            /   \
    *          now  now +1m
    *          / \     \
    *         /   \     \
    *       a:1   b:1   b:2
    */
   it('#createData should return root & two-level relationship when grouped by time', () => {

      // given
      context.groupByColumns = [findColumn('Time'), findColumn('c1')];

      // when
      const data = dataService.createData(context);

      // then
      const nodes: GraphNode[] = data['nodes'];
      expect(nodes.length).toEqual(6);
      const rootNode = nodes[0];
      expect(rootNode).toEqual({ parent: null, group: 0, name: '', value: '', info: null });

      expect(nodes[1].parent).toEqual(rootNode);
      expect(nodes[1].group).toEqual(1);
      expect(nodes[1].name).toEqual('Time (per minute)');
      expect(nodes[1].value).toEqual(now);
      expect(nodes[1].info).toBeNull();

      expect(nodes[2].parent).toEqual(nodes[1]);
      expect(nodes[2].group).toEqual(1);
      expect(nodes[2].name).toEqual('c1');
      expect(nodes[2].value).toEqual('a');
      expect(nodes[2].info).toEqual('1');

      expect(nodes[3].parent).toEqual(nodes[1]);
      expect(nodes[3].group).toEqual(1);
      expect(nodes[3].name).toEqual('c1');
      expect(nodes[3].value).toEqual('b');
      expect(nodes[3].info).toEqual('1');

      expect(nodes[4].parent).toEqual(rootNode);
      expect(nodes[4].group).toEqual(2);
      expect(nodes[4].name).toEqual('Time (per minute)');
      expect(nodes[4].value).toEqual(now + min);
      expect(nodes[4].info).toBeNull();

      expect(nodes[5].parent).toEqual(nodes[4]);
      expect(nodes[5].group).toEqual(2);
      expect(nodes[5].name).toEqual('c1');
      expect(nodes[5].value).toEqual('b');
      expect(nodes[5].info).toEqual('2');
   });

   it('#createData should return columnValue <empty> when column value is null', () => {

      // given
      context.groupByColumns = [findColumn('c2')];

      // when
      const data = dataService.createData(context);

      // then
      const nodes: GraphNode[] = data['nodes'];
      expect(nodes.length).toEqual(4);
      expect(nodes[1].value).toEqual(PropertyFilter.EMPTY_VALUE);
      expect(nodes[2].value).toEqual(2);
      expect(nodes[3].value).toEqual(3);
   });

   function findColumn(name: string): Column {
      return columns.find(c => c.name === name);
   }
});
