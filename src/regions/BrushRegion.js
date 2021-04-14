import React, { useCallback, useMemo, useState } from "react";
import { Line, Group, Layer, Image } from "react-konva";
import { observer } from "mobx-react";
import { types, getParent, getRoot, isAlive, cast } from "mobx-state-tree";

import Canvas from "../utils/canvas";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import WithStatesMixin from "../mixins/WithStates";
import { ImageModel } from "../tags/object/Image";
import { LabelOnMask } from "../components/ImageView/LabelOnRegion";
import { guidGenerator } from "../core/Helpers";
import { AreaMixin } from "../mixins/AreaMixin";

const highlightOptions = {
  shadowColor: "red",
  shadowBlur: 1,
  shadowOffsetY: 2,
  shadowOffsetX: 2,
  shadowOpacity: 1,
};

const Points = types
  .model("Points", {
    id: types.optional(types.identifier, guidGenerator),
    type: types.optional(types.enumeration(["add", "eraser"]), "add"),
    points: types.array(types.number),
    opacity: types.number,
    /**
     * Stroke width
     */
    strokeWidth: types.optional(types.number, 25),
  })
  .views(self => ({
    get store() {
      return getRoot(self);
    },
    get parent() {
      return getParent(self, 2);
    },
    get compositeOperation() {
      return self.type === "add" ? "source-over" : "destination-out";
    },
  }))
  .actions(self => {
    return {
      setType(type) {
        self.type = type;
      },

      addPoint(x, y) {
        // scale it back because it would be scaled on draw
        x = x / self.parent.scaleX;
        y = y / self.parent.scaleY;
        self.points.push(x);
        self.points.push(y);
      },

      setPoints(points) {
        self.points = points.map((c, i) => c / (i % 2 === 0 ? self.parent.scaleX : self.parent.scaleY));
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
    };
  });

/**
 * Rectangle object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),

    type: "brushregion",
    object: types.late(() => types.reference(ImageModel)),

    coordstype: types.optional(types.enumeration(["px", "perc"]), "perc"),

    rle: types.frozen(),

    touches: types.array(Points),
    currentTouch: types.maybeNull(types.reference(Points)),
  })
  .volatile(self => ({
    /**
     * Higher values will result in a more curvy line. A value of 0 will result in no interpolation.
     */
    tension: 0.0,
    /**
     * Stroke color
     */
    // strokeColor: types.optional(types.string, "red"),

    /**
     * Determines node opacity. Can be any number between 0 and 1
     */
    opacity: 1,
    scaleX: 1,
    scaleY: 1,

    // points: types.array(types.array(types.number)),
    // eraserpoints: types.array(types.array(types.number)),

    mode: "brush",

    needsUpdate: 1,
    hideable: true,
  }))
  .views(self => ({
    get parent() {
      return self.object;
    },
    get imageData() {
      if (!self.layerRef) return null;
      const ctx = self.layerRef.canvas.context;
      return ctx.getImageData(0, 0, self.layerRef.canvas.width, self.layerRef.canvas.height);
    },
  }))
  .actions(self => {
    let pathPoints,
      cachedPoints,
      lastPointX = -1,
      lastPointY = -1;
    return {
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

      setLayerRef(ref) {
        self.layerRef = ref;
      },

      preDraw(x, y) {
        if (!self.layerRef || cachedPoints.length === 0) return;
        const layer = self.layerRef;
        const ctx = layer.canvas.context;
        ctx.save();
        ctx.beginPath();
        if (cachedPoints.length / 2 > 2) {
          ctx.moveTo(lastPointX, lastPointY);
        } else {
          ctx.moveTo(cachedPoints[0], cachedPoints[1]);
          for (let i = 0; i < cachedPoints.length / 2; i++) {
            ctx.lineTo(cachedPoints[2 * i], cachedPoints[2 * i + 1]);
          }
        }
        ctx.lineTo(x, y);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = pathPoints.strokeWidth * self.scaleX;
        ctx.strokeStyle = self.style?.strokecolor;
        ctx.globalCompositeOperation = pathPoints.compositeOperation;
        ctx.globalAlpha = pathPoints.opacity;
        ctx.stroke();
        ctx.restore();
        lastPointX = x;
        lastPointY = y;
      },

      beginPath({ type, strokeWidth, opacity = self.opacity }) {
        pathPoints = Points.create({ id: guidGenerator(), type: type, strokeWidth: strokeWidth, opacity });
        cachedPoints = [];
        return pathPoints;
      },

      addPoint(x, y) {
        self.preDraw(x, y);
        cachedPoints.push(x);
        cachedPoints.push(y);
      },

      endPath() {
        self.touches.push(pathPoints);
        self.currentTouch = pathPoints;
        pathPoints.setPoints(cachedPoints);
        lastPointX = lastPointY = -1;
        pathPoints = null;
        cachedPoints = [];
      },

      convertPointsToMask() {},

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

      convertToImage() {
        if (self.touches.length) {
          const object = self.object;
          const rle = Canvas.Region2RLE(self, object, {
            stroke: self.strokeColor,
            tension: self.tension,
          });
          self.toches = cast([]);
          self.rle = Array.from(rle);
        }
      },

      serialize() {
        const object = self.object;
        const rle = Canvas.Region2RLE(self, object, {
          stroke: self.strokeColor,
          tension: self.tension,
        });

        if (!rle || !rle.length) return null;

        const res = {
          original_width: object.naturalWidth,
          original_height: object.naturalHeight,
          value: {
            format: "rle",
            // UInt8Array serializes as object, not an array :(
            rle: Array.from(rle),
          },
        };

        return res;
      },
    };
  });

