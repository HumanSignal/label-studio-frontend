import { destroy, getParent, getRoot, getType, types } from "mobx-state-tree";
import { inject } from "mobx-react";

import * as Tools from "../../tools";
import ImageView from "../../components/ImageView/ImageView";
import ObjectBase from "./Base";
import Registry from "../../core/Registry";
import ToolsManager from "../../tools/Manager";
import { BrushRegionModel } from "../../regions/BrushRegion";
import { KeyPointRegionModel } from "../../regions/KeyPointRegion";
import { PolygonRegionModel } from "../../regions/PolygonRegion";
import { RectRegionModel } from "../../regions/RectRegion";
import { EllipseRegionModel } from "../../regions/EllipseRegion";
import { customTypes } from "../../core/CustomTypes";
import { parseValue } from "../../utils/data";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { clamp } from "../../utils/utilities";
import { guidGenerator } from "../../utils/unique";

/**
 * The Image tag shows an image on the page. Use for all image annotation tasks to display an image on the labeling interface.
 *
 * Use with the following data types: images
 *
 * When you annotate image regions with this tag, the annotations are saved as percentages of the original size of the image, from 0-100.
 * @example
 * <!--Labeling configuration to display an image on the labeling interface-->
 * <View>
 *   <!-- Retrieve the image url from the url field in JSON or column in CSV -->
 *   <Image name="image" value="$url" rotateControl="true" zoomControl="true"></Image>
 * </View>
 * @name Image
 * @meta_title Image Tags for Images
 * @meta_description Customize Label Studio with the Image tag to annotate images for computer vision machine learning and data science projects.
 * @param {string} name                       - Name of the element
 * @param {string} value                      - Data field containing a path or URL to the image
 * @param {string=} [width=100%]              - Image width
 * @param {string=} [maxWidth=750px]          - Maximum image width
 * @param {boolean=} [zoom=false]             - Enable zooming an image with the mouse wheel
 * @param {boolean=} [negativeZoom=false]     - Enable zooming out an image
 * @param {float=} [zoomBy=1.1]               - Scale factor
 * @param {boolean=} [grid=false]             - Whether to show a grid
 * @param {number=} [gridSize=30]             - Specify size of the grid
 * @param {string=} [gridColor="#EEEEF4"]     - Color of the grid in hex, opacity is 0.15
 * @param {boolean} [zoomControl=false]       - Show zoom controls in toolbar
 * @param {boolean} [brightnessControl=false] - Show brightness control in toolbar
 * @param {boolean} [contrastControl=false]   - Show contrast control in toolbar
 * @param {boolean} [rotateControl=false]     - Show rotate control in toolbar
 * @param {boolean} [crosshair=false]         – Show crosshair cursor
 */
const TagAttrs = types.model({
  name: types.identifier,
  value: types.maybeNull(types.string),
  resize: types.maybeNull(types.number),
  width: types.optional(types.string, "100%"),
  maxwidth: types.optional(types.string, "750px"),

  // rulers: types.optional(types.boolean, true),
  grid: types.optional(types.boolean, false),
  gridsize: types.optional(types.string, "30"),
  gridcolor: types.optional(customTypes.color, "#EEEEF4"),

  zoom: types.optional(types.boolean, true),
  negativezoom: types.optional(types.boolean, false),
  zoomby: types.optional(types.string, "1.1"),

  showlabels: types.optional(types.boolean, false),

  zoomcontrol: types.optional(types.boolean, true),
  brightnesscontrol: types.optional(types.boolean, false),
  contrastcontrol: types.optional(types.boolean, false),
  rotatecontrol: types.optional(types.boolean, false),
  crosshair: types.optional(types.boolean, false),
  selectioncontrol: types.optional(types.boolean, true),
});

const IMAGE_CONSTANTS = {
  rectangleModel: "RectangleModel",
  rectangleLabelsModel: "RectangleLabelsModel",
  ellipseModel: "EllipseModel",
  ellipseLabelsModel: "EllipseLabelsModel",
  brushLabelsModel: "BrushLabelsModel",
  rectanglelabels: "rectanglelabels",
  keypointlabels: "keypointlabels",
  polygonlabels: "polygonlabels",
  brushlabels: "brushlabels",
  brushModel: "BrushModel",
  ellipselabels: "ellipselabels",
};

