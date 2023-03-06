import React, { DragEventHandler, ReactElement, useRef, useState } from 'react';
import { IconOutlinerDrag } from '../../assets/icons';
import { Elem } from '../../utils/bem';
import throttle from 'lodash.throttle';


enum DroppableSide {
  left = 'left',
  right = 'right',
}

const determineLeftOrRight = (event: React.DragEvent<HTMLDivElement>) => {
  const dropWidth = (event.target as HTMLElement).clientWidth as number;
  const x = event.pageX as number - (event.target as HTMLElement).getBoundingClientRect().left;
  const half = dropWidth / 2;
  
  return x > half ? DroppableSide.right : DroppableSide.left;
};

export const TabsContainer = ({ children, title }: { children: ReactElement<any, any>, title: string }) => {
  const tabRef = useRef<HTMLDivElement>();
  const [dragOverSide, setDragOverSide] = useState();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    // console.log('handleDrop', e);
  };
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    //   console.log(event)
    setDragOverSide(determineLeftOrRight(event));
    console.log(determineLeftOrRight(event));
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    // console.log('handleDragEnter', e);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // console.log('handleDragLeave', e);
  };

  return (
    <div
      draggable={true}
      onDrop={e => handleDrop(e)}
      onDragOver={e => handleDragOver(e)}
      onDragEnter={e => handleDragEnter(e)}
      onDragLeave={e => handleDragLeave(e)}
    >
      <Elem
        ref={tabRef}
        name="tab"
        mod={{ dragOverSide }}
      >
        <Elem id={title} width={20} />
        {title}
      </Elem>
      {children}
    </div>
  );
};
