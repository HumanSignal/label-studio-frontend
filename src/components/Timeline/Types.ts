import { FC, MouseEvent } from "react";
import { ViewTypes } from "./Views";
import * as Controls from "./SideControls";

export type TimelineControls = Partial<Record<keyof typeof Controls, boolean>>

export interface TimelineProps<D extends ViewTypes = "frames"> {
  regions: any[];
  length: number;
  position: number;
  mode: D;
  framerate: number;
  playing: boolean;
  zoom?: number;
  volume?: number;
  speed?: number;
  fullscreen?: boolean;
  disableView?: boolean;
  className?: string;
  defaultStepSize?: number;
  allowFullscreen?: boolean;
  allowViewCollapse?: boolean;
  allowSeek?: boolean;
  hopSize?: number;
  data?: any;
  controlsOnTop?: boolean;
  controls?: TimelineControls;
  onReady?: (data: Record<string, any>) => void;
  onPlayToggle: (playing: boolean) => void;
  onPositionChange: (value: number) => void;
  onToggleVisibility?: (id: string, visibility: boolean) => void;
  onAddRegion?: (region: Record<string, any>) => any;
  onDeleteRegion?: (id: string) => void;
  onZoom?: (zoom: number) => void;
  onSelectRegion?: (event: MouseEvent<HTMLDivElement>, id: string, select?: boolean) => void;
  onAction?: (event: MouseEvent, action: string, data?: any) => void;
  onVolumeChange?: (volume: number) => void;
  onFullscreenToggle?: (fullscreen: boolean) => void;
  onSpeedChange?: (speed: number) => void;
  formatPosition?: (position: number, fps: number) => string;
}

export interface TimelineViewProps {
  step: number;
  offset: number;
  position: number;
  length: number;
  playing: boolean;
  zoom?: number;
  speed?: number;
  volume?: number;
  regions: TimelineRegion[];
  leftOffset?: number;
  onScroll: (position: number) => void;
  onChange: (position: number) => void;
  onResize: (position: number) => void;
  onPlayToggle?: TimelineProps["onPlayToggle"];
  onToggleVisibility?: TimelineProps["onToggleVisibility"];
  onReady?: TimelineProps["onReady"];
  onZoom?: TimelineProps["onZoom"];
  onAddRegion?: TimelineProps["onAddRegion"];
  onDeleteRegion?: TimelineProps["onDeleteRegion"];
  onSelectRegion?: TimelineProps["onSelectRegion"];
  onVolumeChange?: TimelineProps["onVolumeChange"];
  onSpeedChange?: TimelineProps["onSpeedChange"];
}

export interface TimelineRegion {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  selected: boolean;
  sequence: TimelineRegionKeyframe[];
}

export interface TimelineRegionKeyframe {
  frame: number;
  enabled: boolean;
}

export interface TimelineContextValue {
  position: number;
  length: number;
  regions: TimelineRegion[];
  step: number;
  playing: boolean;
  visibleWidth: number;
  seekOffset: number;
  settings?: TimelineSettings;
  data?: any;
}

export interface TimelineMinimapProps {
  regions: TimelineRegion[];
  step: number;
  length: number;
}

export type TimelineSettings = {
  stepBackHotkey?: string,
  stepForwardHotkey?: string,
  playpauseHotkey?: string,
  stepAltBack?: string,
  stepAltForward?: string,
  skipToBeginning?: string,
  skipToEnd?: string,
  hopBackward?: string,
  hopForward?: string,
  fastTravelSize?: TimelineStepFunction,
  stepSize?: TimelineStepFunction,
  leftOffset?: number,
}

export type TimelineStepFunction = (length: number, position: number, regions: TimelineRegion[], direction: -1 | 1) => number;

export interface TimelineExtraControls<A extends string, D extends any> {
  onAction?: <T extends Element>(e: MouseEvent<T>, action: A, data?: D) => void;
}

export type TimelineView<D extends FC<TimelineExtraControls<any, any>> = any> = {
  View: FC<TimelineViewProps>,
  Minimap?: FC<any>,
  Controls?: D,
  settings?: TimelineSettings,
}

export type TimelineControlsStepHandler = (
  e?: MouseEvent<HTMLButtonElement>,
  stepSize?: TimelineStepFunction
) => void;

export interface TimelineControlsProps {
  length: number;
  position: number;
  frameRate: number;
  playing: boolean;
  collapsed: boolean;
  fullscreen: boolean;
  volume?: number;
  disableFrames?: boolean;
  extraControls?: JSX.Element | null;
  allowFullscreen?: boolean;
  allowViewCollapse?: boolean;
  controls?: TimelineProps["controls"];
  onRewind: (steps?: number) => void;
  onForward: (steps?: number) => void;
  onPositionChange: (position: number) => void;
  onToggleCollapsed: (collapsed: boolean) => void;
  onStepBackward: TimelineControlsStepHandler;
  onStepForward: TimelineControlsStepHandler;
  formatPosition?: TimelineProps["formatPosition"];
  onPlayToggle: TimelineProps["onPlayToggle"];
  onFullScreenToggle: TimelineProps["onFullscreenToggle"];
  onVolumeChange: TimelineProps["onVolumeChange"];
}

export interface TimelineSideControlProps {
  position?: number;
  length?: number;
  volume?: number;
  onPositionChange?: TimelineControlsProps["onPositionChange"];
  onVolumeChange?: TimelineProps["onVolumeChange"];
}