const DrawingRegion = types.union(
  {
    dispatcher(sn) {
      if (!sn) return types.null;
      // may be a tag itself or just its name
      const objectName = sn.object.name || sn.object;
      // we have to use current config to detect Object tag by name
      const tag = window.Htx.annotationStore.names.get(objectName);
      // provide value to detect Area by data
      const available = Registry.getAvailableAreas(tag.type, sn);
      // union of all available Areas for this Object type

      return types.union(...available, types.null);
    },
  },
);

const ImageSelectionPoint = types.model({
  x: types.number,
  y: types.number,
});
const ImageSelection = types.model({
  start: types.maybeNull(ImageSelectionPoint),
  end: types.maybeNull(ImageSelectionPoint),
}).views( self => {
  return {
    get obj() {
      return getParent(self);
    },
    get annotation() {
      return self.obj.annotation;
    },
    get highlightedNodeExists() {
      return !!self.annotation.highlightedNode;
    },
    get isActive() {
      return self.start && self.end;
    },
    get x() {
      return Math.min((self.start.x * self.scale), (self.end.x * self.scale));
    },
    get y() {
      return Math.min((self.start.y * self.scale), (self.end.y * self.scale));
    },
    get width() {
      return Math.abs((self.end.x * self.scale) - (self.start.x * self.scale));
    },
    get height() {
      return Math.abs((self.end.y * self.scale) - (self.start.y * self.scale));
    },
    get scale() {
      return self.obj.zoomScale;
    },
    get bbox() {
      const { start, end } = self;

      return self.isActive ? {
        left: Math.min(start.x, end.x),
        top: Math.min(start.y, end.y),
        right: Math.max(start.x, end.x),
        bottom: Math.max(start.y, end.y),
      } : null;
    },
    includesBbox(bbox) {
      return self.isActive && bbox && self.bbox.left <= bbox.left && self.bbox.top <= bbox.top && self.bbox.right >= bbox.right && self.bbox.bottom >= bbox.bottom;
    },
    intersectsBbox(bbox) {
      if (!self.isActive || !bbox) return false;
      const selfCenterX = (self.bbox.left + self.bbox.right) / 2;
      const selfCenterY = (self.bbox.top + self.bbox.bottom) / 2;
      const selfWidth = self.bbox.right - self.bbox.left;
      const selfHeight = self.bbox.bottom - self.bbox.top;
      const targetCenterX = (bbox.left + bbox.right) / 2;
      const targetCenterY = (bbox.top + bbox.bottom) / 2;
      const targetWidth = bbox.right - bbox.left;
      const targetHeight = bbox.bottom - bbox.top;

      return (Math.abs(selfCenterX - targetCenterX) * 2 < (selfWidth + targetWidth)) &&
        (Math.abs(selfCenterY - targetCenterY) * 2 < (selfHeight + targetHeight));
    },
    get selectionBorders() {
      return self.isActive || !self.obj.selectedRegions.length ? null : self.obj.selectedRegions.reduce((borders, region)=>{
        return  region.bboxCoords ? {
          left: Math.min(borders.left, region.bboxCoords.left),
          top: Math.min(borders.top,region.bboxCoords.top),
          right: Math.max(borders.right, region.bboxCoords.right),
          bottom: Math.max(borders.bottom, region.bboxCoords.bottom),
        } : borders;
      }, {
        left: self.obj.stageWidth,
        top: self.obj.stageHeight,
        right: 0,
        bottom: 0,
      });
    },
  };
}).actions(self => {
  return {
    setStart(point) {
      self.start = point;
    },
    setEnd(point) {
      self.end = point;
    },
  };
});

