/**
 * this file dictates the shape of the data used in the ranker component.
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
  location: string;
}

//represents the entire board of columns and items
export interface BoardData {
  items: { [id: string]: InputItem };
  columns: { [id: string]: ColumnData };
  columnOrder: string[];
}

/**
 * assumed input data structure:
 * id: string
 * title: string
 * body: string
 * location: string
 */

//TODO: we need to add the right item ids to the right column depending on their location property
export const getData = (input: InputItem[], mode: string) => {
  /* loop through input data and create query data object used for ranker component */

  //convert input array into object of items so that ids are easily findable
  const itemsObject: { [id: string]: InputItem } = {};
  //separate items into their initialized columns
  const column1Items: Array<string> = [];
  const column2Items: Array<string> = [];
  const column3Items: Array<string> = [];

  input.forEach(item => {
    itemsObject[item.id] = {
      id: item.id,
      title: item.title,
      body: item.body,
      location: item.location ? item.location : 'column-1',
    };

    //determine which column to initialize item into
    if (item.location === 'column-2') {
      column2Items.push(item.id);
    } else if (item.location === 'column-3') {
      column3Items.push(item.id);
    } else {
      //default send to first column
      column1Items.push(item.id);
    }
  });

  /* The DragDropBoard component relies on the data looking like this */
  const queryData: BoardData = {
    items: itemsObject,
    columns: {
      'column-1': {
        id: 'column-1',
        title: 'Search Results',
        itemIds: column1Items,
      },
    },
    columnOrder: ['column-1'],
  };

  //if mode is rank then initialize with only 1 column, if select-2 then initialize w 3 columns
  if (mode === 'select') {
    queryData.columns['column-2'] = {
      id: 'column-2',
      title: 'Relevant Results',
      itemIds: column2Items,
    };
    queryData.columnOrder.push('column-2');
  } else if (mode === 'select-2') {
    queryData.columns['column-2'] = {
      id: 'column-2',
      title: 'Relevant Results',
      itemIds: column2Items,
    };
    queryData.columns['column-3'] = {
      id: 'column-3',
      title: 'Relevant Results',
      itemIds: column3Items,
    };
    queryData.columnOrder.push('column-2');
    queryData.columnOrder.push('column-3');
  }
  return queryData;
};
