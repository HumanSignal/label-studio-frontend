import { rgba, RgbaColorArray } from "../Common/Color";
import { defaults, findLast, getCursorPositionX, getCursorPositionY, isInRange, pixelsToTime } from "../Common/Utils";
import { CursorSymbol } from "../Cursor/Cursor";
import { LayerGroup } from "../Visual/LayerGroup";
import { Visualizer } from "../Visual/Visualizer";
import { Waveform } from "../Waveform";
import { Region, RegionOptions } from "./Region";
import { Segment } from "./Segment";

interface RegionsOptions {
  regions: RegionOptions[];
  defaultColor?: string|RgbaColorArray;
}

export class Regions {
  private regions: Region[] = [];
  private waveform: Waveform;
  private visualizer: Visualizer;
  private initialRegions: RegionOptions[];
  private locked = false;
  private hoveredRegions = new Set<Segment>();
  private defaultColor = rgba("#787878");

  layerGroup: LayerGroup;

  constructor({
    regions = [],
    defaultColor,
  }: RegionsOptions, waveform: Waveform, visualizer: Visualizer) {
    this.waveform = waveform;
    this.visualizer = visualizer;
    this.initialRegions = regions ?? [];
    this.defaultColor = defaultColor ? rgba(defaultColor) : this.defaultColor;
    this.layerGroup = this.visualizer.getLayer("regions") as LayerGroup;

    this.init();
  }

  init() {
    // Regions general events
    this.visualizer.on("initialized", this.handleInit);
    this.waveform.on("regionRemoved", this.handleRegionRemoved);
    this.waveform.on("regionUpdate", this.handleRegionUpdated);

    this.visualizer.container.addEventListener("mousedown", this.handleDrawRegion);

    // Regions specific events
    const { container } = this.visualizer;

    container.addEventListener("mousemove", this.handleMouseMove);
    container.addEventListener("mousedown", this.handleMouseDown);
    container.addEventListener("mouseup", this.handleMouseUp);
    container.addEventListener("click", this.handleClick);
  }

  handleDraw = () => {
    if (!this.waveform.loaded) return;
    this.renderAll();
  };

  renderAll() {
    this.layerGroup.clear();
    this.regions.forEach(region => region.render());
  }

  addRegion(options: RegionOptions) {
    const region = new Region(options, this.waveform, this.visualizer, this);

    this.regions.push(region);
    this.renderAll();
    this.visualizer.draw(true);

    return region;
  }

  removeRegion(regionId: string) {
    const region = this.regions.find(region => region.id === regionId);

    if (region) {
      region.destroy();
      this.regions = this.regions.filter(r => r !== region);
    }

    this.renderAll();
    this.visualizer.draw(true);
  }

  destroy() {
    const { container } = this.visualizer;

    this.visualizer.off("initialized", this.handleInit);
    this.visualizer.off("draw", this.handleDraw);
    this.waveform.off("regionRemoved", this.handleRegionRemoved);
    this.waveform.off("regionUpdate", this.handleRegionUpdated);

    container.removeEventListener("mousemove", this.handleMouseMove);
    container.removeEventListener("mousedown", this.handleMouseDown);
    container.removeEventListener("mouseup", this.handleMouseUp);
    container.removeEventListener("click", this.handleClick);

    this.regions.forEach(region => region.destroy());
    this.regions = [];
  }

  get list() {
    return Array.from(this.regions);
  }

  get selected() {
    return this.regions.filter(region => region.selected);
  }

  private handleInit = () => {
    this.regions = this.initialRegions.map(region => {
      return new Region(
        region,
        this.waveform,
        this.visualizer,
        this,
      );
    });

    this.initialRegions = [];

    // Handle rendering when the visualizer is being drawn
    this.visualizer.on("draw", this.handleDraw);
  };

  private handleRegionUpdated = () => {
    this.visualizer.draw(true);
  };

  private handleRegionRemoved = (reg: Segment) => {
    this.removeRegion(reg.id);
  };

