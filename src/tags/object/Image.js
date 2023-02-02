import { inject } from 'mobx-react';
import { destroy, getParent, getRoot, getType, types } from 'mobx-state-tree';

import ImageView from '../../components/ImageView/ImageView';
import { customTypes } from '../../core/CustomTypes';
import Registry from '../../core/Registry';
import { AnnotationMixin } from '../../mixins/AnnotationMixin';
import { IsReadyWithDepsMixin } from '../../mixins/IsReadyMixin';
import { BrushRegionModel } from '../../regions/BrushRegion';
import { EllipseRegionModel } from '../../regions/EllipseRegion';
import { KeyPointRegionModel } from '../../regions/KeyPointRegion';
import { PolygonRegionModel } from '../../regions/PolygonRegion';
import { RectRegionModel } from '../../regions/RectRegion';
import * as Tools from '../../tools';
import ToolsManager from '../../tools/Manager';
import { parseValue } from '../../utils/data';
import { FF_DEV_3377, FF_DEV_3666, FF_LSDV_4583, isFF } from '../../utils/feature-flags';
import { guidGenerator } from '../../utils/unique';
import { clamp } from '../../utils/utilities';
import ObjectBase from './Base';

/**
 * The `Image` tag shows an image on the page. Use for all image annotation tasks to display an image on the labeling interface.
 *
 * Use with the following data types: images.
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
 * @param {boolean} [smoothing]               - Enable smoothing, by default it uses user settings
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
 * @param {boolean} [crosshair=false]         - Show crosshair cursor
 * @param {string} [horizontalAlignment="left"] - Where to align image horizontally. Can be one of "left", "center" or "right"
 * @param {string} [verticalAlignment="top"]    - Where to align image vertically. Can be one of "top", "center" or "bottom"
 * @param {string} [defaultZoom="fit"]          - Specify the initial zoom of the image within the viewport while preserving it’s ratio. Can be one of "auto", "original" or "fit"
 * @param {string[]} [valuelist]              - List of image urls
 */
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  valuelist: types.maybeNull(types.string),
  resize: types.maybeNull(types.number),
  width: types.optional(types.string, '100%'),
  height: types.maybeNull(types.string),
  maxwidth: types.optional(types.string, '100%'),
  maxheight: types.optional(types.string, 'calc(100vh - 194px)'),
  smoothing: types.maybeNull(types.boolean),

  // rulers: types.optional(types.boolean, true),
  grid: types.optional(types.boolean, false),
  gridsize: types.optional(types.string, '30'),
  gridcolor: types.optional(customTypes.color, '#EEEEF4'),

  zoom: types.optional(types.boolean, true),
  negativezoom: types.optional(types.boolean, false),
  zoomby: types.optional(types.string, '1.1'),

  showlabels: types.optional(types.boolean, false),

  zoomcontrol: types.optional(types.boolean, true),
  brightnesscontrol: types.optional(types.boolean, false),
  contrastcontrol: types.optional(types.boolean, false),
  rotatecontrol: types.optional(types.boolean, false),
  crosshair: types.optional(types.boolean, false),
  selectioncontrol: types.optional(types.boolean, true),

  // this property is just to turn lazyload off to e2e tests
  lazyoff: types.optional(types.boolean, false),

  horizontalalignment: types.optional(types.enumeration(['left', 'center', 'right']), 'left'),
  verticalalignment: types.optional(types.enumeration(['top', 'center', 'bottom']), 'top'),
  defaultzoom: types.optional(types.enumeration(['auto', 'original', 'fit']), 'fit'),
});

