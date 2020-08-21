import React, { Fragment } from "react";
import { Circle } from "react-konva";
import { observer, inject } from "mobx-react";
import { types, getParentOfType } from "mobx-state-tree";

import WithStatesMixin from "../mixins/WithStates";
import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import { ImageModel } from "../tags/object/Image";
import { KeyPointLabelsModel } from "../tags/control/KeyPointLabels";
import { guidGenerator } from "../core/Helpers";
import { LabelOnKP } from "../components/ImageView/LabelOnRegion";
import { ChoicesModel } from "../tags/control/Choices";
import { RatingModel } from "../tags/control/Rating";
import { TextAreaModel } from "../tags/control/TextArea";
import { AreaMixin } from "../mixins/AreaMixin";

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
  .volatile(self => ({
    relativeX: 0,
    relativeY: 0,
  }))
  .actions(self => ({
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

      if (!self.completion.sentUserGenerate && self.coordstype === "perc") {
        self.x = (sw * self.x) / 100;
        self.y = (sh * self.y) / 100;
        self.width = (sw * self.width) / 100;
        self.coordstype = "px";
      }
    },

    serialize() {
      const object = self.object;
      const { naturalWidth, naturalHeight, stageWidth, stageHeight } = object;
      const degree = -self.parent.rotation;
      const natural = self.rotateDimensions({ width: naturalWidth, height: naturalHeight }, degree);
      const { width, height } = self.rotateDimensions({ width: stageWidth, height: stageHeight }, degree);

      const { x, y } = self.rotatePoint(self, degree, false);

      const res = {
        original_width: natural.width,
        original_height: natural.height,
        image_rotation: self.parent.rotation,

        value: {
          x: (x * 100) / width,
          y: (y * 100) / height,
          width: (self.width * 100) / width, //  * (self.scaleX || 1)
        },
      };

      // res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },
  }));

const KeyPointRegionModel = types.compose(
  "KeyPointRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
);

const HtxKeyPointView = ({ store, item }) => {
  const x = item.x;
  const y = item.y;
  const style = item.style || item.tag;

  const props = {};

  props["opacity"] = +style.opacity;

  if (style.fillcolor) {
    props["fill"] = style.fillcolor;
  }

  props["stroke"] = style.strokecolor;
  props["strokeWidth"] = +style.strokewidth;
  props["strokeScaleEnabled"] = false;
  props["shadowBlur"] = 0;

  if (item.highlighted || item.selected) {
    props["stroke"] = Constants.HIGHLIGHTED_STROKE_COLOR;
    props["strokeWidth"] = Constants.HIGHLIGHTED_STROKE_WIDTH;
  }

  return (
    <Fragment>
      <Circle
        x={x}
        y={y}
        radius={item.width}
        scaleX={1 / item.parent.zoomScale}
        scaleY={1 / item.parent.zoomScale}
        name={item.id}
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
        onMouseOver={e => {
          const stage = item.parent.stageRef;

          if (store.completionStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = "crosshair";
          } else {
            stage.container().style.cursor = "pointer";
          }
        }}
        onMouseOut={e => {
          const stage = item.parent.stageRef;
          stage.container().style.cursor = "default";

          if (store.completionStore.selected.relationMode) {
            item.setHighlight(false);
          }
        }}
        onClick={e => {
          const stage = item.parent.stageRef;

          if (!item.completion.editable) return;

          if (store.completionStore.selected.relationMode) {
            stage.container().style.cursor = "default";
          }

          item.setHighlight(false);
          item.onClickRegion();
        }}
        {...props}
        draggable={item.editable}
      />
      <LabelOnKP item={item} />
    </Fragment>
  );
};

const HtxKeyPoint = inject("store")(observer(HtxKeyPointView));

Registry.addTag("keypointregion", KeyPointRegionModel, HtxKeyPoint);
Registry.addRegionType(
  KeyPointRegionModel,
  "image",
  value => "x" in value && "y" in value && "width" in value && !("height" in value),
);

export { KeyPointRegionModel, HtxKeyPoint };
