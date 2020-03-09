import React, { Fragment } from "react";
import { Line, Shape, Group } from "react-konva";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getRoot } from "mobx-state-tree";
import { encode, decode } from "@thi.ng/rle-pack";

import WithStatesMixin from "../mixins/WithStates";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import { BrushLabelsModel } from "../tags/control/BrushLabels";
import { ImageModel } from "../tags/object/Image";
import { LabelsModel } from "../tags/control/Labels";
import { RatingModel } from "../tags/control/Rating";
import { guidGenerator } from "../core/Helpers";
import Canvas from "../utils/canvas";

const Points = types
  .model("Points", {
    id: types.optional(types.identifier, guidGenerator),
    type: types.optional(types.enumeration(["add", "eraser"]), "add"),
    points: types.array(types.number),
    /**
     * Stroke width
     */
    strokeWidth: types.optional(types.number, 25),
  })
  .actions(self => ({
    setType(type) {
      self.type = type;
    },

    addPoints(x, y) {
      self.points.push(x);
      self.points.push(y);
    },

    // rescale points to the new width and height from the original
    rescale(origW, origH, destW, destH) {
      const s = destW / origW;
      return self.points.map(p => p * s);
    },

    scaledStrokeWidth(origW, origH, destW, destH) {
      const s = destW / origW;
      return s * self.strokeWidth;
    },
  }));

/**
 * Rectangle object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.identifier,
    pid: types.optional(types.string, guidGenerator),

    type: "brushregion",

    states: types.maybeNull(types.array(types.union(BrushLabelsModel))),

    coordstype: types.optional(types.enumeration(["px", "perc"]), "px"),
    /**
     * Higher values will result in a more curvy line. A value of 0 will result in no interpolation.
     */
    tension: types.optional(types.number, 1.0),
    /**
     * Stroke color
     */
    strokeColor: types.optional(types.string, "red"),

    /**
     * Determines node opacity. Can be any number between 0 and 1
     */
    opacity: types.optional(types.number, 1),
    /**
     * Set scale x
     */
    scaleX: types.optional(types.number, 1),
    /**
     * Set scale y
     */
    scaleY: types.optional(types.number, 1),
    /**
     * Points array of brush
     */

    touches: types.array(Points),
    currentTouch: types.maybeNull(types.reference(Points)),

    // points: types.array(types.array(types.number)),
    // eraserpoints: types.array(types.array(types.number)),

    mode: types.optional(types.string, "brush"),

    needsUpdate: types.optional(types.number, 1),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, ImageModel);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    afterCreate() {
      // if ()
      // const newdata = ctx.createImageData(750, 937);
      // newdata.data.set(decode(item._rle));
      // const dec = decode(self._rle);
      // self._rle_image =
      // item._cached_mask = decode(item._rle);
      // const newdata = ctx.createImageData(750, 937);
      //     newdata.data.set(item._cached_mask);
      //     var img = imagedata_to_image(newdata);
    },

    addTouch({ type, strokeWidth }) {
      const p = Points.create({ id: guidGenerator(), type: type, strokeWidth: strokeWidth });
      self.touches.push(p);
      self.currentTouch = p;

      return p;
    },

    afterAttach() {},

    unselectRegion() {
      self.selected = false;
      self.parent.setSelected(undefined);
      self.completion.setHighlightedNode(null);
      self.completion.unloadRegionState(self);
    },

    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);
      self.parent.setSelected(self.id);
      self.completion.loadRegionState(self);
    },

    convertPointsToMask() {},

    updateAppearenceFromState() {
      const stroke = self.states[0].getSelectedColor();
      self.strokeColor = stroke;
    },

    // addPoints(x, y, mode) {
    //   if (mode) self.mode = "eraser";
    //   self.points.push(x);
    //   self.points.push(y);
    // },

    // addEraserPoints(x, y) {
    //   self.eraserpoints = [...self.eraserpoints, x, y];
    // },

    setLayerRef(ref) {
      self.layerRef = ref;
    },

    setScale(x, y) {
      self.scaleX = x;
      self.scaleY = y;
    },

    updateImageSize(wp, hp, sw, sh) {
      if (self.parent.initialWidth > 1 && self.parent.initialHeight > 1) {
        let ratioX = self.parent.stageWidth / self.parent.initialWidth;
        let ratioY = self.parent.stageHeight / self.parent.initialHeight;

        self.setScale(ratioX, ratioY);

        self.needsUpdate = self.needsUpdate + 1;
      }
    },

    addState(state) {
      self.states.push(state);
    },

    toStateJSON() {
      const parent = self.parent;
      let fromElement = parent.states()[0];

      if (parent.states().length > 1) {
        parent.states().forEach(state => {
          if (state.type === "brushlabels") {
            fromElement = state;
          }
        });
      }

      // const ctx = self.layerRef.getContext("2d");

      const rle = Canvas.Region2RLE(self, self.parent, {
        stroke: self.strokeColor,
        tension: self.tension,
      });

      const buildTree = obj => {
        //     const data = ctx.getImageData(0,0,750, 937);

        const tree = {
          id: self.id,
          from_name: fromElement.name,
          to_name: parent.name,
          source: parent.value,
          type: "brush",

          value: {
            format: "rle",
            rle: Array.prototype.slice.call(rle),
          },

          original_width: self.parent.naturalWidth,
          original_height: self.parent.naturalHeight,
          // value: {
          //   points: self.points,
          //   eraserpoints: self.eraserpoints,
          // },
        };

        if (self.normalization) tree["normalization"] = self.normalization;

        return tree;
      };

      if (self.states && self.states.length) {
        return self.states.map(s => {
          const tree = buildTree(s);
          // in case of labels it's gonna be, labels: ["label1", "label2"]
          tree["value"][s.type] = s.getSelectedNames();
          tree["type"] = s.type;

          return tree;
        });
      } else {
        return buildTree(parent);
      }
    },
  }));

