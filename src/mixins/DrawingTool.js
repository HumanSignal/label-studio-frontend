import { types } from "mobx-state-tree";

import Utils from "../utils";
import throttle from "lodash.throttle";
import { DEFAULT_DIMENSIONS, MIN_SIZE } from "../tools/Base";

const DrawingTool = types
  .model("DrawingTool", {
    default: true,
    mode: types.optional(types.enumeration(["drawing", "viewing"]), "viewing"),
  })
  .views(self => {
    return {
      createRegionOptions(opts) {
        return {
          ...opts,
          coordstype: "px",
        };
      },
      get tagTypes() {
        console.error("Drawing tool model needs to implement tagTypes getter in views");
        return {};
      },
      isIncorrectControl() {
        return self.tagTypes.stateTypes === self.control.type && !self.control.isSelected;
      },
      isIncorrectLabel() {
        return !self.obj.checkLabels();
      },
      get isDrawing() {
        return self.mode === "drawing";
      },
      current() {
        return self.getActiveShape;
      },
      canStart() {
        return !self.isDrawing;
      },
      get defaultDimensions() {
        console.warn("Drawing tool model needs to implement defaultDimentions getter in views");
        return {};
      },
    };
  })
  .actions(self => {
    let lastClick = {
      ts: 0,
      x: 0,
      y: 0,
    };
    return {
      event(name, ev, args) {
        let fn = name + "Ev";
        if (typeof self[fn] !== "undefined") self[fn].call(self, ev, args);

        // Emulating of dblclick event, 'cause redrawing will crush the the original one
        if (name === "click") {
          const ts = ev.timeStamp;
          const [x, y] = args;
          if (ts - lastClick.ts < 300 && self.comparePointsWithThreshold(lastClick, { x, y })) {
            fn = "dbl" + fn;
            if (typeof self[fn] !== "undefined") self[fn].call(self, ev, args);
          }
          lastClick = { ts, x, y };
        }
      },

      comparePointsWithThreshold(p1, p2, threshold = { x: MIN_SIZE.X, y: MIN_SIZE.Y }) {
        if (typeof threshold === "number") threshold = { x: threshold, y: threshold };
        return Math.abs(p1.x - p2.x) < threshold.x && Math.abs(p1.y - p2.y) < threshold.y;
      },
    };
  })
  .actions(self => {
    let currentArea;
    return {
      getCurrentArea() {
        return currentArea;
      },
      createRegion(opts) {
        const control = self.control;
        const labels = { [control.valueType]: control.selectedValues?.() };
        currentArea = self.obj.annotation.createResult(opts, labels, control, self.obj);
        currentArea.setDrawing(true);
      },

      beforeCommitDrawing() {
        return true;
      },

      canStartDrawing() {
        return !self.isIncorrectControl() && !self.isIncorrectLabel() && self.canStart();
      },

      startDrawing(x, y) {
        self.annotation.history.freeze();
        self.mode = "drawing";
        self.createRegion(self.createRegionOptions({ x, y }));
      },
      finishDrawing(x, y) {
        const s = self.getActiveShape;

        if (!self.beforeCommitDrawing()) {
          self.annotation.removeArea(s);
          if (self.control.type === self.tagTypes.stateTypes) self.annotation.unselectAll(true);
        } else {
          self.annotation.history.unfreeze();
          // Needs some delay for avoiding catching click if this method is called on mouseup
          setTimeout(() => {
            currentArea.setDrawing(false);
            currentArea = null;
          }, 0);
          // self.obj.annotation.highlightedNode.unselectRegion(true);
        }
        self.mode = "viewing";
      },
    };
  });

