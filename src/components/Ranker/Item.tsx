/**
 * libraries
 */
import { Draggable } from 'react-beautiful-dnd';

/**
 * components
 */
import { InputItem } from './createData';

/**
 * styles
 */
import styles from './Ranker.module.scss';

/**
 * types
 */
interface ItemProps {
  item: InputItem;
  index: number;
}

/**
 * Item component represents a draggable item within each column. Items can be dragged within a
 * given column as well as between columns.
 */
const Item = (props: ItemProps) => {
  const { item, index } = props;

  return (
    <Draggable draggableId={item.id} index={index}>
      {provided => {
        return (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={[styles.itemStyle, 'htx-ranker-item'].join(' ')}
            ref={provided.innerRef}
          >
            <h3 className={styles.itemLineStyle}>{item.title}</h3>
            <p className={styles.itemLineStyle}>{item.body}</p>
            <p className={styles.itemLineStyle}>{item.id}</p>
          </div>
        );
      }}
    </Draggable>
  );
};

export default Item;