const BrushRegionModel = types.compose(
  "BrushRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  AreaMixin,
  Model,
);

const HtxBrushLayer = observer(({ item, points }) => {
  const highlight = item.highlighted ? highlightOptions : { shadowOpacity: 0 };

  const eraseLineHitFunc = useCallback(function(context, shape) {
    const colorKey = shape.colorKey;
    shape._sceneFunc(context, shape);
    shape.colorKey = "#ffffff";
    context.strokeShape(shape);
    shape.colorKey = colorKey;
  });
  const lineHitFunc = points.type === "eraser" ? eraseLineHitFunc : null;
  return (
    <Line
      hitFunc={lineHitFunc}
      points={[...points.points]}
      stroke={item.style?.strokecolor}
      strokeWidth={points.strokeWidth}
      lineJoin={"round"}
      lineCap="round"
      tension={item.tension}
      globalCompositeOperation={points.compositeOperation}
      opacity={points.opacity}
      {...highlight}
    />
  );
});

const HtxBrushView = ({ item, meta }) => {
  const [image, setImage] = useState();
  useMemo(() => {
    if (!item.rle) return;
    const img = Canvas.RLE2Region(item.rle, item.parent);
    img.onload = () => {
      setImage(img);
    };
  }, [item.rle, item.parent]);

  const imageHitFunc = useCallback(
    (context, shape) => {
      if (image) {
        context.drawImage(image, 0, 0, item.parent.stageWidth, item.parent.stageHeight);
        const colorParts = [
          parseInt(shape.colorKey.slice(1, 3), 16),
          parseInt(shape.colorKey.slice(3, 5), 16),
          parseInt(shape.colorKey.slice(5, 7), 16),
        ];
        const imageData = context.getImageData(0, 0, item.parent.stageWidth, item.parent.stageHeight);
        for (let i = imageData.data.length / 4 - 1; i >= 0; i--) {
          if (imageData.data[i * 4 + 3] > 0) {
            for (let k = 0; k < 3; k++) {
              imageData.data[i * 4 + k] = colorParts[k];
            }
          }
        }
        context.putImageData(imageData, 0, 0);
      }
    },
    [image],
  );

  if (!isAlive(item)) return null;
  if (item.hidden) return null;

  const { store } = item;

  // if (item.parent.stageRef && item._rle) {
  //     const sref = item.parent.stageRef;
  //     const ctx = sref.getLayers()[0].getContext("2d");
  //     const newdata = ctx.createImageData(item.parent.stageWidth, item.parent.stageHeight);

  //     newdata.data.set(decode(item._rle));

  //     // newdata.data.set(RLEdecode(_rle))
  //     ctx.putImageData(newdata, 0, 0);
  // }

  let highlight = item.highlighted ? highlightOptions : { shadowOpacity: 0 };

  return (
    <Layer id={item.cleanId} ref={ref => item.setLayerRef(ref)}>
      <Group
        attrMy={item.needsUpdate}
        name="segmentation"
        // onClick={e => {
        //     e.cancelBubble = false;
        // }}
        onMouseDown={e => {
          if (store.annotationStore.selected.relationMode) {
            e.cancelBubble = true;
          }
        }}
        onMouseOver={e => {
          const stage = item.parent.stageRef;

          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = "crosshair";
          } else {
            // no tool selected
            if (!item.parent.getToolsManager().findSelectedTool()) stage.container().style.cursor = "pointer";
          }
        }}
        onMouseOut={e => {
          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(false);
          }

          if (!item.parent.getToolsManager().findSelectedTool()) {
            const stage = item.parent.stageRef;
            stage.container().style.cursor = "default";
          }
        }}
        onClick={e => {
          if (store.annotationStore.selected.relationMode) {
            item.onClickRegion();
            return;
          }

          if (item.parent.getToolsManager().findSelectedTool()) return;

          const stage = item.parent.stageRef;

          if (store.annotationStore.selected.relationMode) {
            stage.container().style.cursor = "default";
          }

          item.setHighlight(false);
          item.onClickRegion();
        }}
      >
        {/* @todo and this will allow to use scale on parent Group */}
        <Image
          image={image}
          hitFunc={imageHitFunc}
          opacity={1}
          {...highlight}
          width={item.parent.stageWidth}
          height={item.parent.stageHeight}
        />

        <Group scaleX={item.scaleX} scaleY={item.scaleY}>
          {item.touches.map(p => (
            <HtxBrushLayer key={p.id} store={store} item={item} points={p} />
          ))}

          <LabelOnMask item={item} />
        </Group>
      </Group>
    </Layer>
  );
};

const HtxBrush = observer(HtxBrushView);

Registry.addTag("brushregion", BrushRegionModel, HtxBrush);
Registry.addRegionType(BrushRegionModel, "image", value => value.rle || value.touches);

export { BrushRegionModel, HtxBrush };
