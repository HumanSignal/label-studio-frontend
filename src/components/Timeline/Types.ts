import { MouseEvent } from "react";

export interface TimelineView {
  step: number,
  offset: number,
  position: number,
  length: number,
  regions: TimelineRegion[],
  onScroll: (position: number) => void,
  onChange: (position: number) => void,
  onResize: (position: number) => void,
  onToggleVisibility: (id: string, visible: boolean) => void,
  onDeleteRegion: (id: string) => void,
  onSelectRegion: (e: MouseEvent<HTMLDivElement>, id: string) => void,
}

export interface TimelineRegion {
  id: string,
  label: string,
  color: string,
  visible: boolean
  selected: boolean
  keyframes: TimelineRegionKeyframe[]
}

export interface TimelineRegionKeyframe {
  frame: number
  stop: boolean
}

export interface TimelineContext {
  position: number,
  viewOffset: number,
  enableKeyframes?: boolean
}
