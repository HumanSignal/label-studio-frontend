import { FC, MutableRefObject, ReactNode } from 'react';
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_MAX_HEIGHT, DEFAULT_PANEL_WIDTH } from '../constants';

export type TabProps = {
  rootRef: MutableRefObject<HTMLDivElement | undefined>,
  tabTitle: string,
  panelKey: string,
  tabIndex: number,
  active: boolean,
  children: ReactNode,
  panelWidth: number,
  transferTab: EventHandlers['transferTab'],
  createNewPanel: EventHandlers['createNewPanel'],
  setActiveTab: EventHandlers['setActiveTab'],
}
  
export interface SidePanelsProps {
  panelsHidden: boolean;
  store: any;
  currentEntity: any;
}

export interface PanelView {
  title: string;
  name: string;
  component: FC<any>;
  active: boolean;
}

export enum DroppableSide {
  left = 'left',
  right = 'right',
}

export interface PanelBBox {
  width: number;
  height:  number;
  left: number;
  top: number;
  relativeLeft: number;
  relativeTop: number;
  storedTop?: number;
  storedLeft?: number;
  maxHeight: number;
  zIndex: number;
  visible: boolean;
  detached: boolean;
  alignment: DroppableSide;
  panelViews: PanelView[];
}
    
export interface EventHandlers {
  onResize: (key: string, w: number, h: number, t: number, l: number) => void;
  onResizeStart: ()=> void;
  onResizeEnd: ()=> void;
  onPositionChange: (key: string, t: number, l: number, detached: boolean) => void;
  onVisibilityChange: (key: string, visible: boolean) => void;
  onPositionChangeBegin: (key: string, t: number, l: number, detached: boolean) => void;
  onSnap: (key: string) => void;
  transferTab: (
    movingTab: number,
    movingPanel: string,
    receivingPanel: string,
    receivingTab: number,
    dropSide: DroppableSide,
  ) => void;
  createNewPanel(
    movingPanel: string,
    movingTab: number,
    left: number,
    top: number,
  ): void;
  setActiveTab: (key: string, tabIndex: number) => void;
}
export type CommonProps = EventHandlers & {
  root: MutableRefObject<HTMLDivElement | undefined>,
  regions: any,
  selection: any,
  currentEntity: any,
}
    
export type BaseProps = PanelBBox & CommonProps & {
  name: string,
  top: number,
  left: number,
  tooltip: string | undefined,
  icon: JSX.Element,
  positioning: boolean,
  maxWidth: number,
  zIndex: number,
  expanded: boolean,
  alignment: DroppableSide,
  locked: boolean,
}
    
export type Result = {
  detached: BaseProps[],
  left:BaseProps[],
  right:BaseProps[],
}
    
export const emptyPanel: PanelBBox = {
  top: 0,
  left: 0,
  relativeLeft: 0,
  relativeTop: 0,
  zIndex: 1,
  width: DEFAULT_PANEL_WIDTH,
  height: DEFAULT_PANEL_HEIGHT,
  visible: true,
  detached: true,
  alignment: DroppableSide.left,
  maxHeight: DEFAULT_PANEL_MAX_HEIGHT,
  panelViews: [],
};

export type PanelBaseExclusiveProps = 'name' | 'title'

export type ResizeHandler = (name: string, width: number, height: number, top: number, left: number) => void;

export type SnapHandler = (name: string) => void

export type PositionChangeHandler = (name: string, top: number, left: number, detached: boolean) => void;

export type VisibilityChangeHandler = (name: string, visible: boolean) => void;
