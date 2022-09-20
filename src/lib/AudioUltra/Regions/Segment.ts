import { nanoid } from "nanoid";
import { rgba, RgbaColorArray } from "../Common/Color";
import { Events } from "../Common/Events";
import { clamp, defaults, getCursorPositionX, getCursorTime, pixelsToTime } from "../Common/Utils";
import { CursorSymbol } from "../Cursor/Cursor";
import { Layer } from "../Visual/Layer";
import { Visualizer } from "../Visual/Visualizer";
import { Waveform } from "../Waveform";
import { Region } from "./Region";
import { Regions } from "./Regions";

export interface SegmentOptions {
  id?: string;
  start: number;
  end: number;
  selected?: boolean;
  updateable?: boolean;
  deleteable?: boolean;
  visible?: boolean;
}

export interface SegmentGlobalEvents {
  regionCreated: (region: Region|Segment) => void;
  regionUpdated: (region: Region|Segment) => void;
  regionRemoved: (region: Region|Segment) => void;
}

interface SegmentEvents {
  update: (region: Segment) => void;
  mouseEnter: (region: Segment, event: MouseEvent) => void;
  mouseOver: (region: Segment, event: MouseEvent) => void;
  mouseLeave: (region: Segment, event: MouseEvent) => void;
  mouseDown: (region: Segment, event: MouseEvent) => void;
  mouseUp: (region: Segment, event: MouseEvent) => void;
  click: (region: Segment, event: MouseEvent) => void;
}

export class Segment extends Events<SegmentEvents> {
  id: string;
  start = 0;
  end = 0;
  color: RgbaColorArray = rgba("#ccc");
  handleColor: RgbaColorArray;
  selected = false;
  updateable = true;
  deleteable = true;
  visible = true;
  private waveform: Waveform;
  private visualizer: Visualizer;
  private controller: Regions;
  private layer!: Layer;
  private handleWidth: number;
  private isDragging: boolean;
  private draggingStartPosition: null | { grabPosition: number, start: number, end: number };
  private isGrabbingEdge: { isRightEdge: boolean, isLeftEdge: boolean };

  constructor(
    options: SegmentOptions,
    waveform: Waveform,
    visualizer: Visualizer,
    controller: Regions,
  ) {
    super();

    if (options.start < 0) throw new Error("Segment start must be greater than 0");
    if (options.end < 0) throw new Error("Segment end must be greater than 0");

    this.id = options.id ?? nanoid(5);
    this.start = options.start;
    this.end = options.end;
    this.selected = !!options.selected;
    this.updateable = options.updateable ?? this.updateable;
    this.visible = options.visible ?? this.visible;
    this.handleColor = this.color.darken(0.6);
    this.waveform = waveform;
    this.visualizer = visualizer;
    this.controller = controller;
    this.handleWidth = 4;
    this.isDragging = false;
    this.draggingStartPosition = null;
    this.isGrabbingEdge = { isRightEdge: false, isLeftEdge: false };

    this.initialize();
  }

  protected get layerName() {
    return `region-${this.id}`;
  }

  private get duration() {
    return this.waveform.duration;
  }

  private get zoom() {
    return this.waveform.zoom;
  }

  get xStart() {
    const { width } = this.visualizer;
    const position = this.visualizer.getScrollLeft();
    const offsetX = (this.start / this.duration * width) - (width * position);

    return offsetX * this.zoom;
  }

  get xEnd() {
    return this.xStart + this.width;
  }

  get width() {
    const { start, end } = this;
    const { width } = this.visualizer;
    const regionWidth = (end - start) / this.waveform.duration * width;

    return regionWidth * this.zoom;
  }

  get hovered() {
    return this.controller.isHovered(this);
  }

  get timelineHeight() {
    return this.visualizer.timelineHeight || defaults.timelineHeight;
  }

  get timelinePlacement() {
    return this.visualizer.timelinePlacement || defaults.timelinePlacement;
  }

  private get inViewport() {
    const { xStart: startX, xEnd: endX } = this;
    const width = this.visualizer.width * this.zoom;

    // Both coordinates are less than or equal to 0
    if (startX <= 0 && endX <= 0) return false;

    // Both coordinates are greater than or equal to the viewport
    if (startX >= width && endX >= width) return false;

    return true;
  }

  private requiresCursorFocus(symbol: CursorSymbol) {
    return ![CursorSymbol.crosshair].includes(symbol);
  }

  private switchCursor = (symbol: CursorSymbol, shouldGrabFocus = true) => {
    this.waveform.cursor.set(symbol, shouldGrabFocus && this.requiresCursorFocus(symbol) ? this.layerName : "");
  };

  private edgeGrabCheck = (e: MouseEvent) => {
    const { handleWidth, end, start, visualizer } = this;
    const { zoomedWidth } = this.visualizer;
    const { duration } = this.waveform;
    const cursorTime = getCursorTime(e, visualizer, duration);
    const handleTime = pixelsToTime(handleWidth, zoomedWidth, duration);
    const isRightEdge = cursorTime > end - handleTime;
    const isLeftEdge = cursorTime < start + handleTime;

    return { isRightEdge, isLeftEdge };
  };

  private mouseOver = (_: Segment, e: MouseEvent) => {
    if (!this.updateable) return;
    const isEdgeGrab = this.edgeGrabCheck(e);

    if (this.isDragging) return;
    if (isEdgeGrab.isRightEdge || isEdgeGrab.isLeftEdge) this.switchCursor(CursorSymbol.colResize);
    else this.switchCursor(CursorSymbol.grab);
  };