const BrushRegionModel = types.compose("BrushRegionModel", WithStatesMixin, RegionsMixin, NormalizationMixin, Model);

const HtxBrushLayer = observer(({ store, item, points }) => {
  let currentPoints = [];
  points.points.forEach(point => {
    currentPoints.push(point);
  });

  return points.type === "add" ? (
    <HtxBrushAddLine item={item} points={currentPoints} strokeWidth={points.strokeWidth} />
  ) : (
    <HtxBrushEraserLine item={item} points={currentPoints} strokeWidth={points.strokeWidth} />
  );
});

const HtxBrushAddLine = observer(({ store, item, points, strokeWidth }) => {
  let highlightOptions = {
    shadowColor: "red",
    shadowBlur: 1,
    shadowOffsetY: 2,
    shadowOffsetX: 2,
    shadowOpacity: 1,
  };

  let highlight = item.highlighted ? highlightOptions : { shadowOpacity: 0 };
  //        {...highlight}

  return (
    <Line
      onMouseDown={e => {
        e.cancelBubble = false;
      }}
      strokeWidth={strokeWidth}
      points={points}
      stroke={item.strokeColor}
      opacity={item.mode === "brush" ? item.opacity : 1}
      globalCompositeOperation={"source-over"}
      tension={item.tension}
      lineJoin={"round"}
      lineCap="round"
      {...highlight}
    />
  );
});

const HtxBrushEraserLine = ({ store, item, points, strokeWidth }) => {
  return (
    <Line
      onMouseDown={e => {
        e.cancelBubble = false;
      }}
      strokeWidth={strokeWidth}
      points={points}
      tension={item.tension}
      lineJoin={"round"}
      lineCap="round"
      stroke={item.strokeColor}
      opacity={1}
      globalCompositeOperation={"destination-out"}
    />
  );
};

const HtxBrushView = ({ store, item }) => {
  // if (item.parent.stageRef && item._rle) {
  //     const sref = item.parent.stageRef;
  //     const ctx = sref.getLayers()[0].getContext("2d");
  //     const newdata = ctx.createImageData(item.parent.stageWidth, item.parent.stageHeight);

  //     newdata.data.set(decode(item._rle));

  //     // newdata.data.set(RLEdecode(_rle))
  //     ctx.putImageData(newdata, 0, 0);
  // }

  let highlightOptions = {
    shadowColor: "red",
    shadowBlur: 1,
    shadowOffsetY: 2,
    shadowOffsetX: 2,
    shadowOpacity: 1,
  };

  let highlight = item.highlighted ? highlightOptions : { shadowOpacity: 0 };

  return (
    <Fragment>
      <Group
        attrMy={item.needsUpdate}
        name="segmentation"
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        // onClick={e => {
        //     e.cancelBubble = false;
        // }}
        // onMouseDown={e => {
        //     console.log("down");
        //     e.cancelBubble = false;
        // }}
        onMouseOver={e => {
          const stage = item.parent.stageRef;

          if (store.completionStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = "crosshair";
          } else {
            // no tool selected
            if (!item.parent.getToolsManager().findSelectedTool()) stage.container().style.cursor = "pointer";
          }
        }}
        onMouseOut={e => {
          if (store.completionStore.selected.relationMode) {
            item.setHighlight(false);
          }

          if (!item.parent.getToolsManager().findSelectedTool()) {
            const stage = item.parent.stageRef;
            stage.container().style.cursor = "default";
          }
        }}
        onClick={e => {
          if (item.parent.getToolsManager().findSelectedTool()) return;

          const stage = item.parent.stageRef;

          if (store.completionStore.selected.relationMode) {
            stage.container().style.cursor = "default";
          }

          item.setHighlight(false);
          item.onClickRegion();
        }}
      >
        <Shape
          sceneFunc={(ctx, shape) => {
            if (item.parent.naturalWidth == 1) return null;

            if (item._loadedOnce === true) {
              ctx.drawImage(item._img, 0, 0, item.parent.stageWidth, item.parent.stageHeight);
              ctx.fillStrokeShape(shape);

              return;
            }

            if (item._rle) {
              const img = Canvas.RLE2Region(item._rle, item.parent);
              item._loadedOnce = true;

              img.onload = function() {
                ctx.drawImage(img, 0, 0, item.parent.stageWidth, item.parent.stageHeight);
                ctx.fillStrokeShape(shape);
              };

              item._img = img;
            }
          }}
          opacity={1}
          {...highlight}
        />

        {item.touches.map(p => (
          <HtxBrushLayer store={store} item={item} points={p} />
        ))}
      </Group>
    </Fragment>
  );
};

const HtxBrush = inject("store")(observer(HtxBrushView));

Registry.addTag("brushregion", BrushRegionModel, HtxBrush);

export { BrushRegionModel, HtxBrush };
