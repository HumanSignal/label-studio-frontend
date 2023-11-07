import { useContext } from 'react';

import { InputItem, NewColumnData } from './createData';
import Item from './Item';
import { CollapsedContext } from './Ranker';
import { StrictModeDroppable } from './StrictModeDroppable';

import styles from './Ranker.module.scss';

interface ColumnProps {
  column: NewColumnData;
  items: InputItem[];
  readonly?: boolean;
}

/*
 * defines a column component used by the DragDropBoard component. Each column contains items
 * that can be reordered by dragging.
 */

const Column = (props: ColumnProps) => {
  const { column, items, readonly } = props;
  const [collapsedMap, toggleCollapsed] = useContext(CollapsedContext);
  const collapsed = items.every(item => collapsedMap[item.id]);
  const toggle = () => toggleCollapsed(items.map(item => item.id), !collapsed);

  return (
    <div className={[styles.column, 'htx-ranker-column'].join(' ')}>
      <h1 className={[styles.columnTitle, collapsed ? styles.collapsed : ''].join(' ')}>
        {column.title}
        <button onClick={toggle}><span></span></button>
      </h1>
      <StrictModeDroppable droppableId={column.id}>
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={styles.dropArea}>
            {items.map((item, index) => (
              <Item key={item.id} item={item} index={index} readonly={readonly} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </StrictModeDroppable>
    </div>
  );
};

export default Column;
