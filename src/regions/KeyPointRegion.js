import React, { Fragment } from "react";
import { Circle } from "react-konva";
import { getRoot, types } from "mobx-state-tree";

import WithStatesMixin from "../mixins/WithStates";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import { ImageModel } from "../tags/object/Image";
import { guidGenerator } from "../core/Helpers";
import { LabelOnKP } from "../components/ImageView/LabelOnRegion";
import { AreaMixin } from "../mixins/AreaMixin";
import { useRegionColors } from "../hooks/useRegionColor";
import { AliveRegion } from "./AliveRegion";
import { KonvaRegionMixin } from "../mixins/KonvaRegion";

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "keypointregion",
    object: types.late(() => types.reference(ImageModel)),

    x: types.number,
    y: types.number,

    width: types.number,
    coordstype: types.optional(types.enumeration(["px", "perc"]), "perc"),
  })
  .volatile(() => ({
    relativeX: 0,
    relativeY: 0,
    hideable: true,
  }))
  .views(self => ({
    get store() {
      return getRoot(self);
    },
  }))
  .actions(self => ({
    afterCreate() {
      if (self.coordstype === "perc") {
        // deserialization
        self.relativeX = self.x;
        self.relativeY = self.y;
        self.checkSizes();
      } else {
        // creation
        const { stageWidth: width, stageHeight: height } = self.parent;

        if (width && height) {
          self.relativeX = (self.x / width) * 100;
          self.relativeY = (self.y / height) * 100;
        }
      }
    },

    // @todo not used
    rotate(degree) {
      const p = self.rotatePoint(self, degree);

      self.setPosition(p.x, p.y);
    },

    setPosition(x, y) {
      self.x = x;
      self.y = y;

      self.relativeX = (x / self.parent.stageWidth) * 100;
      self.relativeY = (y / self.parent.stageHeight) * 100;
    },

    updateImageSize(wp, hp, sw, sh) {
      if (self.coordstype === "px") {
        self.x = (sw * self.relativeX) / 100;
        self.y = (sh * self.relativeY) / 100;
      }

      if (self.coordstype === "perc") {
        self.x = (sw * self.x) / 100;
        self.y = (sh * self.y) / 100;
        self.width = (sw * self.width) / 100;
        self.coordstype = "px";
      }
    },

    /**
     * @example
     * {
     *   "original_width": 1920,
     *   "original_height": 1280,
     *   "image_rotation": 0,
     *   "value": {
     *     "x": 3.1,
     *     "y": 8.2,
     *     "width": 2,
     *     "keypointlabels": ["Car"]
     *   }
     * }
     * @typedef {Object} KeyPointRegionResult
     * @property {number} original_width width of the original image (px)
     * @property {number} original_height height of the original image (px)
     * @property {number} image_rotation rotation degree of the image (deg)
     * @property {Object} value
     * @property {number} value.x x coordinate by percentage of the image size (0-100)
     * @property {number} value.y y coordinate by percentage of the image size (0-100)
     * @property {number} value.width point size by percentage of the image size (0-100)
     */

    /**
     * @return {KeyPointRegionResult}
     */
    serialize() {
      return {
        original_width: self.parent.naturalWidth,
        original_height: self.parent.naturalHeight,
        image_rotation: self.parent.rotation,
        value: {
          x: self.convertXToPerc(self.x),
          y: self.convertYToPerc(self.y),
          width: self.convertHDimensionToPerc(self.width),
        },
      };
    },
  }));

const KeyPointRegionModel = types.compose(
  "KeyPointRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  KonvaRegionMixin,
  Model,
);

const HtxKeyPointView = ({ item }) => {
  const { store } = item;

  const x = item.x;
  const y = item.y;

  const colors = useRegionColors(item);

  const props = {
    opacity: 1,
    fill: colors.fillColor,
    stroke: colors.strokeColor,
    strokeWidth: colors.strokeWidth,
    strokeScaleEnabled: false,
    shadowBlur: 0,
  };

  const stage = item.parent.stageRef;

  return (
    <Fragment>
      <Circle
        x={x}
        y={y}
        radius={item.width}
        // fixes performance, but opactity+borders might look not so good
        perfectDrawEnabled={false}
        scaleX={1 / item.parent.zoomScale}
        scaleY={1 / item.parent.zoomScale}
        name={item.id}
        onDragStart={e => {
          if (item.parent.getSkipInteractions()) {
            e.currentTarget.stopDrag(e.evt);
            return;
          }
        }}
        onDragEnd={e => {
          const t = e.target;

          item.setPosition(t.getAttr("x"), t.getAttr("y"));
        }}
        dragBoundFunc={item.parent.fixForZoom(pos => {
          const r = item.parent.stageWidth;
          const b = item.parent.stageHeight;

          let { x, y } = pos;

          if (x < 0) x = 0;
          if (y < 0) y = 0;

          if (x > r) x = r;
          if (y > b) y = b;

          return { x, y };
        })}
        onMouseOver={() => {
          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = "crosshair";
          } else {
            stage.container().style.cursor = "pointer";
          }
        }}
        onMouseOut={() => {
          stage.container().style.cursor = "default";

          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(false);
          }
        }}
        onClick={e => {
          if (!item.annotation.editable || item.parent.getSkipInteractions()) return;

          if (store.annotationStore.selected.relationMode) {
            stage.container().style.cursor = "default";
          }

          item.setHighlight(false);
          item.onClickRegion(e);
        }}
        {...props}
        draggable={item.editable}
      />
      <LabelOnKP item={item} color={colors.strokeColor}/>
    </Fragment>
  );
};

const HtxKeyPoint = AliveRegion(HtxKeyPointView);

Registry.addTag("keypointregion", KeyPointRegionModel, HtxKeyPoint);
Registry.addRegionType(
  KeyPointRegionModel,
  "image",
  value => "x" in value && "y" in value && "width" in value && !("height" in value),
);

export { KeyPointRegionModel, HtxKeyPoint };
