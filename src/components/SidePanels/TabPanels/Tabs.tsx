import React, { useRef, useState } from 'react';
import { IconOutlinerDrag } from '../../../assets/icons';
import { useDrag } from '../../../hooks/useDrag';
import { Block, Elem } from '../../../utils/bem';
import { DEFAULT_PANEL_MAX_HEIGHT } from '../constants';
import './Tabs.styl';
import { BaseProps, DroppableSide, TabProps } from './types';
import { determineDroppableArea, determineLeftOrRight } from './utils';

const classAddedTabs: (Element | undefined)[] = [];

enum DragOverHeightClasses {
  tabLeft = 'lsf-drag_over_tab_left',
  tabRight = 'lsf-drag_over_tab_right',
  emptyTabSpace = 'lsf-drag_over_empty_tab_space',
}

const removeHoverClasses = () => {
  classAddedTabs.forEach(tab => {
    tab?.classList.remove(DragOverHeightClasses.tabLeft);
    tab?.classList.remove(DragOverHeightClasses.tabRight);
    tab?.classList.remove(DragOverHeightClasses.emptyTabSpace);
  });
};
const addHoverClasses = (side?: DroppableSide, dropTarget?: Element) => { 
  classAddedTabs.push(dropTarget);
  let draggingClass;
  
  if (side === DroppableSide.left) draggingClass = DragOverHeightClasses.tabLeft;
  if (side === DroppableSide.right) draggingClass = DragOverHeightClasses.tabRight;
  if (side === undefined) draggingClass = DragOverHeightClasses.emptyTabSpace;

  draggingClass && dropTarget?.classList.add(draggingClass);
};

const Tab = ({ rootRef, tabTitle: tabText, tabIndex, panelKey, viewLength, children, active, panelWidth, transferTab, createNewPanel, setActiveTab }: TabProps) => {
  const tabRef = useRef<HTMLDivElement>();
  const ghostTabRef = useRef<HTMLDivElement>();
  const dragging = useRef(false);
  const location = useRef({ panelKey, tabIndex });

  location.current = { panelKey, tabIndex };

  useDrag({
    elementRef: tabRef,
    onMouseDown(event) {
      const { panelKey, tabIndex } = { ...location.current };

      setActiveTab(panelKey, tabIndex);
      rootRef.current?.append(ghostTabRef.current!);
      ghostTabRef.current!.style.pointerEvents = 'all';

      const tab = tabRef.current!;
      const page = rootRef.current!.getBoundingClientRect();
      const bbox = tab.getBoundingClientRect();
      const [x, y] = [event.pageX, event.pageY];
      const [oX, oY] = [bbox.left - page.left, bbox.top - page.top];

      return { x, y, oX, oY, panelKey, tabIndex };
    },
    onMouseMove(event, data) {
      if (!data) return;
      document.body.style.cursor = 'grabbing' ;
      window.getSelection()?.removeAllRanges();

      dragging.current = true;
      const { x, y, oX, oY } = data;

      ghostTabRef.current!.style.display = 'block';
      ghostTabRef.current!.style.top = `${event.pageY - (y - oY)}px`;
      ghostTabRef.current!.style.left = `${event.pageX - (x - oX)}px`;
      const dropTargets = document.elementsFromPoint(event.clientX, event.clientY);

      const dropTarget = dropTargets.find(((target, index) => target.id.includes('droppable') && index > 0));
      
      let side: DroppableSide | undefined = determineLeftOrRight(event, dropTarget);

      removeHoverClasses();
      if ((dropTarget as HTMLElement).id === `${panelKey}_${tabIndex}_droppable`) return;
      if ((dropTarget as HTMLElement).id.includes('droppable-space')) side = undefined;
      addHoverClasses(side, dropTarget);
    },
    onMouseUp(event, data) {
      removeHoverClasses();
      classAddedTabs.length = 0;
      tabRef.current?.append(ghostTabRef.current!);
      ghostTabRef.current!.style.display = 'none';
      document.body.style.cursor = 'auto';

      if (!data || !dragging.current) return;
      dragging.current = false;
      const { x, y, oX, oY, panelKey, tabIndex } = data;
      const headerHeight = 32;
      const [nX, nY] = [event.pageX - (x - oX), event.pageY - (y - oY)];
      const left = nX < 0 ? 0 : nX;
      const implementedHeight = nY - headerHeight;
      const top = implementedHeight < 0 ?  0 : implementedHeight;
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

        if (
          (tabIndex === receivingTab && panelKey === receivingPanel) ||
          (viewLength === 1 && panelKey === receivingPanel)
        ) return;
        dropSide && transferTab(tabIndex, panelKey, receivingPanel, receivingTab, dropSide);
      }
    },
  }, []);

  const Label = () => (
    <Elem id={`${panelKey}_${tabIndex}_droppable`} name="tab" mod={{ active }}>
      <Elem name="icon" tag={IconOutlinerDrag} width={20} />
      {tabText}
    </Elem>
  );

  return (
    <Block name="panel-tabs">
      <Elem name="draggable-tab" id={`${tabText}-draggable`} ref={tabRef}>
        <Label />
      </Elem>
      <Elem
        ref={ghostTabRef}
        name="ghost-tab"
        style={{ width: `${panelWidth}px`, height: `${DEFAULT_PANEL_MAX_HEIGHT}.px` }}
      >
        <Label />
        <Elem name="contents">{children}</Elem>
      </Elem>
    </Block>
  );
};

export const Tabs = (props: BaseProps) => {
  const [hoveringRight, setHoveringRight] = useState(false);

  return (
    <>
      <Block name="tabs">
        <Elem name="tabs-row">
          {props.panelViews.map((view, index) => {
            const Component = view.component;

            return (
              
              <Elem name="tab-container" key={`${view.title}-${index}-tab`} mod={{ active: view.active }}>
                <Tab
                  rootRef={props.root}
                  key={`${view.title}-tab`}
                  panelKey={props.name}
                  tabIndex={index}
                  active={view.active}
                  tabTitle={view.title}
                  panelWidth={props.width}
                  viewLength={props.panelViews.length}
                  transferTab={props.transferTab}
                  createNewPanel={props.createNewPanel}
                  setActiveTab={props.setActiveTab}
                >
                  <Elem name="content">
                    <Component key={`${view.title}-${index}-component`} {...props} />
                  </Elem>
                </Tab>
              </Elem>
            );
          })}
          <Elem
            id={`${props.name}_${props.panelViews.length}-droppable-space`}
            name="drop-space-after"
            mod={{ hoveringRight }}
            onMouseOver={(event: MouseEvent) => {
              if (event.buttons === 1 || event.buttons === 3) setHoveringRight(true);
            }}
            onMouseLeave={() => setHoveringRight(false)}
          />
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
