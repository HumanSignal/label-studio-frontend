/**
 * libraries
 */
import { Draggable } from 'react-beautiful-dnd';

/**
 * components
 */
import { InputItem } from './createData';

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
          <div {...provided.draggableProps} {...provided.dragHandleProps} className="itemStyle" ref={provided.innerRef}>
            <h2 style={{ margin: '0' }}>{item.title}</h2>
            <p style={{ margin: '0' }}>{item.body}</p>
            <p style={{ margin: '0' }}>{item.id}</p>
          </div>
        );
      }}
    </Draggable>
  );
};

export default Item;