const Model = types.model({
  type: "image",

  // tools: types.array(BaseTool),

  rotation: types.optional(types.number, 0),

  sizeUpdated: types.optional(types.boolean, false),

  /**
   * Natural sizes of Image
   * Constants
   */
  naturalWidth: types.optional(types.integer, 1),
  naturalHeight: types.optional(types.integer, 1),

  /**
   * Initial width and height of the image
   */
  initialWidth: types.optional(types.integer, 1),
  initialHeight: types.optional(types.integer, 1),

  stageWidth: types.optional(types.integer, 1),
  stageHeight: types.optional(types.integer, 1),

  /**
   * Zoom Scale
   */
  zoomScale: types.optional(types.number, 1),

  /**
   * Coordinates of left top corner
   * Default: { x: 0, y: 0 }
   */
  zoomingPositionX: types.maybeNull(types.number),
  zoomingPositionY: types.maybeNull(types.number),

  /**
   * Brightness of Canvas
   */
  brightnessGrade: types.optional(types.number, 100),

  contrastGrade: types.optional(types.number, 100),

  /**
   * Cursor coordinates
   */
  cursorPositionX: types.optional(types.number, 0),
  cursorPositionY: types.optional(types.number, 0),

  brushControl: types.optional(types.string, "brush"),

  brushStrokeWidth: types.optional(types.number, 15),

  /**
   * Mode
   * brush for Image Segmentation
   * eraser for Image Segmentation
   */
  mode: types.optional(types.enumeration(["drawing", "viewing", "brush", "eraser"]), "viewing"),

  regions: types.array(
    types.union(BrushRegionModel, RectRegionModel, EllipseRegionModel, PolygonRegionModel, KeyPointRegionModel),
    [],
  ),

  drawingRegion: types.optional(DrawingRegion, null),
  selectionArea: types.optional(ImageSelection, { start: null, end: null }),
}).volatile(() => ({
  currentImage: 0,
  stageRatio: 1,
})).views(self => ({
  get store() {
    return getRoot(self);
  },

  get parsedValue() {
    return parseValue(self.value, self.store.task.dataObj);
  },

  // @todo the name is for backward compatibility; change the name later
  get _value() {
    const value = self.parsedValue;

    if (Array.isArray(value)) return value[self.currentImage];
    return value;
  },

  get images() {
    const value = self.parsedValue;

    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  },

  /**
   * @return {boolean}
   */
  get hasStates() {
    const states = self.states();

    return states && states.length > 0;
  },

  get regs() {
    return self.annotation?.regionStore.regions.filter(r => r.object === self) || [];
  },

  get selectedRegions() {
    return self.regs.filter(region => region.inSelection);
  },

  get selectedRegionsBBox() {
    let bboxCoords;

    self.selectedRegions.forEach((region) => {
      if (bboxCoords) {
        bboxCoords = {
          left: Math.min(region.bboxCoords.left, bboxCoords.left),
          top: Math.min(region.bboxCoords.top, bboxCoords.top),
          right: Math.max(region.bboxCoords.right, bboxCoords.right),
          bottom: Math.max(region.bboxCoords.bottom, bboxCoords.bottom),
        };
      } else {
        bboxCoords = region.bboxCoords;
      }
    });
    return bboxCoords;
  },

  get regionsInSelectionArea() {
    return self.regs.filter(region => region.isInSelectionArea);
  },

  get selectedShape() {
    return self.regs.find(r => r.selected);
  },

  get suggestions() {
    return self.annotation?.regionStore.suggestions.filter(r => r.object === self) || [];
  },

  get useTransformer() {
    return self.getToolsManager().findSelectedTool()?.useTransformer === true;
  },

  get stageTranslate() {
    return {
      0: { x: 0, y: 0 },
      90: { x: 0, y: self.stageHeight },
      180: { x: self.stageWidth, y: self.stageHeight },
      270: { x: self.stageWidth, y: 0 },
    }[self.rotation];
  },

  get stageScale() {
    return self.zoomScale * self.stageRatio;
  },

  get hasTools() {
    return !!self.getToolsManager().allTools()?.length;
  },

  /**
   * @return {object}
   */
  states() {
    return self.annotation.toNames.get(self.name);
  },

  activeStates() {
    const states = self.states();

    return states && states.filter(s => s.isSelected && s.type.includes("labels"));
  },

  controlButton() {
    const names = self.states();

    if (!names || names.length === 0) return;

    let returnedControl = names[0];

    names.forEach(item => {
      if (
        item.type === IMAGE_CONSTANTS.rectanglelabels ||
        item.type === IMAGE_CONSTANTS.brushlabels ||
        item.type === IMAGE_CONSTANTS.ellipselabels
      ) {
        returnedControl = item;
      }
    });

    return returnedControl;
  },

  get controlButtonType() {
    const name = self.controlButton();

    return getType(name).name;
  },

  get stageComponentSize() {
    if ((self.rotation + 360) % 180 === 90) {
      return {
        width: self.stageHeight * self.stageRatio,
        height: self.stageWidth * self.stageRatio,
      };
    }
    return {
      width: self.stageWidth * self.stageRatio,
      height: self.stageHeight * self.stageRatio,
    };
  },

  get zoomBy() {
    return parseFloat(self.zoomby);
  },
  get isDrawing() {
    return !!self.drawingRegion;
  },
}))

  // actions for the tools
  .actions(self => {
    const manager = ToolsManager.getInstance({ name: self.name });
    const env = { manager, control: self };

    manager.reload({ name: self.name });

    function afterCreate() {
      if (self.selectioncontrol)
        manager.addTool("selection", Tools.Selection.create({}, env));

      if (self.zoomcontrol)
        manager.addTool("zoom", Tools.Zoom.create({}, env));

      if (self.brightnesscontrol)
        manager.addTool("brightness", Tools.Brightness.create({}, env));

      if (self.contrastcontrol)
        manager.addTool("contrast", Tools.Contrast.create({}, env));

      if (self.rotatecontrol)
        manager.addTool("rotate", Tools.Rotate.create({}, env));
    }

    function getToolsManager() {
      return manager;
    }

    return { afterCreate, getToolsManager };
  }).extend((self) => {
    let skipInteractions = false;

    return {
      views: {
        getSkipInteractions() {
          const manager = self.getToolsManager();

          const isPanning = manager.findSelectedTool()?.toolName === "ZoomPanTool";

          return skipInteractions || isPanning;
        },
      },
      actions: {
        setSkipInteractions(value) {
          skipInteractions = value;
        },
        updateSkipInteractions(e) {
          const currentTool = self.getToolsManager().findSelectedTool();

          if (currentTool?.shouldSkipInteractions) {
            return self.setSkipInteractions(currentTool.shouldSkipInteractions(e));
          }
          self.setSkipInteractions(e.evt && (e.evt.metaKey || e.evt.ctrlKey));
        },
      },
    };
  }).actions(self => ({
    freezeHistory() {
      //self.annotation.history.freeze();
    },

    createDrawingRegion(areaValue, resultValue, control, dynamic) {
      const result = {
        from_name: control.name,
        to_name: self,
        type: control.resultType,
        value: resultValue,
      };

      const areaRaw = {
        id: guidGenerator(),
        object: self,
        ...areaValue,
        results: [result],
        dynamic,
      };

      self.drawingRegion = areaRaw;
      return self.drawingRegion;
    },

    deleteDrawingRegion() {
      const { drawingRegion } = self;

      self.drawingRegion = null;
      destroy(drawingRegion);
    },

    setSelectionStart(point) {
      self.selectionArea.setStart(point);
    },
    setSelectionEnd(point) {
      self.selectionArea.setEnd(point);
    },
    resetSelection() {
      self.selectionArea.setStart(null);
      self.selectionArea.setEnd(null);
    },

    updateBrushControl(arg) {
      self.brushControl = arg;
    },

    updateBrushStrokeWidth(arg) {
      self.brushStrokeWidth = arg;
    },

    /**
     * Update brightnessGrade of Image
     * @param {number} value
     */
    setBrightnessGrade(value) {
      self.brightnessGrade = value;
    },

    setContrastGrade(value) {
      self.contrastGrade = value;
    },

    setGridSize(value) {
      self.gridsize = String(value);
    },

    setCurrentImage(i) {
      self.currentImage = i;
    },

    /**
     * Set pointer of X and Y
     */
    setPointerPosition({ x, y }) {
      self.freezeHistory();
      self.cursorPositionX = x;
      self.cursorPositionY = y;
    },

    /**
     * Set zoom
     */
    setZoom(scale, x, y) {
      self.resize = scale;
      self.zoomScale = scale;
      self.zoomingPositionX = x;
      self.zoomingPositionY = y;
    },

    setZoomPosition(x, y) {
      self.zoomingPositionX = clamp(
        x,
        self.stageComponentSize.width - self.stageComponentSize.width * self.zoomScale,
        0,
      );
      self.zoomingPositionY = clamp(
        y,
        self.stageComponentSize.height - self.stageComponentSize.height * self.zoomScale,
        0,
      );
    },

    handleZoom(val, mouseRelativePos = { x: self.stageWidth / 2, y: self.stageHeight / 2 }) {
      if (val) {
        self.freezeHistory();
        let stageScale = self.stageScale;
        let zoomScale = self.zoomScale;

        const mouseAbsolutePos = {
          x: (mouseRelativePos.x - self.zoomingPositionX) / stageScale,
          y: (mouseRelativePos.y - self.zoomingPositionY) / stageScale,
        };

        stageScale = val > 0 ? stageScale * self.zoomBy : stageScale / self.zoomBy;
        zoomScale = val > 0 ? zoomScale * self.zoomBy : zoomScale / self.zoomBy;

        const zoomingPosition = {
          x: -(mouseAbsolutePos.x - mouseRelativePos.x / stageScale) * stageScale,
          y: -(mouseAbsolutePos.y - mouseRelativePos.y / stageScale) * stageScale,
        };

        if (self.negativezoom !== true && zoomScale <= 1) {
          self.setZoom(1, 0, 0);
          return;
        }
        if (zoomScale <= 1) {
          self.setZoom(zoomScale, 0, 0);
          return;
        }
        self.setZoom(zoomScale, zoomingPosition.x, zoomingPosition.y);
      }
    },

    /**
     * Set mode of Image (drawing and viewing)
     * @param {string} mode
     */
    setMode(mode) {
      self.mode = mode;
    },

    setImageRef(ref) {
      self.imageRef = ref;
    },

    setStageRef(ref) {
      self.stageRef = ref;

      const currentTool = self.getToolsManager().findSelectedTool();

      currentTool?.updateCursor?.();

      // Konva updates ref repeatedly and this breaks brush scaling
      if (self.initialWidth > 1) return;
      self.initialWidth = ref && ref.attrs && ref.attrs.width ? ref.attrs.width : 1;
      self.initialHeight = ref && ref.attrs && ref.attrs.height ? ref.attrs.height : 1;
    },

    // @todo remove
    setSelected() {
      // self.selectedShape = shape;
    },

    rotate(degree = -90) {
      self.rotation = (self.rotation + degree + 360) % 360;
      let ratioK = 1 / self.stageRatio;

      if ((self.rotation + 360) % 180 === 90) {
        self.stageRatio = self.initialWidth / self.initialHeight;
      } else {
        self.stageRatio = 1;
      }
      ratioK = ratioK * self.stageRatio;
      if (degree === -90) {
        this.setZoomPosition(
          self.zoomingPositionY * ratioK,
          self.stageComponentSize.height -
          self.zoomingPositionX * ratioK -
          self.stageComponentSize.height * self.zoomScale,
        );
      }
      if (degree === 90) {
        this.setZoomPosition(
          self.stageComponentSize.width -
          self.zoomingPositionY * ratioK -
          self.stageComponentSize.width * self.zoomScale,
          self.zoomingPositionX * ratioK,
        );
      }
    },

    _updateImageSize({ width, height, naturalWidth, naturalHeight, userResize }) {
      if (naturalWidth !== undefined) {
        self.naturalWidth = naturalWidth;
        self.naturalHeight = naturalHeight;
      }
      if ((self.rotation + 360) % 180 === 90) {
        self.stageWidth = width;
        self.stageHeight = Math.round((width / self.initialWidth) * self.initialHeight);
      } else {
        self.stageWidth = width;
        self.stageHeight = height;
      }

      self.sizeUpdated = true;
      self._updateRegionsSizes({
        width: self.stageWidth,
        height: self.stageHeight,
        naturalWidth,
        naturalHeight,
        userResize,
      });
    },

    _updateRegionsSizes({ width, height, naturalWidth, naturalHeight, userResize }) {
      self.regions.forEach(shape => {
        shape.updateImageSize(width / naturalWidth, height / naturalHeight, width, height, userResize);
      });
      self.regs.forEach(shape => {
        shape.updateImageSize(width / naturalWidth, height / naturalHeight, width, height, userResize);
      });
    },

    updateImageSize(ev) {
      const { width, height, naturalWidth, naturalHeight } = ev.target;

      self.initialWidth = width;
      self.initialHeight = height;
      self._updateImageSize({ width, height, naturalWidth, naturalHeight });
      // after regions' sizes adjustment we have to reset all saved history changes
      // mobx do some batch update here, so we have to reset it asynchronously
      // this happens only after initial load, so it's safe
      self.setReady(true);
      setTimeout(self.annotation.reinitHistory, 0);
    },

    checkLabels() {
      // there is should be at least one state selected for *labels object
      const labelStates = (self.states() || []).filter(s => s.type.includes("labels"));
      const selectedStates = self.getAvailableStates();

      return selectedStates.length !== 0 || labelStates.length === 0;
    },

    addShape(shape) {
      self.regions.push(shape);

      self.annotation.addRegion(shape);
      self.setSelected(shape.id);
      shape.selectRegion();
    },

    // convert screen coords to image coords considering zoom
    fixZoomedCoords([x, y]) {
      if (!self.stageRef) {
        return [x, y];
      }

      // good official way, but maybe a bit slower and with repeating cloning
      const p = self.stageRef.getAbsoluteTransform().copy().invert().point({ x, y });

      return [p.x, p.y];
    },

    // convert image coords to screen coords considering zoom
    zoomOriginalCoords([x, y]) {
      const p = self.stageRef.getAbsoluteTransform().point({ x, y });

      return [p.x, p.y];
    },

    /**
     * @typedef {number[]|{ x: number, y: number }} Point
     */

    /**
     * @callback PointFn
     * @param {Point} point
     * @returns Point
     */

    /**
     * Wrap point operations to convert zoomed coords from screen to image and back
     * Good for event handlers, receiving screen coords, but working with image coords
     * Accepts both [x, y] and {x, y} points; preserves this format
     * @param {PointFn} fn wrapped function do some math with image coords
     * @return {PointFn} outer function do some math with screen coords
     */
    fixForZoom(fn) {
      return p => this.fixForZoomWrapper(p, fn);
    },
    fixForZoomWrapper(p, fn) {
      const asArray = p.x === undefined;
      const [x, y] = self.fixZoomedCoords(asArray ? p : [p.x, p.y]);
      const modified = fn(asArray ? [x, y] : { x, y });
      const zoomed = self.zoomOriginalCoords(asArray ? modified : [modified.x, modified.y]);

      return asArray ? zoomed : { x: zoomed[0], y: zoomed[1] };
    },

    /**
     * Resize of image canvas
     * @param {*} width
     * @param {*} height
     */
    onResize(width, height, userResize) {
      self._updateImageSize({ width, height, userResize });
    },

    event(name, ev, ...coords) {
      self.getToolsManager().event(name, ev.evt || ev, ...self.fixZoomedCoords(coords));
    },

    /**
     * Transform JSON data (annotations and predictions) to format
     */
    fromStateJSON(obj, fromModel) {
      const tools = self.getToolsManager().allTools();

      // when there is only the image classification and nothing else, we need to handle it here
      if (tools.length === 0 && obj.value.choices) {
        self.annotation.names.get(obj.from_name).fromStateJSON(obj);

        return;
      }

      tools.forEach(t => t.fromStateJSON && t.fromStateJSON(obj, fromModel));
    },
  }));

const ImageModel = types.compose("ImageModel", TagAttrs, Model, ObjectBase, AnnotationMixin);

const HtxImage = inject("store")(ImageView);

Registry.addTag("image", ImageModel, HtxImage);
Registry.addObjectType(ImageModel);

export { ImageModel, HtxImage };
