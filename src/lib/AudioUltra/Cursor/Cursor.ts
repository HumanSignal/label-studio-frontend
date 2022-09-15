import { rgba, RgbaColorArray } from "../Common/Color";
import { Events } from "../Common/Events";
import { getCursorPositionX, getCursorPositionY } from "../Common/Utils";
import { RenderingContext } from "../Visual/Layer";
import { Visualizer } from "../Visual/Visualizer";

interface CursorEvents {
  mouseMove: (event: MouseEvent, cursor: Cursor) => void;
}

export enum cursorSymbol {
  colResize = "col-resize",
  crosshair = "crosshair",
  grab = "grab",
  grabbing = "grabbing",
  default = "default"
}

export interface CursorOptions {
  x?: number;
  y?: number;
  width?: number;
  color?: string|RgbaColorArray;
}

export class Cursor extends Events<CursorEvents> {
  private visualizer: Visualizer;
  private style: CSSStyleDeclaration["cursor"] = "default";
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
    this.set(this.style);
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

  set(cursor: CSSStyleDeclaration["cursor"], id = "") {
    this.focusId = id || "";
    if (cursor === this.style) {
      return;
    }
    this.style = cursor;
    this.visualizer.container.style.cursor = this.style;

    if (this.hasFocus()) {
      this.visualizer.lockSeek();
    } else {
      this.visualizer.unlockSeek();
    }
  }

  render(ctx: RenderingContext) {
    if (this.style !== "crosshair") {
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
