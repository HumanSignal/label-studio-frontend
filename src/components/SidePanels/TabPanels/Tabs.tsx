import React, { useEffect, useRef, useState } from 'react';
import { IconOutlinerDrag } from '../../../assets/icons';
import { useDrag } from '../../../hooks/useDrag';
import { Block, Elem } from '../../../utils/bem';
import './Tabs.styl';
import { BaseProps, DroppableSide, TabProps } from './types';
import { determineDroppableArea, determineLeftOrRight } from './utils';

const Tab = (props: TabProps) => {
  const { rootRef, tabTitle: tabText, tabIndex, panelKey, children, active,  transferTab, createNewPanel, setActiveTab } = props;
  const [dragOverSide, setDragOverSide] = useState<DroppableSide | undefined>();
  const tabRef = useRef<HTMLDivElement>();
  const ghostTabRef = useRef<HTMLDivElement>();
  const dragging = useRef(false);
  const location = useRef({ panelKey, tabIndex });

  useEffect(() => { location.current = { panelKey, tabIndex }; }, [panelKey, tabIndex]);

  useDrag({
    elementRef: tabRef,
    onMouseDown(event) {
      const { panelKey, tabIndex } = { ...location.current };

      setActiveTab(panelKey, tabIndex);
      rootRef.current?.append(ghostTabRef.current!);
      const tab = tabRef.current!;
      const page = rootRef.current!.getBoundingClientRect();
      const bbox = tab.getBoundingClientRect();
      const [x, y] = [event.pageX, event.pageY];
      const [oX, oY] = [bbox.left - page.left, bbox.top - page.top];

      return { x, y, oX, oY, panelKey, tabIndex };
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

      if (!data || !dragging.current) return;
      dragging.current = false;
      const { x, y, oX, oY, panelKey, tabIndex } = data;
      const headerHeight = 32;
      const [nX, nY] = [event.pageX - (x - oX), event.pageY - (y - oY)];
      const left = nX < 0 ? 0 : nX;
      const top = nY < 0 ? 0 : nY - headerHeight;
      const droppedOver = document.elementFromPoint(event.clientX, event.clientY);
      const isDropArea = determineDroppableArea(droppedOver as HTMLElement);


      if (!isDropArea) createNewPanel(panelKey, tabIndex, left, top);
      else {
        const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
        const dropTargetId = dropTarget?.id;

        if (!dropTargetId || !dropTargetId?.includes('droppable')) return;
        const droppedOnIndices = dropTargetId.split('_');
        const receivingPanel = droppedOnIndices[0];
        const receivingTab = parseInt(droppedOnIndices[1]);
        const dropSide = determineLeftOrRight(event, dropTarget as HTMLElement);

        dropSide && transferTab(tabIndex, panelKey, receivingPanel, receivingTab, dropSide);
      }
    },
  }, [tabRef]);


  const handleMouseOver = (event: React.MouseEvent<HTMLElement>) => {
    if (event.buttons === 1 || event.buttons === 3) {
      const isDropArea = determineDroppableArea(event.target as HTMLElement);

      if (isDropArea) setDragOverSide(determineLeftOrRight(event));
      setTimeout(()=> setDragOverSide(undefined), 200);
    }
  };

  const handleMouseLeave = () => {
    setDragOverSide(undefined);
  };

  const Label = () => (
    <Elem id={`${panelKey}_${tabIndex}_droppable`} name="tab" mod={{ dragOverSide, active }}>
      <Elem name="icon" tag={IconOutlinerDrag} width={20} />
      <Elem name="label">
        {tabText}
      </Elem>
    </Elem>
  );

  return (
    <Block name="panel-tabs">
      <div onMouseOver={event => handleMouseOver(event)} onMouseLeave={() => handleMouseLeave()}>
        <Elem
          name="draggable-tab"
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
    <>
      <Block name="tabs">
        <Elem name="tabs-row">
          {props.panelViews.map((view, index) => {
            const Component = view.component;

            return (
              <Elem name={'tab-contiainer'} key={`${view.title}-${index}-tab`} >
                <Tab
                  rootRef={props.root}
                  key={`${view.title}-tab`}
                  panelKey={props.name}
                  tabIndex={index}
                  active={view.active}
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
                  <Elem id={`${index}-${props.name}-droppable-space`} name="drop-space-after" />
                )}
              </Elem>
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
    </>
  );
};
