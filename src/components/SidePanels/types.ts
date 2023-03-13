import { FC, MutableRefObject, ReactNode } from 'react';
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_MAX_HEIGHT, DEFAULT_PANEL_WIDTH } from './constants';

export type TabProps = {
  rootRef: MutableRefObject<HTMLDivElement | undefined>,
  tabTitle: string,
  panelIndex: number,
  tabIndex: number,
  children: ReactNode,
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
  component: FC<any>;
  icon: FC;
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
  onResize: (index: number, w: number, h: number, t: number, l: number) => void;
  onResizeStart: ()=> void;
  onResizeEnd: ()=> void;
  onPositionChange: (index: number, t: number, l: number, detached: boolean) => void;
  onVisibilityChange: (index: number, visible: boolean) => void;
  onPositionChangeBegin: (index: number, t: number, l: number, detached: boolean) => void;
  onSnap: (index: number) => void;
  transferTab: (
    movingTab: number,
    movingPanel: number,
    receivingPanel: number,
    receivingTab: number,
    dropSide: DroppableSide,
  ) => void;
  createNewPanel(
    movingTab: number,
    movingPanel: number,
    left: number,
    top: number,
    dropSide?: DroppableSide,
  ): void;
  setActiveTab: (panelIndex: number, tabIndex: number) => void;
}
export type CommonProps = EventHandlers & {
  root: MutableRefObject<HTMLDivElement | undefined>,
  regions: any,
  selection: any,
  currentEntity: any,
}
    
export type BaseProps = PanelBBox & CommonProps & {
  index: number,
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
    