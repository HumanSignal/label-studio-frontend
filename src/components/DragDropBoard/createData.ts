/**
 * this file dictates the shape of the data used in the ddboard component.
 */

//represents a column of data
export interface ColumnData {
  id: string;
  title: string;
  itemIds: string[];
}

//represents an item living in a column
export interface InputItem {
  id: string;
  title: string;
  body: string;
}

//represents the entire board of columns and items
export interface BoardData {
  items: { [id: string]: InputItem };
  columns: { [id: string]: ColumnData };
  columnOrder: string[];
}

/**
 * assumed input data structure
 * title, body, id
 * id: assigned programatically when component renders
 * title: string
 * body: string
 */

/* simulating fake input data. Ids will be assigned programatically */
const inputData: any[] = [
  {
    title: 'item 0 title',
    body: 'item 0 description',
  },
  {
    title: 'item 1 title',
    body: 'item 1 description',
  },
  {
    title: 'item 2 title',
    body: 'item 2 description',
  },
  {
    title: 'item 3 title',
    body: 'item 3 description',
  },
  {
    title: 'item 4 title',
    body: 'item 4 description',
  },
];

export const getData = (input: InputItem[] = inputData) => {
  /* loop through input data and create query data object used for ddboard component */
  const itemIds = inputData.map((item: InputItem, index: number) => 'item-' + index);

  //convert input array into object of items so that ids are easily findable
  const itemsObject: { [id: string]: InputItem } = {};

  input.forEach((item, index) => {
    //grab item ids for each item
    item.id = 'item-' + index;
    itemsObject[item.id] = {
      id: item.id,
      title: item.title,
      body: item.body,
    };
  });

  /* The DragDropBoard component relies on the data looking like this */
  const queryData: BoardData = {
    items: itemsObject,
    columns: {
      'column-1': {
        id: 'column-1',
        title: 'Search Results',
        itemIds,
      },
      'column-2': {
        id: 'column-2',
        title: 'Relevant Results',
        itemIds: [],
      },
    },
    columnOrder: ['column-1', 'column-2'],
  };

  return queryData;
};