  private handleDrawRegion = (e: MouseEvent) => {
    // @todo - handle regions creation in a way that doesn't require rendering and removing regions on each mouse click
    // of the waveform

    if (this.locked) return;
    if (this.hoveredRegions.size > 0 && !e.shiftKey) {
      return;
    }
    this.lock();
    const { container, zoomedWidth } = this.visualizer;
    const { duration } = this.waveform;
    const scrollLeft = this.visualizer.getScrollLeftPx();
    const startX = getCursorPositionX(e, container) + scrollLeft;
    const start = pixelsToTime(startX,zoomedWidth, duration);
    const end = pixelsToTime(startX, zoomedWidth, duration);

    const region = this.addRegion({
      start,
      end,
      color: this.defaultColor.toString(),
      selected: false,
    });

    const handleMouseMove = (e: MouseEvent) => {
      const { container } = this.visualizer;
      const scrollLeft = this.visualizer.getScrollLeftPx();
      const currentX = getCursorPositionX(e, container) + scrollLeft;

      if (Math.abs(currentX - startX) > 5) {
        region.updatePosition(region.start, this.pixelsToTime(currentX));
        region.render();
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (region.start === region.end) {
        region.remove();
      }
      this.unlock();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  private handleMouseMove = (e: MouseEvent) => {
    const region = this.findRegionUnderCursor(e);

    if (region) {
      region.invoke("mouseOver", [region, e]);

      if (!region.hovered) {
        this.hoveredRegions.clear();
        this.hover(region, e);
      }
    } else if (this.hoveredRegions.size !== 0) {
      this.hoveredRegions.forEach(region => {
        region.invoke("mouseLeave", [region, e]);
      });
      this.hoveredRegions.clear();
      this.waveform.cursor.set(CursorSymbol.default);
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    const region = this.findRegionUnderCursor(e);

    if (region) {
      e.preventDefault();
      e.stopPropagation();

      region.invoke("mouseDown", [region, e]);
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    const region = this.findRegionUnderCursor(e);

    if (region) {
      region.invoke("mouseUp", [region, e]);
    }
  };

  private handleClick = (e: MouseEvent) => {
    const region = this.findRegionUnderCursor(e);

    if (region) {
      region.invoke("click", [region, e]);
    }
  };

  private findRegionUnderCursor(e: MouseEvent) {
    const region = findLast(this.regions, region => {
      return this.cursorInRegion(e, region);
    });

    return region;
  }

  /**
   * General check to identify if mouse cursor is within the region bounds
   * @param e Mouse event
   * @param region Regions to compare against
   * @returns True if cursor is within the region bounds
   */
  private cursorInRegion(e: MouseEvent, region: Region) {
    const { xStart, width } = region;
    const { container, timelinePlacement, timelineHeight = 0, height } = this.visualizer;
    const timelineTop = timelinePlacement === defaults.timelinePlacement;
    const yStart = timelineTop ? timelineHeight : 0;
    const x = getCursorPositionX(e, container);
    const y = getCursorPositionY(e, container);

    const xIsInRange = isInRange(
      x,
      xStart,
      (xStart + width),
    );

    if (!xIsInRange) return false;


    const yIsInRange = isInRange(
      y,
      yStart,
      (yStart + height - timelineHeight),
    );

    return yIsInRange;
  }

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  get isLocked() {
    return this.locked;
  }

  hover(region: Region, e?: MouseEvent) {
    if (e) {
      region.invoke("mouseEnter", [region, e]);
    }

    this.hoveredRegions.add(region);
  }

  unhover(region: Region, e?: MouseEvent) {
    if (e) {
      region.invoke("mouseLeave", [region, e]);
    }

    this.hoveredRegions.delete(region);
  }

  pixelsToTime(pixels: number) {
    const { zoomedWidth } = this.visualizer;
    const { duration } = this.waveform;

    return pixels / zoomedWidth * duration;
  }

  toJSON() {
    return this.regions.map(region => region.toJSON());
  }

  isHovered(region: Segment) {
    return this.hoveredRegions.has(region);
  }
}
