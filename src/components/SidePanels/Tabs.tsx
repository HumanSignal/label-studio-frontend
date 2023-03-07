import React, { ReactElement, useContext, useState } from 'react';
import { IconOutlinerDrag } from '../../assets/icons';
import { Block, Elem } from '../../utils/bem';
import throttle from 'lodash.throttle';
import './Tabs.styl';
import { SidePanelsContext } from './SidePanelsContext';


enum DroppableSide {
  left = 'left',
  right = 'right',
}

let dragging: string | undefined;

const determineLeftOrRight = (event: React.DragEvent<HTMLElement>) => {
  const dropWidth = (event.target as HTMLElement).clientWidth as number;
  const x = event.pageX as number - (event.target as HTMLElement).getBoundingClientRect().left;
  const half = dropWidth / 2;
  
  return x > half ? DroppableSide.right : DroppableSide.left;
};

const determineDroppableArea = (event: React.DragEvent<HTMLElement>) => {
  const targetId = (event.target as HTMLElement).id;

  return targetId.includes('droppable') && dragging && !targetId.includes(dragging);
};


export const Tabs = ({ children, title }: { children: ReactElement<any, any>, title: string }) => {
  const state = useContext(SidePanelsContext);
  
  console.log(state);
  const [dragOverSide, setDragOverSide] = useState<DroppableSide | undefined>();

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    console.log(dragging, '===>', event.dataTransfer.getData('text/plain'), dragOverSide);

    dragging = undefined;
    setDragOverSide(undefined);

  };
  
  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    const isDropArea = determineDroppableArea(event);

    throttle(() => {
      console.log('throttle');
      if (!isDropArea) return setDragOverSide(undefined);
      setDragOverSide(determineLeftOrRight(event));
    }, 100)();
  };

  const handleDragStart = (event: React.DragEvent<HTMLElement>, title: string) => {
    dragging = title;
    event.dataTransfer.clearData();
    event.dataTransfer.setData('text/plain', title);
  };

  return (
    <Block name="panel-tabs">
      <div
        draggable={true}
        onDrop={event => handleDrop(event)}
        onDragOver={event => handleDragOver(event)}
        onDragStart={event => handleDragStart(event, title)}
      >
        <div >
          <Elem id={`${title}-droppable`} name="tab" mod={{ dragOverSide }}>
            <Elem name="icon" tag={IconOutlinerDrag} width={20} mod={{ dragging: dragging === title }} />
            {title}
          </Elem>
          <Elem name="contents">{children}</Elem>
        </div>
      </div>
    </Block>
  );
};
