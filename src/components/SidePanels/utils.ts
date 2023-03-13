import { ReactNode } from 'react';
import { DroppableSide, PanelBBox, PanelView } from './types';

export const lastCallTime: { [key: string]: number } | undefined = {};
export const timeouts: { [key: string]: ReturnType<typeof setTimeout> | null } = {};
  
export const throttleAndPop = (callback: () => any, callback2: () => any, name:string, delay = 100): any => {
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

export const determineLeftOrRight = (event: any, droppableElement?: ReactNode) => {
  const element = droppableElement || event.target as HTMLElement;  
  const dropWidth = (element as HTMLElement).clientWidth as number;
  const x = event.pageX as number - (element as HTMLElement).getBoundingClientRect().left;
  const half = dropWidth / 2;
    
  return x > half ? DroppableSide.right : DroppableSide.left;
};
  
export  const determineDroppableArea = (droppingElement: HTMLElement) => droppingElement.id.includes('droppable');


export const stateRemovedTab = (state: PanelBBox[], movingPanel: number, movingTab: number) =>
  state.map((panel, panelIterator) => {
    panel.panelViews = panel.panelViews.filter(
      (_, tabIterator) => !(panelIterator === movingPanel && tabIterator === movingTab),
    );

    if (panel.panelViews.length) panel.panelViews[0].active = true;
    return panel;
  });

export const stateAddedTab = (
  state: PanelBBox[],
  receivingPanel: number,
  movingTabData: PanelView,
  receivingTab: number,
  dropSide: DroppableSide,
) =>
  state.map((panel, panelIterator) => {
    const isReceivingPanel = panelIterator === receivingPanel;

    const viewsWithRemovals = (panel.panelViews = panel.panelViews.map(tab => {
      if (isReceivingPanel) tab.active = false;
      return tab;
    }));
    
    const insertionIndex = dropSide === 'left' ? receivingTab : receivingTab + 1;
    const amendedViews = viewsWithRemovals.slice(0, insertionIndex).concat(movingTabData, viewsWithRemovals.slice(insertionIndex));   
    const panelViews = isReceivingPanel && dropSide ? amendedViews : viewsWithRemovals;

    return { ...panel, panelViews };
  });