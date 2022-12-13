import React from 'react';
import chroma from 'chroma-js';
import { observer } from 'mobx-react';
import { flow, types } from 'mobx-state-tree';

import BaseTool from './Base';
import Canvas from '../utils/canvas';
import { defaultStyle } from '../core/Constants';
import ToolMixin from '../mixins/Tool';
import { DrawingTool } from '../mixins/DrawingTool';
import { getActualZoomingPosition, getTransformedImageData } from '../utils/image';
import { drawMask } from '../utils/magic-wand';
import { guidGenerator } from '../core/Helpers';
import { IconMagicWandTool } from '../assets/icons';
import { Tool } from '../components/Toolbar/Tool';

// TODO!!! Adding a bunch of Magic Wand annotations then updating is slow when saving. Investigate.
// TODO!!! Once a magic wand selection has been made, save the scene and make sure its task
// annotations are correct, then also export final results and ensure they are legible.
// TODO!!! Write tests


/**
 * This file implements a Magic Wand, making it possible to click in a region of an image a user is doing
 * segmentation labeling on, drag the mouse to dynamically change flood filling tolerance, then release
 * the mouse button to get a new labeled area. It is particularly effective at labeling broad, diffuse,
 * complex edged objects, such as clouds, cloud shadows, snow, etc. in earth observation applications or
 * organic shapes in biomedical applications.
 *
 *
 * Technical Overview:
 *
 * First, the image we want to do the Magic Wand on can actually be displayed larger or smaller than
 * the actual size of the image, whether due to the user zooming, panning, or the image being shrunken
 * down to fit within the available screen real estate, so we will need to be aware of this
 * discrepancy in terms of our coordinates and image data.
 *
 * Some terms you might see in the code:
 * - `naturalWidth`/`naturalHeight`: The actual, intrinsic size of the image, if loaded into an image
 *  viewer.
 * - `imageDisplayedInBrowserWidth`/`imageDisplayedInBrowserHeight`: The size of the image shown in
 *  the browser.
 * - `viewportWidth`/`viewportHeight`: Even if the image is `imageDisplayedInBrowser`` size, parts of
 *  it might be clipped and overflow hidden by a viewport lying over it and constraining it.
 *  `viewportWidth`/`viewportHeight` relates the size of the viewport.
 *
 * Users might be working with very large images, and if we are not careful the Magic Wand thresholding
 * operation done while the user is dragging the mouse can get very slow. In addition, when the user
 * releases the mouse to apply a final mask, if we are not careful the final masking operation can be
 * very slow. We are therefore quite conscious about performance in the Magic Wand implementation.
 *
 * When the user first presses down on the mouse button (`mousedownEv`), we first have to re-apply
 * any CSS transforms the image might be under (zooming, panning, etc.) in `initCanvas`. There is no way
 * to get pixel-level image data that has CSS transforms applied to it, so we recreate these transforms
 * on top of an offscreen canvas (`getTransformedImageData`), efficiently blitting just the area in the
 * viewport to the offscreen buffer.
 *
 * During mouse movement (`mousemoveEv`), we `threshold()` based on how far the mouse is from the
 * initial `anchorX`/`anchorY` seeds, updating the mask with `drawMask`.
 * 
 * When the user is finished with the dynamic thresholding and releases the mouse button (`mouseupEv`),
 * we setup the final mask (`setupFinalMask`) by taking the existing Magic Wanded result, which might
 * be zoomed, panned, or scaled down, and correctly upscale or downscale the mask into the full natural
 * sized image wherever it would actually be (`copyTransformedMaskToNaturalSize`). This has the benefit of
 * being very fast vs. attempting to do Magic Wand thresholding against the entire, naturally sized
 * image, which could be very large.
 *
 * Experiments also showed that thresholding can be very different if the image is scaled larger or smaller
 * for final results, which can be confusing for the user if when they release the mouse button if what
 * they see is very different then what was shown during dynamic thresholding. If we are zoomed in, the final
 * mask will end at the edges of the current zoom level, which can also help to reduce surprise at the final
 * results.
 * 
 * Once we have the final mask, we need to turn it into a final BrushRegion with results (`finalMaskToRegion`).
 * This is a performance bottleneck, so we directly turn it into an image URL that can be passed into the
 * BrushRegion. The BrushRegion can then apply the correct class color to the image URL results to draw
 * onto it's canvas quickly, which also makes it possible for the user to dynamically
 * change the class color later on. We keep a cachedNaturalCanvas around from previous masking sessions on
 * the same class in order to collapse multiple Magic Wand additions into the same class.
 */

