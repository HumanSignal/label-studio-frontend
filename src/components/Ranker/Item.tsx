import { useMemo } from 'react';
import { Draggable } from 'react-beautiful-dnd';

import { sanitizeHtml } from '../../utils/html';
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

  // @todo document html parameter later after proper tests
  const html = useMemo(() => sanitizeHtml(item.html), [item.html]);

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
            {item.title && <h3 className={styles.itemLine}>{item.title}</h3>}
            {item.body && <p className={styles.itemLine}>{item.body}</p>}
            {item.html && <p className={styles.itemLine} dangerouslySetInnerHTML={{ __html: html }} />}
            <p className={styles.itemLine}>{item.id}</p>
          </div>
        );
      }}
    </Draggable>
  );
};

export default Item;
