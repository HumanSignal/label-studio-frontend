import { nanoid } from "nanoid";
import { rgba, RgbaColorArray } from "../Common/Color";
import { Events } from "../Common/Events";
import { clamp } from "../Common/Utils";
import { cursorSymbol } from "../Cursor/Cursor";
import { Layer } from "../Visual/Layer";
import { Visualizer } from "../Visual/Visualizer";
import { Waveform } from "../Waveform";

export interface PlayheadOptions {
  x?: number;
  color?: RgbaColorArray;
  fillColor?: RgbaColorArray;
  width?: number;
  capWidth?: number;
  capHeight?: number;
  hoveredStrokeMultiplier?: number;
  capPadding?: number;
  padding?: number;
}

export interface PlayheadGlobalEvents {
  playheadUpdate: (playhead: Playhead) => void;
  playheadRemoved: (playhead: Playhead) => void;
}

interface PlayheadEvents {
  mouseEnter: (event: MouseEvent) => void;
  mouseLeave: (event: MouseEvent) => void;
  mouseDown: (event: MouseEvent) => void;
  mouseMove: (event: MouseEvent) => void;
  mouseUp: (event: MouseEvent) => void;
  click: (event: MouseEvent) => void;
}

export class Playhead extends Events<PlayheadEvents> {
  private id: string;
  private color: RgbaColorArray = rgba("#ccc");
  private fillColor: RgbaColorArray = rgba("#eee");
  private visualizer: Visualizer;
  private layer!: Layer;
  private layerName: string;
  private wf: Waveform;
  private capWidth: number;
  private hoveredStrokeMultiplier: number;
  private _x: number;
  private isDrawn = false;

  capHeight: number;
  capPadding: number;
  width: number;
  isHovered = false;
  isDragging = false;
  
  constructor(
    options: PlayheadOptions,
    visualizer: Visualizer,
    wf: Waveform,
  ) {
    super();
    if ((options?.x ?? 0) < 0) throw new Error("Playhead start must be greater than 0");

    this.id = nanoid(5);
    this._x = options.x ?? 0;
    this.color = options.color ? options.color : this.color;
    this.fillColor = options.fillColor ? options.fillColor : this.fillColor;
    this.width = options.width ?? 1;
    this.visualizer = visualizer;
    this.layerName = "playhead";
    this.wf = wf;
    this.capWidth = options.capWidth ?? 8;
    this.capHeight = options.capHeight ?? 5;
    this.capPadding = options.capPadding ?? 3;
    this.hoveredStrokeMultiplier = options.hoveredStrokeMultiplier ?? 2;

    this.initialize();
  }

  private mouseDown = (e: MouseEvent) => {
    if(this.isHovered) {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = true;

      const handleMouseMove = (e: MouseEvent) => {
        if(this.isDragging) {
          e.preventDefault();
          e.stopPropagation();
          const parentOffset = (this.visualizer.container as HTMLElement).getBoundingClientRect();
          const cursorOffset = (e.clientX - parentOffset.left);
          const x = clamp(cursorOffset, 0, this.visualizer.width);

          if(x !== this._x) {
            this.setX(x);
            this.render();
          }
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        if(this.isDragging) {
          e.preventDefault();
          e.stopPropagation();
          this.isDragging = false;
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          this.render();
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      this.render();
    }
  };

  private mouseEnter = () => {
    if( !this.isDragging ) {
      this.isHovered = true;
      this.render();
    }
  };

  private mouseLeave = () => {
    if( !this.isDragging ) {
      this.isHovered = false;
      this.render();
    }
  };

  private playing = (time: number, useClamp = true) => {
    if( !this.isDragging ) {
      const newX = ((time / this.wf.duration) - this.scroll) * this.fullWidth;
      const x = useClamp ? clamp(newX, 0, this.fullWidth) : newX;

      this.setX(x);
      this.render();
    }
  };

  private onZoom = () => {
    this.playing(this.time, false);
  };

  private onScroll = () => {
    this.playing(this.time, false);
  };
  
  private initialize() {
    this.on("mouseDown", this.mouseDown);
    this.on("mouseEnter", this.mouseEnter);
    this.on("mouseLeave", this.mouseLeave);
    this.wf.on("playing", this.playing);
    this.wf.on("zoom", this.onZoom);
    this.wf.on("scroll", this.onScroll);
  }

  private removeEvents() {
    this.off("mouseDown", this.mouseDown);
    this.off("mouseEnter", this.mouseEnter);
    this.off("mouseLeave", this.mouseLeave);
    this.wf.off("playing", this.playing);
    this.wf.off("zoom", this.onZoom);
    this.wf.off("scroll", this.onScroll);
  }

  private get scroll() {
    return this.visualizer.getScrollLeft();
  }

  private get zoom() {
    return this.wf.zoom;
  }

  get time() {
    return this.wf.currentTime;
  }

  get x() {
    return this._x + this.scroll;
  }

  get containerWidth() {
    return this.visualizer.container.clientWidth;
  }

  get fullWidth() {
    return this.visualizer.fullWidth;
  }

  /**
   * Render the playhead on the canvas
   */
  render() {
    const { color, fillColor, layer, _x, isHovered, width, isDragging, hoveredStrokeMultiplier } = this;
    const { reservedSpace } = this.visualizer;

    if(layer) {
      if (isHovered) {
        this.wf.cursor.set(isDragging ? cursorSymbol.grabbing : cursorSymbol.grab, "playhead");
      } else {
        this.wf.cursor.set(cursorSymbol.default);
      }
      layer.clear();
      layer.save();
      layer.fillStyle = fillColor.toString();
      layer.strokeStyle = color.toString();
      layer.lineWidth = isHovered ? width * hoveredStrokeMultiplier : width;
      layer.beginPath();
      this.moveTo(_x, reservedSpace);
      layer.closePath();
      layer.stroke();
      layer.fill();
      layer.restore();
    }
  }

  moveTo(x: number, y: number) {
    const { layer, capWidth, capHeight, capPadding, visualizer } = this;
    const { height } = visualizer;
    const playheadCapY = y - capHeight - capPadding;
    const halfCapWidth = capWidth/2;

    layer.moveTo(x - halfCapWidth, playheadCapY);
    layer.lineTo(x + halfCapWidth, playheadCapY);
    layer.lineTo(x + halfCapWidth, playheadCapY + capHeight - 1);
    layer.lineTo(x, playheadCapY + capHeight);
    layer.lineTo(x, height);
    layer.lineTo(x, playheadCapY + capHeight);
    layer.lineTo(x - halfCapWidth, playheadCapY + capHeight - 1);
  }

  setX(x: number) {
    this._x = x;
  }

  setLayer(layer: Layer) {
    this.layer = layer;
  }

  toJSON() {
    return {
      x: this.x,
      color: this.color.toString(),
      layerName: this.layerName,
      id: this.id,
    };
  }

  /**
   * Destroy playhead
   * Remove all event listeners and remove the playhead from the canvas
   * Remove playhead's layer
   */
  destroy() {
    if (this.isDestroyed) return;

    this.removeEvents();
    super.destroy();
  }
}
