import { Draggable } from 'react-beautiful-dnd';

import { InputItem } from './createData';
import styles from './Ranker.module.scss';

interface ItemProps {
  item: InputItem;
  index: number;
  readonly?: boolean;
}

/**
 * Item component represents a draggable item within each column. Items can be dragged within a
 * given column as well as between columns.
 */
const Item = (props: ItemProps) => {
  const { item, index, readonly } = props;

  return (
    <Draggable draggableId={item.id} index={index} isDragDisabled={readonly}>
      {provided => {
        return (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{ ...provided.draggableProps.style }}
            className={[styles.item, 'htx-ranker-item'].join(' ')}
            ref={provided.innerRef}
          >
            <h3 className={styles.itemLine}>{item.title}</h3>
            <p className={styles.itemLine}>{item.body}</p>
            <p className={styles.itemLine}>{item.id}</p>
          </div>
        );
      }}
    </Draggable>
  );
};

export default Item;