  private handleMouseUp = () => {
    if (!this.updateable) return;

    this.controller.unlock();

    if (this.isDragging) {
      this.switchCursor(CursorSymbol.grab);
    } else {
      this.handleSelected();
    }
    
    this.isDragging = false;
    this.draggingStartPosition = null;
    this.isGrabbingEdge = { isRightEdge: false, isLeftEdge: false };
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener("mouseup", this.handleMouseUp);
  };

  private handleDrag = (e: MouseEvent) => {
    if (!this.updateable) return;
    if (this.draggingStartPosition) {
      e.preventDefault();
      e.stopPropagation();
      this.controller.lock();
      this.isDragging = true;
      const { isRightEdge: freezeStart, isLeftEdge: freezeEnd } = this.isGrabbingEdge; 
      const { grabPosition, start, end } = this.draggingStartPosition;
      const { container, zoomedWidth } = this.visualizer;
      const { duration } = this.waveform;
      const scrollLeft = this.visualizer.getScrollLeft();
      const currentPosition = getCursorPositionX(e, container) + scrollLeft;
      const newPosition = currentPosition - grabPosition;
      const seconds = pixelsToTime(newPosition, zoomedWidth, duration);
      const timeDiff = end - start;
      const newStart = freezeEnd ? start + seconds : clamp(start + seconds, 0, this.duration - timeDiff);
      const startTime = freezeStart ? start : newStart;
      const endTime = freezeEnd ? end : newStart + timeDiff;

      if (freezeStart || freezeEnd) this.switchCursor(CursorSymbol.colResize);
      else  this.switchCursor(CursorSymbol.grabbing);
      this.updatePosition(startTime, endTime);

    }
  };

  private mouseDown = (_: Segment, e: MouseEvent) => {
    if (!this.updateable) return;
    if (e.shiftKey || this.controller.isLocked) return;
    const { container } = this.visualizer;
    const scrollLeft = this.visualizer.getScrollLeft();
    const x = getCursorPositionX(e, container) + scrollLeft;
    const { start, end } = this;

    this.draggingStartPosition = { grabPosition: x, start, end };
    this.isGrabbingEdge = this.edgeGrabCheck(e);
    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener('mousemove', this.handleDrag);
  };

  private initialize() {
    this.layer = this.visualizer.createLayer({ groupName: "regions", name: this.layerName });
    // Handle region resizing
    this.on("mouseOver", this.mouseOver);
    this.on("mouseDown", this.mouseDown);
  }

  /**
   * Render the region on the canvas
   */
  render() {
    if (!this.visible || !this.inViewport) {
      return;
    }
    const { color, handleColor, timelinePlacement, timelineHeight } = this;
    const { height } = this.visualizer;
    const timelineTop = timelinePlacement === defaults.timelinePlacement;
    const top = timelineTop ? timelineHeight : 0;
    const layer = this.controller.layerGroup;

    // @todo - this should account for timeline placement and start at the reservedSpace height
    layer.fillStyle = color.toString();
    layer.fillRect(this.xStart, top, this.width, height);

    // Render grab lines
    layer.fillStyle = handleColor.toString();
    layer.fillRect(this.xStart, top, this.handleWidth, height);
    layer.fillRect(this.xEnd - this.handleWidth, top, this.handleWidth, height);

    // Render label
    // if (this.label) {
    //   layer.font = "12px Arial";
    //   const labelMeasure = layer.context.measureText(this.label);

    //   layer.fillStyle = "#000";
    //   layer.fillRect(
    //     this.startX + 5,
    //     5,
    //     clamp(labelMeasure.width + 10, 0, this.width),
    //     10
    //   );

    //   layer.fillStyle = "#fff";
    //   layer.fitText(this.label, this.startX + 10, 12, this.width);
    // }
  }

  /**
   * Update region's color
   * @param color Color to set on the region
   */

  handleSelected = () => {
    if (!this.updateable) return;
    if (this.waveform.playing) this.waveform.player.pause();
    this.selected = !this.selected;
    if (this.selected) this.color = this.color.darken(0.5);
    else this.color = this.color.lighten(1);
    this.invoke("update", [this]);
    this.waveform.invoke("regionUpdated", [this]);
  };
  
  updateColor(color: string) {
    if (!this.updateable) return;
    this.color = rgba(color);
    this.handleColor = this.color.darken(0.6);
    this.invoke("update", [this]);
    this.waveform.invoke("regionUpdated", [this]);
  }

  updatePosition(start?: number, end?: number) {
    if (!this.updateable) return;
    let newStart = start ?? this.start;
    let newEnd = end ?? this.end;

    if (newStart > newEnd) {
      [newStart, newEnd] = [newEnd, newStart];
    }

    this.start = newStart;
    this.end = newEnd;
    this.invoke("update", [this]);
    this.waveform.invoke("regionUpdated", [this]);
  }

  remove() {
    if (!this.deleteable) return;
    this.waveform.invoke("regionRemoved", [this]);
  }

  /**
   * Destroy region
   * Remove all event listeners and remove the region from the canvas
   * Remove region's layer
   */
  destroy() {
    if (!this.deleteable || this.isDestroyed) return;

    super.destroy();

    this.controller.layerGroup.removeLayer(this.layer);

    this.remove();
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
    };
  }
}

