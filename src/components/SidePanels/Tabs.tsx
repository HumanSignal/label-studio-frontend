import React, { FC, ReactElement, useContext, useState } from 'react';
import { IconOutlinerDrag } from '../../assets/icons';
import { Block, Elem } from '../../utils/bem';
import { PanelBaseProps } from './PanelBase';
import { SidePanelsContext } from './SidePanelsContext';
import { PanelView } from './SideTabPanels';
// import throttle from 'lodash.throttle';
import './Tabs.styl';
// import { SidePanelsContext } from './SidePanelsContext';


enum DroppableSide {
  left = 'left',
  right = 'right',
}
const lastCallTime: { [key: string]: number } | undefined = {};
const timeouts: { [key: string]: ReturnType<typeof setTimeout> | null } = {};

const throttleAndPop = (callback: () => any, callback2: () => any, name:string, delay = 100): any => {
  const now = Date.now();
  const timeSinceLastCall = now - (lastCallTime[name] || 0);

  if (timeSinceLastCall >= delay) {
    lastCallTime[name] = now;
    callback();
    clearTimeout(timeouts[name]!);
    timeouts[name] = setTimeout(() => {
      lastCallTime[name] = 0;
      timeouts[name] = null;
      callback2();
    }, delay * 2);
  }
};

const determineLeftOrRight = (event: React.DragEvent<HTMLElement>, droppableElement?: HTMLElement) => {
  const element = droppableElement || event.target as HTMLElement;  
  const dropWidth = (element as HTMLElement).clientWidth as number;
  const x = event.pageX as number - (element as HTMLElement).getBoundingClientRect().left;
  const half = dropWidth / 2;
  
  return x > half ? DroppableSide.right : DroppableSide.left;
};

const determineDroppableArea = (droppingElement: HTMLElement) => droppingElement.id.includes('droppable');

type TabProps = { tabTitle: string, active: boolean, component: FC<any>}

const Tab = (props: TabProps) => {
  const { tabTitle: tabText, active, component } = props;
  const panelContext = useContext(SidePanelsContext);
  const [dragOverSide, setDragOverSide] = useState<DroppableSide | undefined>();
  const [dragging, setDragging] = useState<boolean>(false);

  const isBeingDrugOver = (event: React.DragEvent<HTMLElement>) => {
    if (dragging) return;
    const isDropArea = determineDroppableArea(event.target as HTMLElement);
    
    throttleAndPop(() => {
      if (!isDropArea) return setDragOverSide(undefined);
      setDragOverSide(determineLeftOrRight(event));
    }, () => {
      setDragOverSide(undefined);
    }, 'droppable');
  };

  
  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    const droppedOver = document.elementFromPoint(event.clientX, event.clientY);
    const isDropArea = determineDroppableArea(droppedOver as HTMLElement);

    if (isDropArea) {
      // const dropSide = determineLeftOrRight(event, droppedOver as HTMLElement);

      panelContext.updatePanelTabs(droppedOver?.id);
      // console.log('move tab', (event.target as HTMLElement).id , '===>', droppedOver?.id, dropSide);
    } else {
      console.log('create new Panel');
    }
  };

  const isDragging = (event: React.DragEvent<HTMLElement>) => {
    throttleAndPop(() => {
      if (!dragging) setDragging(true);
    }, () => {
      setDragging(false);
      handleDrop(event);
    }, 'dragging');
  };

  const Component = component;

  return (
    <Block name="panel-tabs">
      <div
        onDragOver={event => isBeingDrugOver(event)}
      >
        <div id={`${tabText}-draggable`} draggable={true} onDrag={event => isDragging(event)}>
          <Elem id={`${tabText}-droppable`} name="tab" mod={{ dragOverSide }}>
            <Elem name="icon" tag={IconOutlinerDrag} width={20} mod={{ dragging }} />
            {tabText}
          </Elem>
          <Elem name="contents"><Component {...props} /></Elem>
        </div>
      </div>
    </Block>
  );
};

export const Tabs = (props: PanelBaseProps) => {
  return props.panelViews?.map((view, index) => (
    <Tab key={`${view.title}-${index}`} tabTitle={view.title} active={view.active} component={view.component} {...props} />
  ));
};