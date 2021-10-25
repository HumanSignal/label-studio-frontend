import { FC, MouseEvent } from "react";

export interface TimelineViewProps {
  step: number;
  offset: number;
  position: number;
  length: number;
  playing: boolean;
  regions: TimelineRegion[];
  onScroll: (position: number) => void;
  onChange: (position: number) => void;
  onResize: (position: number) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDeleteRegion: (id: string) => void;
  onSelectRegion: (e: MouseEvent<HTMLDivElement>, id: string) => void;
}

export interface TimelineRegion {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  selected: boolean;
  keyframes: TimelineRegionKeyframe[];
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
}

export interface TimelineMinimapProps {
  regions: TimelineRegion[];
  step: number;
  length: number;
}

export interface TimelineExtraControls<A extends string, D extends any> {
  onAction?: <T extends Element>(e: MouseEvent<T>, action: A, data?: D) => void;
}

export type TimelineView<D extends FC<TimelineExtraControls<any, any>> = any> = {
  View: FC<TimelineViewProps>,
  Minimap?: FC<any>,
  Controls?: D,
}
