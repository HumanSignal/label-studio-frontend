import React, { useRef, useState } from 'react';
import { IconOutlinerDrag } from '../../assets/icons';
import { useDrag } from '../../hooks/useDrag';
import { Block, Elem } from '../../utils/bem';
import './Tabs.styl';
import { BaseProps, DroppableSide, TabProps } from './types';
import { determineDroppableArea, determineLeftOrRight } from './utils';

const Tab = (props: TabProps) => {
  const { rootRef, tabTitle: tabText, tabIndex, panelIndex, children, transferTab, createNewPanel, setActiveTab } = props;
  const [dragOverSide, setDragOverSide] = useState<DroppableSide | undefined>();
  const tabRef = useRef<HTMLDivElement>();
  const ghostTabRef = useRef<HTMLDivElement>();
  const dragging = useRef(false);
  
  console.log(tabText, panelIndex, tabIndex);
  useDrag({
    elementRef: tabRef,
    onMouseDown(event) {
      rootRef.current?.append(ghostTabRef.current!);

      const tab = tabRef.current!;
      const page = rootRef.current!.getBoundingClientRect();
      const bbox = tab.getBoundingClientRect();
      const [x, y] = [event.pageX, event.pageY];
      const [oX, oY] = [bbox.left - page.left, bbox.top - page.top];

      return { x, y, oX, oY };
    },
    onMouseMove(event, data) {
      if (!data) return;
      dragging.current = true;
      const { x, y, oX, oY } = data;

      ghostTabRef.current!.style.display = 'block';
      ghostTabRef.current!.style.top = `${event.pageY - (y - oY)}px`;
      ghostTabRef.current!.style.left = `${event.pageX - (x - oX)}px`;
    },
    onMouseUp(event, data) {
      tabRef.current?.append(ghostTabRef.current!);
      ghostTabRef.current!.style.display = 'none';
      if (!dragging.current) setActiveTab(panelIndex, tabIndex);
      if (!data || !dragging.current) return;

      dragging.current = false;
      const { x, y, oX, oY } = data;
      const headerHeight = 32;
      const [nX, nY] = [event.pageX - (x - oX), event.pageY - (y - oY)];
      const left = nX < 0 ? 0 : nX;
      const top = nY < 0 ? 0 : nY - headerHeight;
      const droppedOver = document.elementFromPoint(event.clientX, event.clientY);
      const isDropArea = determineDroppableArea(droppedOver as HTMLElement);

      if (!isDropArea) createNewPanel(panelIndex, tabIndex, left, top);
      else {
        const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
        const dropTargetId = dropTarget?.id;

        if (!dropTargetId || !dropTargetId?.includes('droppable')) return;

        const droppedOnIndices = dropTargetId.split('-').map(string => parseInt(string, 10));
        const receivingPanel = droppedOnIndices[0];
        const receivingTab = droppedOnIndices[1];
   
        const dropSide = determineLeftOrRight(event, dropTarget as HTMLElement);

        dropSide && transferTab(tabIndex, panelIndex, receivingPanel, receivingTab, dropSide);
      }
    },
  }, [tabRef]);

  const handleOnEnter = (event: React.MouseEvent<HTMLElement>) => {
    if (event.buttons === 1 || event.buttons === 3) {
      const isDropArea = determineDroppableArea(event.target as HTMLElement);

      if (isDropArea) setDragOverSide(determineLeftOrRight(event));
    }
  };

  const handleMouseLeave = () => {
    setDragOverSide(undefined);
  };

  const Label = () => (
    <Elem id={`${panelIndex}-${tabIndex}-droppable`} name="tab" mod={{ dragOverSide }}>
      <Elem name="icon" tag={IconOutlinerDrag} width={20} />
      {tabText}
    </Elem>
  );

  return (
    <Block name="panel-tabs">
      <div onMouseEnter={event => handleOnEnter(event)} onMouseLeave={() => handleMouseLeave()}>
        <Elem
          id={`${tabText}-draggable`}
          ref={tabRef}
        >
          <Label />
        </Elem>
        <Elem ref={ghostTabRef} name="ghost-tab">
          <Label />
          <Elem name="contents">{children}</Elem>
        </Elem>
      </div>
    </Block>
  );
};

export const Tabs = (props: BaseProps) => {
  return (
    <Block name="tabs">
      <Elem name="tabs-row">
        {props.panelViews.map((view, index) => {
          const Component = view.component;

          return (
            <div key={`${view.title}-tab`} >
              <Tab
                rootRef={props.root}
                key={`${view.title}-tab`}
                panelIndex={props.index}
                tabIndex={index}
                tabTitle={view.title}
                transferTab={props.transferTab}
                createNewPanel={props.createNewPanel}
                setActiveTab={props.setActiveTab}
              >
                <Elem name="content">
                  <Component {...props} />
                </Elem>
              </Tab>
              {index === props.panelViews.length - 1 && (
                <Elem id={`${index}-${props.index}-droppable-space`} name="drop-space-after" />
              )}
            </div>
          );
        })}
      </Elem>
      {props.panelViews.map(view => {
        const Component = view.component;

        return (
          <>
            {view.active && (
              <Elem key={`${view.title}-contents`} name="contents">
                <Component {...props} />
              </Elem>
            )}
          </>
        );
      })}
    </Block>
  );
};
