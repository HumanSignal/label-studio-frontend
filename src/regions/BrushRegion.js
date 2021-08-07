import React, { useCallback, useMemo, useRef, useState } from "react";
import { Group, Layer, Image, Shape } from "react-konva";
import { observer } from "mobx-react";
import { types, getParent, getRoot, cast } from "mobx-state-tree";

import Canvas from "../utils/canvas";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import WithStatesMixin from "../mixins/WithStates";
import { ImageModel } from "../tags/object/Image";
import { LabelOnMask } from "../components/ImageView/LabelOnRegion";
import { guidGenerator } from "../core/Helpers";
import { AreaMixin } from "../mixins/AreaMixin";
import { colorToRGBAArray, rgbArrayToHex } from "../utils/colors";
import { defaultStyle } from "../core/Constants";
import { AliveRegion } from "./AliveRegion";
import { KonvaRegionMixin } from "../mixins/KonvaRegion";

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
    /**
     * Stroke width
     */
    strokeWidth: types.optional(types.number, 25),
  })
  .views(self => ({
    get store () {
      return getRoot(self);
    },
    get parent () {
      return getParent(self, 2);
    },
    get compositeOperation () {
      return self.type === "add" ? "source-over" : "destination-out";
    },
  }))
  .actions(self => {
    return {
      setType (type) {
        self.type = type;
      },

      addPoint (x, y) {
        // scale it back because it would be scaled on draw
        x = x / self.parent.scaleX;
        y = y / self.parent.scaleY;
        self.points.push(x);
        self.points.push(y);
      },

      setPoints (points) {
        self.points = points.map((c, i) => c / (i % 2 === 0 ? self.parent.scaleX : self.parent.scaleY));
      },

      // rescale points to the new width and height from the original
      rescale (origW, origH, destW) {
        const s = destW / origW;

        return self.points.map(p => p * s);
      },

      scaledStrokeWidth (origW, origH, destW) {
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
  .volatile(() => ({
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
    opacity: 0.6,
    scaleX: 1,
    scaleY: 1,

    // points: types.array(types.array(types.number)),
    // eraserpoints: types.array(types.array(types.number)),

    mode: "brush",

    needsUpdate: 1,
    hideable: true,
    layerRef: undefined,
  }))
  .views(self => ({
    get parent () {
      return self.object;
    },
    get imageData () {
      if (!self.layerRef) return null;
      const ctx = self.layerRef.canvas.context;

      return ctx.getImageData(0, 0, self.layerRef.canvas.width, self.layerRef.canvas.height);
    },
    get colorParts () {
      const style = self.style || self.tag || defaultStyle;

      return colorToRGBAArray(style.strokecolor);
    },
    get strokeColor () {
      return rgbArrayToHex(self.colorParts);
    },
    get touchesLength () {
      return self.touches.length;
    },
  }))
  .actions(self => {
    let pathPoints,
      cachedPoints,
      lastPointX = -1,
      lastPointY = -1;

    return {
      afterCreate () {
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

      setLayerRef (ref) {
        self.layerRef = ref;
        if (self.layerRef) {
          self.layerRef.canvas._canvas.style.opacity = self.opacity;
        }
      },

      prepareCoords ([x, y]) {
        return self.parent.zoomOriginalCoords([x, y]);
      },

      preDraw (x, y) {
        if (!self.layerRef) return;
        const layer = self.layerRef;
        const ctx = layer.canvas.context;

        ctx.save();
        ctx.beginPath();
        if (cachedPoints.length / 2 > 3) {
          ctx.moveTo(...self.prepareCoords([lastPointX, lastPointY]));
        } else if (cachedPoints.length === 0) {
          ctx.moveTo(...self.prepareCoords([x, y]));
        } else {
          ctx.moveTo(...self.prepareCoords([cachedPoints[0], cachedPoints[1]]));
          for (let i = 0; i < cachedPoints.length / 2; i++) {
            ctx.lineTo(...self.prepareCoords([cachedPoints[2 * i], cachedPoints[2 * i + 1]]));
          }
        }
        ctx.lineTo(...self.prepareCoords([x, y]));
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = pathPoints.strokeWidth * self.scaleX * self.parent.stageScale;
        ctx.strokeStyle = self.strokeColor;
        ctx.globalCompositeOperation = pathPoints.compositeOperation;
        ctx.stroke();
        ctx.restore();
        lastPointX = x;
        lastPointY = y;
      },

      beginPath ({ type, strokeWidth, opacity = self.opacity }) {
        pathPoints = Points.create({ id: guidGenerator(), type, strokeWidth, opacity });
        cachedPoints = [];
        return pathPoints;
      },

      addPoint (x, y) {
        self.preDraw(x, y);
        cachedPoints.push(x);
        cachedPoints.push(y);
      },

      endPath () {
        if (cachedPoints.length === 2) {
          cachedPoints.push(cachedPoints[0]);
          cachedPoints.push(cachedPoints[1]);
        }
        self.touches.push(pathPoints);
        self.currentTouch = pathPoints;
        pathPoints.setPoints(cachedPoints);
        lastPointX = lastPointY = -1;
        pathPoints = null;
        cachedPoints = [];
      },

      convertPointsToMask () {},

      setScale (x, y) {
        self.scaleX = x;
        self.scaleY = y;
      },

      updateImageSize () {
        if (self.parent.initialWidth > 1 && self.parent.initialHeight > 1) {
          let ratioX = self.parent.stageWidth / self.parent.initialWidth;
          let ratioY = self.parent.stageHeight / self.parent.initialHeight;

          self.setScale(ratioX, ratioY);

          self.needsUpdate = self.needsUpdate + 1;
        }
      },

      addState (state) {
        self.states.push(state);
      },

      convertToImage () {
        if (self.touches.length) {
          const object = self.object;
          const rle = Canvas.Region2RLE(self, object, {
            color: self.strokeColor,
          });

          self.toches = cast([]);
          self.rle = Array.from(rle);
        }
      },

      serialize () {
        const object = self.object;
        const rle = Canvas.Region2RLE(self, object);

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
  KonvaRegionMixin,
  Model,
);

const HtxBrushLayer = observer(({ item, pointsList }) => {
  const drawLine = useCallback((ctx, { points, strokeWidth, strokeColor, compositeOperation }) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 0; i < points.length / 2; i++) {
      ctx.lineTo(points[2 * i], points[2 * i + 1]);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.globalCompositeOperation = compositeOperation;
    ctx.stroke();
    ctx.restore();
  });

  const sceneFunc = useCallback(
    (context) => {
      pointsList.forEach(points => {
        drawLine(context, {
          points: points.points,
          strokeWidth: points.strokeWidth,
          strokeColor: item.strokeColor,
          compositeOperation: points.compositeOperation,
        });
      });
    },
    [pointsList, pointsList.length, item.strokeColor],
  );

  const hitFunc = useCallback(
    (context, shape) => {
      pointsList.forEach(points => {
        drawLine(context, {
          points: points.points,
          strokeWidth: points.strokeWidth,
          strokeColor: points.type === "eraser" ? "#ffffff" : shape.colorKey,
          compositeOperation: "source-over",
        });
      });
    },
    [pointsList, pointsList.length],
  );

  return <Shape sceneFunc={sceneFunc} hitFunc={hitFunc} />;
});

const HtxBrushView = ({ item }) => {
  const [image, setImage] = useState();

  useMemo(() => {
    if (!item.rle || !item.parent || item.parent.naturalWidth <=1 || item.parent.naturalHeight <= 1) return;
    const img = Canvas.RLE2Region(item.rle, item.parent, { color: item.strokeColor });

    img.onload = () => {
      setImage(img);
    };
  }, [item.rle, item.parent, item.parent?.naturalWidth, item.parent?.naturalHeight, item.strokeColor]);

  const imageHitFunc = useCallback(
    (context, shape) => {
      if (image) {
        context.drawImage(image, 0, 0, item.parent.stageWidth, item.parent.stageHeight);
        const imageData = context.getImageData(0, 0, item.parent.stageWidth, item.parent.stageHeight);
        const colorParts = colorToRGBAArray(shape.colorKey);

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
    [image, item.parent?.stageWidth, item.parent?.stageHeight],
  );
  const { store } = item;

  let highlight = item.highlighted ? highlightOptions : { shadowOpacity: 0 };

  const highlightedImageRef = useRef(new window.Image());
  const layerRef = useRef();
  const highlightedRef = useRef();
  const drawCallback = useCallback(() => {
    if (layerRef.current && !highlightedRef.current) {
      const dataUrl = layerRef.current.canvas.toDataURL();

      highlightedImageRef.current.src = dataUrl;
    }
  }, []);

  if (!item.parent) return null;

  highlightedRef.current = item.highlighted;
  const stage = item.parent?.stageRef;

  return (
    <Layer
      id={item.cleanId}
      ref={ref => {
        item.setLayerRef(ref);
        layerRef.current = ref;
      }}
      onDraw={drawCallback}
    >
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
        onMouseOver={() => {
          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = "crosshair";
          } else {
            // no tool selected
            if (!item.parent.getToolsManager().findSelectedTool()) stage.container().style.cursor = "pointer";
          }
        }}
        onMouseOut={() => {
          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(false);
          }

          if (!item.parent?.getToolsManager().findSelectedTool()) {
            stage.container().style.cursor = "default";
          }
        }}
        onClick={e => {
          if (item.parent.getSkipInteractions()) return;
          if (store.annotationStore.selected.relationMode) {
            item.onClickRegion();
            return;
          }

          if (item.parent.getToolsManager().findSelectedTool()) return;

          if (store.annotationStore.selected.relationMode) {
            stage.container().style.cursor = "default";
          }

          item.setHighlight(false);
          item.onClickRegion(e);
        }}
      >
        <Image image={image} hitFunc={imageHitFunc} width={item.parent.stageWidth} height={item.parent.stageHeight} />

        <Group scaleX={item.scaleX} scaleY={item.scaleY}>
          <HtxBrushLayer store={store} item={item} pointsList={item.touches} />
          <LabelOnMask item={item} color={item.strokeColor}/>
        </Group>

        <Image
          image={highlightedImageRef.current}
          sceneFunc={item.highlighted ? null : () => {}}
          hitFunc={() => {}}
          {...highlight}
          scaleX={1/item.parent.stageScale}
          scaleY={1/item.parent.stageScale}
          x={-item.parent.zoomingPositionX/item.parent.stageScale}
          y={-item.parent.zoomingPositionY/item.parent.stageScale}
          width={item.parent.stageWidth}
          height={item.parent.stageHeight}
        />
      </Group>
    </Layer>
  );
};

const HtxBrush = AliveRegion(HtxBrushView);

Registry.addTag("brushregion", BrushRegionModel, HtxBrush);
Registry.addRegionType(BrushRegionModel, "image", value => value.rle || value.touches);

export { BrushRegionModel, HtxBrush };