const TwoPointsDrawingTool = DrawingTool.named("TwoPointsDrawingTool")
  .views(self => ({
    get defaultDimensions() {
      return {
        width: MIN_SIZE.X,
        height: MIN_SIZE.Y,
      };
    },
  }))
  .actions(self => {
    const DEFAULT_MODE = 0;
    const DRAG_MODE = 1;
    const TWO_CLICKS_MODE = 2;
    let currentMode = DEFAULT_MODE;
    let modeAfterMouseMove = DEFAULT_MODE;
    let startPoint = { x: 0, y: 0 };
    let endPoint = { x: 0, y: 0 };
    const Super = {
      finishDrawing: self.finishDrawing,
    };
    return {
      updateDraw: throttle(function(x, y) {
        if (currentMode === DEFAULT_MODE) return;
        self.draw(x, y);
      }, 48), // 3 frames, optimized enough and not laggy yet

      draw(x, y) {
        const shape = self.getCurrentArea();
        if (!shape) return;
        const { stageWidth, stageHeight } = self.obj;

        let { x1, y1, x2, y2 } = Utils.Image.reverseCoordinates({ x: shape.startX, y: shape.startY }, { x, y });

        x1 = Math.max(0, x1);
        y1 = Math.max(0, y1);
        x2 = Math.min(stageWidth, x2);
        y2 = Math.min(stageHeight, y2);

        shape.setPosition(x1, y1, x2 - x1, y2 - y1, shape.rotation);
      },

      finishDrawing(x, y) {
        Super.finishDrawing(x, y);
        currentMode = DEFAULT_MODE;
        modeAfterMouseMove = DEFAULT_MODE;
      },

      mousedownEv(ev, [x, y]) {
        if (!self.canStartDrawing()) return;
        startPoint = { x, y };
        if (currentMode === DEFAULT_MODE) {
          modeAfterMouseMove = DRAG_MODE;
        }
      },

      mousemoveEv(ev, [x, y]) {
        if (currentMode === DEFAULT_MODE) {
          if (!self.comparePointsWithThreshold(startPoint, { x, y })) {
            currentMode = modeAfterMouseMove;
            if ([DRAG_MODE, TWO_CLICKS_MODE].includes(currentMode)) {
              self.startDrawing(startPoint.x, startPoint.y);
              if (!self.isDrawing) {
                currentMode = DEFAULT_MODE;
                return;
              }
            }
          }
        }
        if (!self.isDrawing) return;
        if ([DRAG_MODE, TWO_CLICKS_MODE].includes(currentMode)) {
          self.updateDraw(x, y);
        }
      },

      mouseupEv(ev, [x, y]) {
        if (currentMode !== DRAG_MODE) return;
        endPoint = { x, y };
        if (!self.isDrawing) return;
        self.draw(x, y);
        self.finishDrawing(x, y);
      },

      clickEv(ev, [x, y]) {
        if (!self.canStartDrawing()) return;
        if (!self.comparePointsWithThreshold(startPoint, endPoint)) return;
        if (currentMode === DEFAULT_MODE) {
          modeAfterMouseMove = TWO_CLICKS_MODE;
        } else if (self.isDrawing && currentMode === TWO_CLICKS_MODE) {
          self.draw(x, y);
          self.finishDrawing(x, y);
          currentMode = DEFAULT_MODE;
        }
      },

      dblclickEv(ev, [x, y]) {
        if (!self.canStartDrawing()) return;
        if (currentMode === DEFAULT_MODE) {
          self.startDrawing(x, y);
          if (!self.isDrawing) return;
          x += self.defaultDimensions.width;
          y += self.defaultDimensions.height;
          self.draw(x, y);
          self.finishDrawing(x, y);
        }
      },
    };
  });

const MultipleClicksDrawingTool = DrawingTool.named("MultipleClicksMixin")
  .views(self => ({
    canStart() {
      return !this.current();
    },
  }))
  .actions(self => {
    let startPoint = { x: 0, y: 0 };
    let clickCount = 0;
    return {
      nextPoint(x, y) {
        self.getCurrentArea().addPoint(x, y);
      },
      closeCurrent() {
        console.error("MultipleClicksMixin model needs to implement closeCurrent method in actions");
      },
      finishDrawing(x, y) {
        if (!self.isDrawing) return;
        self.closeCurrent();
        self.mode = "viewing";
      },
      clickEv(ev, [x, y]) {
        if (self.current()) {
          if (clickCount === 1 && self.comparePointsWithThreshold(startPoint, { x, y })) {
            // dblclick
            self.nextPoint(x + self.defaultDimensions.length, y);
            self.nextPoint(
              x + self.defaultDimensions.length / 2,
              y + Math.sin(Math.PI / 3) * self.defaultDimensions.length,
            );
            self.finishDrawing();
          } else {
            self.nextPoint(x, y);
          }
        } else {
          if (!self.canStartDrawing()) return;
          startPoint = { x, y };
          clickCount = 1;
          self.startDrawing(x, y);
        }
      },
    };
  });

export { DrawingTool, TwoPointsDrawingTool, MultipleClicksDrawingTool };
