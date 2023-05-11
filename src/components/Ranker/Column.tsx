/**
 * components
 */
import { StrictModeDroppable } from './StrictModeDroppable';
import Item from './Item';
import { ColumnData, InputItem } from './createData';

/**
 * styles
 */
import styles from './Ranker.module.scss';
/**
 * types
 */
interface ColumnProps {
  column: ColumnData;
  items: InputItem[];
  title: string;
}

/*
 * defines a column component used by the DragDropBoard component. Each column contains items
 * that can be reordered by dragging.
 */

const Column = (props: ColumnProps) => {
  const { column, items, title } = props;

  return (
    <div className={[styles.columnStyle, 'htx-ranker-column'].join(' ')}>
      <h1>{title ? title : column.title}</h1>
      <StrictModeDroppable droppableId={column.id}>
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={styles.dropAreaStyle}>
            {items.map((item, index) => (
              <Item key={item.id} item={item} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </StrictModeDroppable>
    </div>
  );
};

export default Column;