const ToolView = observer(({ item }) => {
  return (
    <Tool
      label="Magic Wand"
      ariaLabel="magicwand"
      shortcut="W"
      active={item.selected}
      icon={item.iconClass}
      tool={item}
      onClick={() => {
        if (item.selected) return;

        item.manager.selectTool(item, true);
      }}
    />
  );
});

const _Tool = types
  .model('MagicWandTool', {
    group: 'segmentation',
    shortcut: 'W',
    smart: true,
    isDrawingTool: true,
  })
  .volatile(() => ({
    currentThreshold: null,
    mask: null,

    anchorX: null,
    anchorY: null,

    overlay: null,
    overlayCtx: null,
    overlayOrigStyle: null,

    transformedData: null,
    transformedCanvas: null,

    currentRegion: null,

    isFirstWand: true,
    cachedRegionId: null,
    cachedLabel: null,
    cachedNaturalCanvas: null,

    naturalWidth: null,
    naturalHeight: null,
    imageDisplayedInBrowserWidth: null,
    imageDisplayedInBrowserHeight: null,
    viewportWidth: null,
    viewportHeight: null,
    zoomScale: null,
    zoomingPositionX: null,
    zoomingPositionY: null,
    negativezoom: null,
    rotation: null,
  }))
  .views(self => ({
    get viewClass() {
      return () => <ToolView item={self} />;
    },

    get tagTypes() {
      return {
        stateTypes: 'brushlabels',
        controlTagTypes: ['brushlabels', 'magicwand'],
      };
    },

    get iconComponent() {
      return IconMagicWandTool;
    },

    get defaultthreshold() {
      return parseInt(self.control.defaultthreshold, 10);
    },

    get opacity() {
      return parseFloat(self.control.opacity);
    },

    get fillcolor() {
      const defaultColor = chroma(defaultStyle.fillcolor).hex();
      let color = defaultColor;
      const states = self.obj.states();

      if (!states.length) return color;

      const selectedEntry = states.find(entry => typeof entry.selectedColor !== 'undefined');

      color = selectedEntry ? selectedEntry.selectedColor : defaultColor;
      return chroma(color).hex();
    },

    get selectedLabel() {
      const states = self.obj.states();

      if (!states.length) return null;

      const selectedEntry = states.find(entry => typeof entry.isSelected);
      const label = selectedEntry.selectedValues()[0];

      return label;
    },

    get blurradius() {
      return parseInt(self.control.blurradius, 10);
    },

    /**
     * The user might have an existing mask selected that we need to combine new Magic Wand results
     * with.
     *
     * @returns {BrushRegion} Returns an existing brush region if one is present containing an old
     *  mask, or null otherwise.
     */
    get existingRegion() {
      if (self.getSelectedShape && self.getSelectedShape.type && self.getSelectedShape.maskDataURL) {
        return self.getSelectedShape;
      } else {
        return null;
      }
    },

    /**
     * We maintain an offscreen cache of the natural canvas containing previous Magic Wand sessions
     * with the current region being selected. If the user selects a different region we must invalidate
     * this cache.
     */
    shouldInvalidateCache() {
      return self.existingRegion && self.existingRegion.id !== self.cachedRegionId;
    },

    /**
     * Helps with handling an edge case related to panning that results in a better user experience when
     * dealing with our cached natural canvas: If the user has a region selected, then zooms and pans,
     * Label Studio loses the current selection. If the user then wants to continue Magic Wanding with
     * the same label & region, self.getSelectedShape will return null. This method helps detect this
     * situation, and if it applies find the cached region and continue from there.
     */
    detectPanningLostSelection() {
      return self.cachedRegionId && self.getSelectedShape === null && self.cachedLabel === self.selectedLabel;
    },

  }))
  .actions(self => ({

    mousedownEv(ev) {
      // Start magic wand thresholding.
      self.annotation.history.freeze();
      self.mode = 'drawing';
      self.currentThreshold = self.defaultthreshold;
      self.currentRegion = null;

      const image = self.obj;
      const imageRef = image.imageRef;

      self.naturalWidth = imageRef.naturalWidth;
      self.naturalHeight = imageRef.naturalHeight;
      self.imageDisplayedInBrowserWidth = imageRef.width;
      self.imageDisplayedInBrowserHeight = imageRef.height;
      self.viewportWidth = Math.round(image.canvasSize.width);
      self.viewportHeight = Math.round(image.canvasSize.height);
      self.zoomScale = image.zoomScale;
      self.zoomingPositionX = image.zoomingPositionX;
      self.zoomingPositionY = image.zoomingPositionY;
      self.negativezoom = self.zoomScale < 1;
      self.rotation = image.rotation;

      if (self.rotation || image.crosshair) {
        self.mode = 'viewing';
        self.annotation.history.unfreeze();

        let msg;

        if (self.rotation) {
          msg = 'The Magic Wand is not supported on rotated images';
        } else {
          msg = 'The Magic Wand is not supported if the crosshair is turned on';
        } 

        alert(msg);
        throw msg;
      }

      // Listen for the escape key to quit the Magic Wand; get the event
      // before others, allowing it to bubble upwards (useCapture: true),
      // as otherwise the escape key gets eaten by other keyboard listeners.
      window.addEventListener('keydown', self.keydownEv, true /* useCapture */);

      [self.anchorX, self.anchorY] = self.getEventCoords(ev);
      self.initCache();
      self.initCanvas();
      self.initCurrentRegion();
    },

    mousemoveEv(ev) {
      // If we are in magic wand mode, change the threshold based on the mouse movement.
      if (self.mode !== 'drawing') return;

      const [newX, newY] = self.getEventCoords(ev);

      self.threshold(newX, newY, self.fillcolor, self.opacity);
    },

    mouseupEv: flow(function* mouseupEv() {
      // Note: If the mouse button is released outside of the stage area, mouseupEv is called
      // but not clickEv. For this reason do final work in mouseUp to handle this edge
      // condition instead of using clickEv.

      // Were we cancelled mid-way while using the Magic Wand?
      if (self.mode === 'viewing') return;

      // Finish magic wand thresholding.
      self.mode = 'viewing';
      window.removeEventListener('keydown', self.keydownEv, true /* useCapture */);

      yield self.setupFinalMask();
    }),

    keydownEv(e) {
      const { key } = e;

      if (key === 'Escape') {
        // Eat the escape key event.
        e.preventDefault();
        e.stopPropagation();

        self.mode = 'viewing';
        window.removeEventListener('keydown', self.keydownEv, true /* useCapture */);
        self.overlayCtx.clearRect(0, 0, self.overlay.width, self.overlay.height);
      }
    },

    getEventCoords(ev) {
      // Mouse click x, y coordinates should be relative to the offsetX/offsetY of the actual
      // fragment of image being displayed in the viewport. If the image is zoomed and
      // panned, offsetX/offsetY will still stay relative to what is actually being
      // displayed (i.e. it will change if we pan around).

      const x = ev.offsetX,
        y = ev.offsetY;

      return [x, y];
    },

    /**
     * We maintain an offscreen natural sized canvas to efficiently keep adding masks onto
     * as a user continues to Magic Wand with the same, currently selected region.
     */
    initCache() {
      // Has the user previously used the Magic Wand for the current class setting? 
      self.isFirstWand = (self.existingRegion === null) || (self.existingRegion.id !== self.cachedRegionId);

      // Did panning break the current selection? If so, get the correct region to continue working
      // from.
      if (self.detectPanningLostSelection()) {
        const regionStore =
          self.annotationStore.annotations.length ? self.annotationStore.annotations[0].regionStore : null;

        if (regionStore) {
          const region = regionStore.findRegionID(self.cachedRegionId);

          if (region) {
            self.obj.annotation.selectArea(region);
            self.isFirstWand = false;

            // Initialize our work moving forward to use the correct region.
            self.currentRegion = region;
          }
        }
      }

      if (self.isFirstWand) {
        self.cachedNaturalCanvas = document.createElement('canvas');
        self.cachedNaturalCanvas.width = self.naturalWidth;
        self.cachedNaturalCanvas.height = self.naturalHeight;
        self.cachedLabel = self.selectedLabel;
      } else if (self.shouldInvalidateCache()) {
        // Note: in an ideal world we would access self.existingRegion.maskDataURL to blit the existing
        // older mask onto the offscreen natural canvas. However, as soon as we do this, we enter into
        // some of the black magic mobx-state-tree uses to version data and things get very slow as
        // alot of state is captured. Instead, just invalidate the cache, which will cause a new region
        // to be created rather than stacking with the earlier, older region.
        self.cachedNaturalCanvas = document.createElement('canvas');
        self.cachedNaturalCanvas.width = self.naturalWidth;
        self.cachedNaturalCanvas.height = self.naturalHeight;
        self.isFirstWand = true;
        self.cachedRegionId = null;
        self.cachedLabel = self.selectedLabel;
      }
    },

    /**
     * Setup an initial canvas overlay and an initial transformed mask to match where the
     * user first clicked as a threshold anchor point, with a default threshold value.
     */
    initCanvas() {
      const image = self.obj;
      const imageRef = image.imageRef;

      // Make sure to apply any CSS transforms that might be showing (zooms, pans, etc.)
      // but in a way that allows us to access the pixel-level data under those transforms.
      [self.transformedData, self.transformedCanvas] = getTransformedImageData(imageRef,
        self.naturalWidth, self.naturalHeight,
        self.imageDisplayedInBrowserWidth, self.imageDisplayedInBrowserHeight,
        self.viewportWidth, self.viewportHeight,
        self.zoomScale,
        self.zoomingPositionX,
        self.zoomingPositionY,
        self.negativezoom,
        self.rotation);

      // Clear out any transformations on the overlay, other than a basic width and height,
      // as the segment we will show will already be transformed and it's mask directly
      // blitted to the overlay without further transforms needed.
      self.overlay = image.overlayRef;
      self.overlayOrigStyle = self.overlay.style;

      self.overlay.style = "";
      self.overlay.width = self.transformedCanvas.width;
      self.overlay.height = self.transformedCanvas.height;
      self.overlayCtx = self.overlay.getContext('2d');

      // Now draw an initial Magic Wand with default threshold and anchored at the
      // location given.
      self.mask = drawMask(self.transformedData, self.overlayCtx,
        self.transformedCanvas.width, self.transformedCanvas.height,
        self.anchorX, self.anchorY,
        self.currentThreshold, self.fillcolor, self.opacity, self.blurradius,
        true /* doPaint */);
    },

    /**
     * Creates an empty BrushRegion drawing area that we will plug our final mask into
     * once the user is done with the Magic Wand by releasing the mouse button.
     */
    initCurrentRegion() {
      if (self.isFirstWand){
        const regionOpts = {
          id: guidGenerator(),
          strokewidth: 1,
          object: self.obj,
          points: [],
          fillcolor: self.fillcolor,
          strokecolor: self.fillcolor,
          opacity: self.opacity,
        };

        self.currentRegion = self.createDrawingRegion(regionOpts);
      } else if (!self.detectPanningLostSelection()) {
        self.currentRegion = self.existingRegion;
      }
    },

    /**
     * As the user drags their mouse, we should calculate a new threshold value
     * by using the displacement of the mouse from the anchor point.
     * @param {int} newX New position of the mouse.
     * @param {int} newY Same, but for Y direction.
     */
    threshold(newX, newY) {
      if (newX !== self.anchorX || newY !== self.anchorY) {
        // Get the offset of where we've dragged the mouse to update the threshold.
        const dx = newX - self.anchorX,
          dy = newY - self.anchorY,
          len = Math.sqrt(dx * dx + dy * dy),
          adx = Math.abs(dx),
          ady = Math.abs(dy);
        let sign = adx > ady ? dx / adx : dy / ady;

        sign = sign < 0 ? sign / 5 : sign / 3;

        const newThreshold = Math.min(Math.max(self.defaultthreshold + Math.floor(sign * len), 1), 255);

        if (newThreshold !== self.currentThreshold) {
          self.currentThreshold = newThreshold;
          self.mask = drawMask(self.transformedData, self.overlayCtx,
            self.transformedCanvas.width, self.transformedCanvas.height,
            self.anchorX, self.anchorY, self.currentThreshold, self.fillcolor,
            self.opacity, self.blurradius, true /* doPaint */);
        }
      }
    },

    /**
     * Take the final results from the user and create a final mask we can work with,
     * ultimately producing a BrushRegion with the Magic Wand results.
     */
    setupFinalMask: flow(function* setupFinalMask() {
      // The mask is a single channel; convert it to be RGBA multi-channel data as a data URL.
      const singleChannelMask = self.mask;
      let canvasWidth, canvasHeight;

      if (self.negativezoom) {
        canvasWidth = Math.min(self.viewportWidth, self.imageDisplayedInBrowserWidth);
        canvasHeight = Math.min(self.viewportHeight, self.imageDisplayedInBrowserHeight);
      } else {
        canvasWidth = self.viewportWidth;
        canvasHeight = self.viewportHeight;
      }

      const scaledDataURL = Canvas.mask2DataURL(singleChannelMask.data,
        canvasWidth, canvasHeight, '#FFFFFF');

      // Get the mask onto a canvas surface we can work with, to blit and upscale/downscale
      // the final results.
      const blitImg = document.createElement('img');

      blitImg.src = scaledDataURL;
      yield blitImg.decode();

      // Efficiently copy our transformed mask onto our offscreen, naturally sized canvas.
      const maskDataURL = self.copyTransformedMaskToNaturalSize(blitImg);

      // Now create a final region to work with, or update an existing one.
      self.finalMaskToRegion(maskDataURL);
    }),

    /**
     * Given some mask that was drawn on an area that might be zoomed, panned,
     * or scaled, copy it over to a full, naturally sized image in order to get
     * our final mask.
     *
     * @param blitImg {Image} DOM image object that has been loaded with the scaled mask,
     *  ready for us to get pixels from.
     */
    copyTransformedMaskToNaturalSize(blitImg) {
      const naturalCtx = self.cachedNaturalCanvas.getContext('2d');

      // Get the dimensions of what we are showing in the browser, but transform them into coordinates
      // relative to the full, natural size of the image. Useful so that we can ultimately transform
      // our mask that was drawn in zoomed, panned, or shrunken coordinates over to the actual, natively
      // sized image.
      const [viewportNaturalX, viewportNaturalY] = getActualZoomingPosition(
        self.naturalWidth, self.naturalHeight,
        self.imageDisplayedInBrowserWidth, self.imageDisplayedInBrowserHeight,
        self.zoomingPositionX,
        self.zoomingPositionY);
      const viewportNaturalWidth =
        Math.ceil((self.transformedCanvas.width / self.imageDisplayedInBrowserWidth) * self.naturalWidth);
      const viewportNaturalHeight =
        Math.ceil((self.transformedCanvas.height / self.imageDisplayedInBrowserHeight) * self.naturalHeight);

      // Now efficiently draw this mask over onto the full, naturally sized image.    
      // Source dimensions.
      const sx = 0,
        sy = 0,
        sWidth = self.transformedCanvas.width,
        sHeight = self.transformedCanvas.height;
      // Destination dimensions.
      const dx = viewportNaturalX,
        dy = viewportNaturalY,
        dWidth = viewportNaturalWidth,
        dHeight = viewportNaturalHeight;

      naturalCtx.drawImage(blitImg, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      // Turn this into a data URL that we can use to initialize a real brush region, as well
      // as the bounding coordinates of the mask in natural coordinate space.
      const maskDataURL = self.cachedNaturalCanvas.toDataURL();

      return maskDataURL;
    },

    /**
     * Given final Magic Wand results as a data URL, turn them into a BrushRegion to hold
     * the results.
     * @param {string} maskDataURL Full, natural sized mask setup with the appropriate class
     *  color, turned into an image data URL.
     */
    finalMaskToRegion(maskDataURL) {
      if (self.isFirstWand) {
        const newRegion = self.commitDrawingRegion(maskDataURL);

        self.cachedRegionId = newRegion.id;
        self.obj.annotation.selectArea(newRegion);
      } else {
        self.currentRegion.endUpdatedMaskDataURL(maskDataURL);
      }

      self.annotation.history.unfreeze();
      self.annotation.setIsDrawing(false);

      // Clean up side effects.
      self.overlay.style = self.origStyle;

      setTimeout(() => {
        // Clear our overlay to reset state _after_ we've drawn the actual region,
        // to prevent a clear 'flash' and to increase apparent performance.
        self.overlayCtx.clearRect(0, 0, self.overlay.width, self.overlay.height);
      });
    },

    commitDrawingRegion(maskDataURL) {
      const value = {
        maskDataURL,
        coordstype: "px",
        dynamic: false,
      };
      const newRegion = self.annotation.createResult(value,
        self.currentRegion.results[0].value.toJSON(), self.control, self.obj);

      self.applyActiveStates(newRegion);
      self.deleteRegion();
      newRegion.notifyDrawingFinished();

      return newRegion;
    },

  }));

const MagicWand = types.compose(_Tool.name, ToolMixin, BaseTool, DrawingTool, _Tool);

export { MagicWand };