const IMAGE_CONSTANTS = {
  rectangleModel: 'RectangleModel',
  rectangleLabelsModel: 'RectangleLabelsModel',
  ellipseModel: 'EllipseModel',
  ellipseLabelsModel: 'EllipseLabelsModel',
  brushLabelsModel: 'BrushLabelsModel',
  rectanglelabels: 'rectanglelabels',
  keypointlabels: 'keypointlabels',
  polygonlabels: 'polygonlabels',
  brushlabels: 'brushlabels',
  brushModel: 'BrushModel',
  ellipselabels: 'ellipselabels',
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
}).views(self => {
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
      return self.isActive || !self.obj.selectedRegions.length ? null : self.obj.selectedRegions.reduce((borders, region) => {
        return region.bboxCoords ? {
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
  type: 'image',

  // tools: types.array(BaseTool),

  rotation: types.optional(types.number, 0),

  sizeUpdated: types.optional(types.boolean, false),

  /**
   * Natural sizes of Image
   * Constants
   */
  naturalWidth: types.optional(types.integer, 1),
  naturalHeight: types.optional(types.integer, 1),

  stageWidth: types.optional(types.number, 1),
  stageHeight: types.optional(types.number, 1),

  /**
   * Zoom Scale
   */
  zoomScale: types.optional(types.number, 1),

  /**
   * Coordinates of left top corner
   * Default: { x: 0, y: 0 }
   */
  zoomingPositionX: types.optional(types.number, 0),
  zoomingPositionY: types.optional(types.number, 0),

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

  brushControl: types.optional(types.string, 'brush'),

  brushStrokeWidth: types.optional(types.number, 15),

  /**
   * Mode
   * brush for Image Segmentation
   * eraser for Image Segmentation
   */
  mode: types.optional(types.enumeration(['drawing', 'viewing', 'brush', 'eraser']), 'viewing'),

  regions: types.array(
    types.union(BrushRegionModel, RectRegionModel, EllipseRegionModel, PolygonRegionModel, KeyPointRegionModel),
    [],
  ),

  drawingRegion: types.optional(DrawingRegion, null),
  selectionArea: types.optional(ImageSelection, { start: null, end: null }),
}).volatile(() => ({
  currentImage: 0,
  stageRatio: 1,
  // Container's sizes causing limits to calculate a scale factor
  containerWidth: 1,
  containerHeight: 1,

  stageZoom: 1,
  stageZoomX: 1,
  stageZoomY: 1,
  currentZoom: 1,
})).views(self => ({
  get store() {
    return getRoot(self);
  },

  get parsedValue() {
    return self._parsedValue = self._parsedValue ?? parseValue(self.value, self.store.task.dataObj);
  },

  get parsedValueList() {
    return self._parsedValueList = self.valuelist
      ? self._parsedValueList ?? parseValue(self.valuelist, self.store.task.dataObj)
      : [];
  },

  get currentSrc() {
    if (isFF(FF_LSDV_4583) && self.valuelist) {
      return self.parsedValueList[self.currentImage];
    }

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
    const regions = self.annotation?.regionStore.regions.filter(r => r.object === self) || [];

    if (isFF(FF_LSDV_4583) && self.valuelist) {
      return regions.filter(r => r.item_index === self.currentImage);
    }

    return regions;
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
    return self.zoomScale;
  },

  get hasTools() {
    return !!self.getToolsManager().allTools()?.length;
  },

  get fillerHeight() {
    if (self.isSideways) {
      return `${self.naturalWidth / self.naturalHeight * 100}%`;
    } else {
      return `${self.naturalHeight / self.naturalWidth * 100}%`;
    }
  },

  /**
   * @return {object}
   */
  states() {
    return self.annotation.toNames.get(self.name);
  },

  activeStates() {
    const states = self.states();

    return states && states.filter(s => s.isSelected && s.type.includes('labels'));
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

  get isSideways() {
    return (self.rotation + 360) % 180 === 90;
  },

  get stageComponentSize() {
    if (self.isSideways) {
      return {
        width: self.stageHeight,
        height: self.stageWidth,
      };
    }
    return {
      width: self.stageWidth,
      height: self.stageHeight,
    };
  },

  get canvasSize() {
    if (self.isSideways) {
      return {
        width: isFF(FF_DEV_3377) ? self.naturalHeight * self.stageZoomX : Math.round(self.naturalHeight * self.stageZoomX),
        height: isFF(FF_DEV_3377) ? self.naturalWidth * self.stageZoomY : Math.round(self.naturalWidth * self.stageZoomY),
      };
    }

    return {
      width: isFF(FF_DEV_3377) ? self.naturalWidth * self.stageZoomX : Math.round(self.naturalWidth * self.stageZoomX),
      height: isFF(FF_DEV_3377) ? self.naturalHeight * self.stageZoomY : Math.round(self.naturalHeight * self.stageZoomY),
    };
  },

  get zoomBy() {
    return parseFloat(self.zoomby);
  },
  get isDrawing() {
    return !!self.drawingRegion;
  },

  get imageTransform() {
    const imgStyle = {
      // scale transform leaves gaps on image border, so much better to change image sizes
      width: `${self.stageWidth * self.zoomScale}px`,
      height: `${self.stageHeight * self.zoomScale}px`,
      transformOrigin: 'left top',
      // We should always set some transform to make the image rendering in the same way all the time
      transform: 'translate3d(0,0,0)',
      filter: `brightness(${self.brightnessGrade}%) contrast(${self.contrastGrade}%)`,
    };
    const imgTransform = [];

    if (self.zoomScale !== 1) {
      const { zoomingPositionX = 0, zoomingPositionY = 0 } = self;

      imgTransform.push('translate3d(' + zoomingPositionX + 'px,' + zoomingPositionY + 'px, 0)');
    }

    if (self.rotation) {
      const translate = {
        90: '0, -100%',
        180: '-100%, -100%',
        270: '-100%, 0',
      };

      // there is a top left origin already set for zoom; so translate+rotate
      imgTransform.push(`rotate(${self.rotation}deg)`);
      imgTransform.push(`translate(${translate[self.rotation] || '0, 0'})`);

    }

    if (imgTransform?.length > 0) {
      imgStyle.transform = imgTransform.join(' ');
    }
    return imgStyle;
  },

  get maxScale() {
    return self.isSideways
      ? Math.min(self.containerWidth / self.naturalHeight, self.containerHeight / self.naturalWidth)
      : Math.min(self.containerWidth / self.naturalWidth, self.containerHeight / self.naturalHeight);
  },

  get coverScale() {
    return self.isSideways
      ? Math.max(self.containerWidth / self.naturalHeight, self.containerHeight / self.naturalWidth)
      : Math.max(self.containerWidth / self.naturalWidth, self.containerHeight / self.naturalHeight);
  },
}))

  // actions for the tools
  .actions(self => {
    const manager = ToolsManager.getInstance({ name: self.name });
    const env = { manager, control: self, object: self };

    function afterAttach() {
      if (self.selectioncontrol)
        manager.addTool('MoveTool', Tools.Selection.create({}, env));

      if (self.zoomcontrol)
        manager.addTool('ZoomPanTool', Tools.Zoom.create({}, env));

      if (self.brightnesscontrol)
        manager.addTool('BrightnessTool', Tools.Brightness.create({}, env));

      if (self.contrastcontrol)
        manager.addTool('ContrastTool', Tools.Contrast.create({}, env));

      if (self.rotatecontrol)
        manager.addTool('RotateTool', Tools.Rotate.create({}, env));
    }

    function getToolsManager() {
      return manager;
    }

    return { afterAttach, getToolsManager };
  }).extend((self) => {
    let skipInteractions = false;

    return {
      views: {
        getSkipInteractions() {
          const manager = self.getToolsManager();

          const isPanning = manager.findSelectedTool()?.toolName === 'ZoomPanTool';

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
      const controlTag = self.annotation.names.get(control.name);

      const result = {
        from_name: controlTag,
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

      if (!drawingRegion) return;
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
    setZoom(scale) {
      self.currentZoom = clamp(scale, 1, Infinity);

      // cool comment about all this stuff
      const maxScale = self.maxScale;
      const coverScale = self.coverScale;

      if (maxScale > 1) { // image < container
        if (scale < maxScale) { // scale = 1 or before stage size is max
          self.stageZoom = scale; // scale stage
          self.zoomScale = 1; // don't scale image
        } else {
          self.stageZoom = maxScale; // scale stage to max
          self.zoomScale = scale / maxScale; // scale image for the rest scale
        }
      } else { // image > container
        if (scale > maxScale) { // scale = 1 or any other zoom bigger then viewport
          self.stageZoom = maxScale; // stage squizzed
          self.zoomScale = scale; // scale image for the rest scale : scale image usually
        } else { // negative zoom bigger than image negative scale
          self.stageZoom = scale; // squize stage more
          self.zoomScale = 1; // don't scale image
        }
      }

      if (self.zoomScale > 1) {
        // zoomScale scales image above maxScale, so scale the rest of stage the same way
        const z = Math.min(maxScale * self.zoomScale, coverScale);

        if (self.containerWidth / self.naturalWidth > self.containerHeight / self.naturalHeight) {
          self.stageZoomX = z;
          self.stageZoomY = self.stageZoom;
        } else {
          self.stageZoomX = self.stageZoom;
          self.stageZoomY = z;
        }
      } else {
        self.stageZoomX = self.stageZoom;
        self.stageZoomY = self.stageZoom;
      }
    },

    updateImageAfterZoom() {
      const { stageWidth, stageHeight } = self;

      self._recalculateImageParams();

      if (stageWidth !== self.stageWidth || stageHeight !== self.stageHeight) {
        self._updateRegionsSizes({
          width: self.stageWidth,
          height: self.stageHeight,
          naturalWidth: self.naturalWidth,
          naturalHeight: self.naturalHeight,
        });
      }
    },

    setZoomPosition(x, y) {
      const min = {
        x: (isFF(FF_DEV_3377) ? self.canvasSize.width : self.containerWidth) - self.stageComponentSize.width * self.zoomScale,
        y: (isFF(FF_DEV_3377) ? self.canvasSize.height : self.containerHeight) - self.stageComponentSize.height * self.zoomScale,
      };

      self.zoomingPositionX = clamp(x, min.x, 0);
      self.zoomingPositionY = clamp(y, min.y, 0);
    },

    resetZoomPositionToCenter() {
      const { containerWidth, containerHeight, stageComponentSize, zoomScale } = self;
      const { width, height } = stageComponentSize;

      self.setZoomPosition((containerWidth - width * zoomScale) / 2, (containerHeight - height * zoomScale) / 2);
    },

    sizeToFit() {
      const { maxScale } = self;

      self.defaultzoom = 'fit';
      self.setZoom(maxScale);
      self.updateImageAfterZoom();
      self.resetZoomPositionToCenter();
    },

    sizeToOriginal() {
      const { maxScale } = self;

      self.defaultzoom = 'original';
      self.setZoom(maxScale > 1 ? 1 : 1 / maxScale);
      self.updateImageAfterZoom();
      self.resetZoomPositionToCenter();
    },

    sizeToAuto() {
      self.defaultzoom = 'auto';
      self.setZoom(1);
      self.updateImageAfterZoom();
      self.resetZoomPositionToCenter();
    },

    handleZoom(val, mouseRelativePos = { x: self.canvasSize.width / 2, y: self.canvasSize.height / 2 }) {
      if (val) {
        let zoomScale = self.currentZoom;

        zoomScale = val > 0 ? zoomScale * self.zoomBy : zoomScale / self.zoomBy;
        if (self.negativezoom !== true && zoomScale <= 1) {
          self.setZoom(1);
          self.setZoomPosition(0, 0);
          self.updateImageAfterZoom();
          return;
        }
        if (zoomScale <= 1) {
          self.setZoom(zoomScale);
          self.setZoomPosition(0, 0);
          self.updateImageAfterZoom();
          return;
        }

        // DON'T TOUCH THIS
        let stageScale = self.zoomScale;

        const mouseAbsolutePos = {
          x: (mouseRelativePos.x - self.zoomingPositionX) / stageScale,
          y: (mouseRelativePos.y - self.zoomingPositionY) / stageScale,
        };

        self.setZoom(zoomScale);

        stageScale = self.zoomScale;

        const zoomingPosition = {
          x: -(mouseAbsolutePos.x - mouseRelativePos.x / stageScale) * stageScale,
          y: -(mouseAbsolutePos.y - mouseRelativePos.y / stageScale) * stageScale,
        };

        self.setZoomPosition(zoomingPosition.x, zoomingPosition.y);
        self.updateImageAfterZoom();
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

    setContainerRef(ref) {
      self.containerRef = ref;
    },

    setStageRef(ref) {
      self.stageRef = ref;

      const currentTool = self.getToolsManager().findSelectedTool();

      currentTool?.updateCursor?.();
    },

    // @todo remove
    setSelected() {
      // self.selectedShape = shape;
    },

    rotate(degree = -90) {
      self.rotation = (self.rotation + degree + 360) % 360;
      let ratioK = 1 / self.stageRatio;

      if (self.isSideways) {
        self.stageRatio = self.naturalWidth / self.naturalHeight;
      } else {
        self.stageRatio = 1;
      }
      ratioK = ratioK * self.stageRatio;

      self.setZoom(self.currentZoom);

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

      self.updateImageAfterZoom();
    },

    _recalculateImageParams() {
      self.stageWidth = isFF(FF_DEV_3377) ? self.naturalWidth * self.stageZoom : Math.round(self.naturalWidth * self.stageZoom);
      self.stageHeight = isFF(FF_DEV_3377) ? self.naturalHeight * self.stageZoom : Math.round(self.naturalHeight * self.stageZoom);
    },

    _updateImageSize({ width, height, userResize }) {
      if (self.naturalWidth === undefined) {
        return;
      }
      if (width > 1 && height > 1) {
        self.containerWidth = width;
        self.containerHeight = height;

        // reinit zoom to calc stageW/H
        self.setZoom(self.currentZoom);

        self.setZoomPosition(self.zoomingPositionX, self.zoomingPositionY);

        self._recalculateImageParams();
      }

      self.sizeUpdated = true;
      self._updateRegionsSizes({
        width: self.stageWidth,
        height: self.stageHeight,
        naturalWidth: self.naturalWidth,
        naturalHeight: self.naturalHeight,
        userResize,
      });
    },

    _updateRegionsSizes({ width, height, naturalWidth, naturalHeight, userResize }) {
      const _historyLength = self.annotation?.history?.history?.length;

      self.annotation.history.freeze();

      self.regions.forEach(shape => {
        shape.updateImageSize(width / naturalWidth, height / naturalHeight, width, height, userResize);
      });
      self.regs.forEach(shape => {
        shape.updateImageSize(width / naturalWidth, height / naturalHeight, width, height, userResize);
      });
      self.drawingRegion?.updateImageSize(width / naturalWidth, height / naturalHeight, width, height, userResize);

      setTimeout(self.annotation.history.unfreeze, 0);

      //sometimes when user zoomed in, annotation was creating a new history. This fix that in case the user has nothing in the history yet
      if (_historyLength <= 1) {
        // Don't force unselection of regions during the updateObjects callback from history reinit
        setTimeout(() => self.annotation.reinitHistory(false), 0);
      }
    },

    updateImageSize(ev) {
      const { naturalWidth, naturalHeight } = ev.target;
      const { offsetWidth, offsetHeight } = self.containerRef;

      self.naturalWidth = naturalWidth;
      self.naturalHeight = naturalHeight;
      self._updateImageSize({ width: offsetWidth, height: offsetHeight });
      // after regions' sizes adjustment we have to reset all saved history changes
      // mobx do some batch update here, so we have to reset it asynchronously
      // this happens only after initial load, so it's safe
      self.setReady(true);

      if (self.defaultzoom === 'fit') {
        self.sizeToFit();
      } else {
        self.sizeToAuto();
      }
      // Don't force unselection of regions during the updateObjects callback from history reinit
      setTimeout(() => self.annotation.reinitHistory(false), 0);
    },

    checkLabels() {
      let labelStates;

      if (isFF(FF_DEV_3666)) {
        // there should be at least one available label or none of them should be selected
        labelStates = self.activeStates() || [];
      } else {
        // there is should be at least one state selected for *labels object
        labelStates = (self.states() || []).filter(s => s.type.includes('labels'));
      }
      const selectedStates = self.getAvailableStates();

      return selectedStates.length !== 0 || labelStates.length === 0;
    },

    addShape(shape) {
      console.log('addShape', shape);
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

const ImageModel = types.compose('ImageModel', TagAttrs, ObjectBase, AnnotationMixin, IsReadyWithDepsMixin, Model);

const HtxImage = inject('store')(ImageView);

Registry.addTag('image', ImageModel, HtxImage);
Registry.addObjectType(ImageModel);

export { ImageModel, HtxImage };
