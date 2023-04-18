/**
 * libraries
 */
import React, { useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';

/**
 * components
 */
import Column from './Column';
import { BoardData, ColumnData } from './createData';

/**
 * styles
 */
import styles from './Ranker.module.scss';

/**
 * types
 */
interface BoardProps {
  inputData: BoardData;
  handleChange?: (ids: string[]) => void;
}

//component for a drag and drop board with 2 columns as defined in createData.ts
const Ranker = ({ inputData, handleChange }: BoardProps) => {
  const [data, setData] = useState(inputData);

  // update data when inputData changes
  useEffect(() => {
    setData(inputData);
  }, [inputData]);

  const handleDragEnd = (result: any) => {
    //handle reordering of items
    const { destination, source, draggableId } = result;

    //check if user dropped item outside of columns or in same location as starting location
    if (!destination || (destination.droppableId === source.draggableId && destination.index === source.index)) {
      return;
    }

    //handle reorder when item was dragged to a new position
    //determine which column item was moved from
    const startCol = data.columns[source.droppableId];
    const endCol = data.columns[destination.droppableId];

    if (startCol === endCol) {
      //get original items list
      const newItemIds = Array.from(startCol.itemIds);

      //reorder items list
      newItemIds.splice(source.index, 1);
      newItemIds.splice(destination.index, 0, draggableId);

      //create newcolumn with correct order of items
      const newCol = {
        ...startCol,
        itemIds: newItemIds,
      };

      //update state
      const newData = {
        ...data,
        columns: { ...data.columns, [newCol.id]: newCol },
      };

      setData(newData);
      //update results
      handleChange ? handleChange(newData.columns[`${newData.columnOrder.length - 1}`].itemIds) : null;
      return;
    }

    //handle case when moving from one column to a different column
    const startItemIds = Array.from(startCol.itemIds);

    startItemIds.splice(source.index, 1);

    const newStartCol = {
      ...startCol,
      itemIds: startItemIds,
    };

    const endItemIds = Array.from(endCol.itemIds);

    endItemIds.splice(destination.index, 0, draggableId);

    const newEndCol = {
      ...endCol,
      itemIds: endItemIds,
    };

    //update state
    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [newStartCol.id]: newStartCol,
        [newEndCol.id]: newEndCol,
      },
    };
    //update results

    handleChange ? handleChange(newData.columns[`${newData.columnOrder.length - 1}`].itemIds) : null;
    setData(newData);
  };

  return (
    <div className={styles.rankerBoard}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.boardStyle}>
          <div className={styles.columnsStyle}>
            {data.columnOrder.map(columnId => {
              const column = data.columns[columnId] as ColumnData;
              const items = column.itemIds.map(itemId => data.items[itemId]);

              return <Column key={column.id} column={column} items={items} title={column.title} />;
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default Ranker;
