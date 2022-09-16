import { rgba, RgbaColorArray } from "../Common/Color";
import { Events } from "../Common/Events";
import { getCursorPositionX, getCursorPositionY } from "../Common/Utils";
import { RenderingContext } from "../Visual/Layer";
import { Visualizer } from "../Visual/Visualizer";

interface CursorEvents {
  mouseMove: (event: MouseEvent, cursor: Cursor) => void;
}

export enum CursorSymbol {
  auto = "auto",
  crosshair = "crosshair",
  default = "default",
  pointer = "pointer",
  move = "move",
  text = "text",
  wait = "wait",
  help = "help",
  progress = "progress",
  notAllowed = "not-allowed",
  contextMenu = "context-menu",
  cell = "cell",
  verticalText = "vertical-text",
  alias = "alias",
  copy = "copy",
  noDrop = "no-drop",
  allScroll = "all-scroll",
  colResize = "col-resize",
  rowResize = "row-resize",
  grab = "grab",
  grabbing = "grabbing",
  nResize = "n-resize",
  neResize = "ne-resize",
  nwResize = "nw-resize",
  nsResize = "ns-resize",
  neswResize = "nesw-resize",
  nwseResize = "nwse-resize",
  sResize = "s-resize",
  seResize = "se-resize",
  swResize = "sw-resize",
  wResize = "w-resize",
  ewResize = "ew-resize",
  zoomIn = "zoom-in",
  zoomOut = "zoom-out",
} 

export interface CursorOptions {
  x?: number;
  y?: number;
  width?: number;
  color?: string|RgbaColorArray;
}

export class Cursor extends Events<CursorEvents> {
  private visualizer: Visualizer;
  private symbol = CursorSymbol.default;
  private focusId = "";

  color = rgba("#000000");
  x: number;
  y: number;
  width = 1;

  constructor(
    options: CursorOptions,
    visualizer: Visualizer,
  ) {
    super();
    this.visualizer = visualizer;
    this.color = options?.color ? rgba(options.color) : this.color;
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.width = options.width ?? this.width;
    this.initialize();
  }

  initialize() {
    this.set(this.symbol);
    document.addEventListener("mousemove", this.handleMouseMove);
  }

  destroy() {
    document.removeEventListener("mousemove", this.handleMouseMove);
    super.destroy();
  }

  isOver(x: number, y: number, width: number, height: number) {
    if (this.x > x + width || this.y > y + height || this.x < x || this.y < y) {
      return false;
    }
    return true;
  }

  isFocused(id: string) {
    return this.focusId === id;
  }

  hasFocus() {
    return this.focusId !== "";
  }

  get(): CursorSymbol {
    return this.symbol;
  }

  set(cursor: CursorSymbol, id = "") {
    this.focusId = id || "";
    if (cursor === this.symbol) {
      return;
    }
    this.symbol = cursor;
    this.visualizer.container.style.cursor = this.symbol;

    if (this.hasFocus()) {
      this.visualizer.lockSeek();
    } else {
      this.visualizer.unlockSeek();
    }
  }

  render(ctx: RenderingContext) {
    if (this.symbol !== "crosshair") {
      return;
    }
    ctx.fillStyle = this.color.toString();
    ctx.fillRect(this.x, this.y, this.width, this.visualizer.height);
  }

  get inView() {
    const { width, height } = this.visualizer;

    return this.isOver(0, 0, width, height);
  }

  private handleMouseMove = (e: MouseEvent) => {
    const { container } = this.visualizer;

    this.x = getCursorPositionX(e, container);
    this.y = getCursorPositionY(e, container);
    this.invoke("mouseMove", [e, this]);
    this.visualizer.invoke("mouseMove", [e, this]);
  };
}
