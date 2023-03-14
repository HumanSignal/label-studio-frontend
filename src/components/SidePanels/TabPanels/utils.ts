import { FC, ReactNode } from 'react';
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_MAX_HEIGHT, DEFAULT_PANEL_WIDTH } from '../constants';
import { Details } from '../DetailsPanel/DetailsPanel';
import { OutlinerComponent } from '../OutlinerPanel/OutlinerPanel';
import { PanelProps } from '../PanelBase';
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
  
export const determineDroppableArea = (droppingElement: HTMLElement) => droppingElement.id.includes('droppable');

export const stateRemovedTab = (state: Record<string, PanelBBox>, movingPanel: string, movingTab: number) => {
  const newState = { ...state };
  const panel = newState[movingPanel];

  panel.panelViews = panel.panelViews
    .filter((_, tabIterator) => tabIterator !== movingTab);

  return newState;
};

export const setActive = (state: Record<string, PanelBBox>, key: string, tabIndex: number) => {
  const newState = {
    ...state, [key]: {
      ...state[key], panelViews: state[key].panelViews.map((view, index) => {
        view.active = index === tabIndex;
        return view;
      }),
    },
  };

  return newState;
};

export const setActiveDefaults = (state: Record<string, PanelBBox>) => {
  const newState = { ...state };

  Object.keys(state).forEach((panelKey: string) => {
    const hasActiveTab = newState[panelKey].panelViews.some((view) => view.active);
    
    if (!hasActiveTab) newState[panelKey].panelViews[0].active = true;
  });

  return newState;
};


export const renameKeys = (state: Record<string, PanelBBox>) => {
  const newState = {};

  Object.keys(state).forEach((panelKey: string) => {
    const newKey = `${state[panelKey].panelViews.map(view => view.name).join('-')}`;
    const panel = { ...state[panelKey] };

    Object.assign(newState, { [newKey]: panel });
  });

  return newState;
};

export const stateAddedTab = (
  state: Record<string, PanelBBox>,
  receivingPanel: string,
  movingTabData: PanelView,
  receivingTab: number,
  dropSide: DroppableSide,
) => {
  const newState = { ...state };
  const panel = newState[receivingPanel];
  const newPanelViews = panel.panelViews;

  newPanelViews.splice(receivingTab + (dropSide === DroppableSide.right ? 1 : 0), 0, movingTabData);

  return newState;
};


export const stateRemovePanelEmptyViews = (state: Record<string, PanelBBox>) => {
  const newState = { ...state };

  Object.keys(newState).forEach((panel) => {
    if (newState[panel].panelViews.length === 0) delete newState[panel];
    else newState[panel].panelViews.forEach(view => view.active = false);
  });
  return newState;
};

export const defaultPanelState: Record<string, PanelBBox> = {
  'outliner': {
    top: 0,
    left: 0,
    relativeLeft: 0,
    relativeTop: 0,
    zIndex: 1,
    width: DEFAULT_PANEL_WIDTH,
    height: DEFAULT_PANEL_HEIGHT,
    visible: true,
    detached: false,
    alignment: DroppableSide.left,
    maxHeight: DEFAULT_PANEL_MAX_HEIGHT,
    panelViews: [{
      name: 'outliner',
      title: 'Outliner',
      component: OutlinerComponent as FC<PanelProps>,
      active: true,
    }],
  },
  'details': {
    top: 0,
    left: 0,
    relativeLeft: 0,
    relativeTop: 0,
    zIndex: 1,
    width: DEFAULT_PANEL_WIDTH,
    height: DEFAULT_PANEL_HEIGHT,
    visible: true,
    detached: false,
    alignment: DroppableSide.right,
    maxHeight: DEFAULT_PANEL_MAX_HEIGHT,
    panelViews: [{
      name: 'details',
      title: 'Details',
      component: Details as FC<PanelProps>,
      active: true,
    }],
  },
};

export const panelComponents: {[key:string]: FC<PanelProps>} = {
  'outliner': OutlinerComponent as FC<PanelProps>,
  'details': Details as FC<PanelProps>,
};

export const restorePanel = ( defaults: Record<string, PanelBBox>) => {
  const panelData = window.localStorage.getItem('panelState');
  
  if (panelData) return restoreComponentsToState(JSON.parse(panelData));
  else return defaults;
};

export const restoreComponentsToState = (panelData: Record<string, PanelBBox>) => {
  const updatedPanels: any = { ...panelData };
  
  Object.keys(updatedPanels).forEach(panelName => {
    const panel = updatedPanels[panelName];

    panel.panelViews.forEach((view: { name: string, component: FC<PanelProps>}) => {
      view.component = panelComponents[view.name];
    });
  });

  return updatedPanels; 
};

export const savePanels = (panelData: Record<string, PanelBBox>) => {
  window.localStorage.setItem('panelState', JSON.stringify(panelData));
};