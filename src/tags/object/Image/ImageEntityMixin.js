import { types } from 'mobx-state-tree';
import { ImageEntity } from './ImageEntity';

export const ImageEntityMixin = types
  .model({
    currentImageEntity: types.maybeNull(types.reference(ImageEntity)),

    imageEntities: types.optional(types.array(ImageEntity), []),
  })
  .views(self => ({
    get rotation() {
      return self.currentImageEntity.rotation;
    },
    set rotation(value) {
      self.currentImageEntity.setRotation(value);
    },

    get naturalWidth() {
      return self.currentImageEntity.naturalWidth;
    },
    set naturalWidth(value) {
      self.currentImageEntity.setNaturalWidth(value);
    },

    get naturalHeight() {
      return self.currentImageEntity.naturalHeight;
    },
    set naturalHeight(value) {
      self.currentImageEntity.setNaturalHeight(value);
    },

    get stageWidth() {
      return self.currentImageEntity.stageWidth;
    },
    set stageWidth(value) {
      self.currentImageEntity.setStageWidth(value);
    },

    get stageHeight() {
      return self.currentImageEntity.stageHeight;
    },
    set stageHeight(value) {
      self.currentImageEntity.setStageHeight(value);
    },

    get stageRatio() {
      return self.currentImageEntity.stageRatio;
    },
    set stageRatio(value) {
      self.currentImageEntity.setStageRatio(value);
    },

    get containerWidth() {
      return self.currentImageEntity.containerWidth;
    },
    set containerWidth(value) {
      self.currentImageEntity.setContainerWidth(value);
    },

    get containerHeight() {
      return self.currentImageEntity.containerHeight;
    },
    set containerHeight(value) {
      self.currentImageEntity.setContainerHeight(value);
    },

    get stageZoom() {
      return self.currentImageEntity.stageZoom;
    },
    set stageZoom(value) {
      self.currentImageEntity.setStageZoom(value);
    },

    get stageZoomX() {
      return self.currentImageEntity.stageZoomX;
    },
    set stageZoomX(value) {
      self.currentImageEntity.setStageZoomX(value);
    },

    get stageZoomY() {
      return self.currentImageEntity.stageZoomY;
    },
    set stageZoomY(value) {
      self.currentImageEntity.setStageZoomY(value);
    },

    get currentZoom() {
      return self.currentImageEntity.currentZoom;
    },
    set currentZoom(value) {
      self.currentImageEntity.setCurrentZoom(value);
    },

    get zoomScale() {
      return self.currentImageEntity.zoomScale;
    },
    set zoomScale(value) {
      self.currentImageEntity.setZoomScale(value);
    },

    get zoomingPositionX() {
      return self.currentImageEntity.zoomingPositionX;
    },
    set zoomingPositionX(value) {
      self.currentImageEntity.setZoomingPositionX(value);
    },

    get zoomingPositionY() {
      return self.currentImageEntity.zoomingPositionY;
    },
    set zoomingPositionY(value) {
      self.currentImageEntity.setZoomingPositionY(value);
    },

    get brightnessGrade() {
      return self.currentImageEntity.brightnessGrade;
    },
    set brightnessGrade(value) {
      self.currentImageEntity.setBrightnessGrade(value);
    },

    get contrastGrade() {
      return self.currentImageEntity.contrastGrade;
    },
    set contrastGrade(value) {
      self.currentImageEntity.setContrastGrade(value);
    },

    findImageEntity(index) {
      return self.imageEntities.find(currentImageEntity => currentImageEntity.index === index);
    },
  }));
