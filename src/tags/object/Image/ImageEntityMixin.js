import { types } from 'mobx-state-tree';
import { ImageEntity } from './ImageEntity';

export const ImageEntityMixin = types
  .model({
    imageEntity: types.maybeNull(types.reference(ImageEntity)),

    imageEntities: types.optional(types.array(ImageEntity), []),
  })
  .views(self => ({
    get rotation() {
      return self.imageEntity.rotation;
    },
    set rotation(value) {
      self.imageEntity.setRotation(value);
    },

    get naturalWidth() {
      return self.imageEntity.naturalWidth;
    },
    set naturalWidth(value) {
      self.imageEntity.setNaturalWidth(value);
    },

    get naturalHeight() {
      return self.imageEntity.naturalHeight;
    },
    set naturalHeight(value) {
      self.imageEntity.setNaturalHeight(value);
    },

    get stageWidth() {
      return self.imageEntity.stageWidth;
    },
    set stageWidth(value) {
      self.imageEntity.setStageWidth(value);
    },

    get stageHeight() {
      return self.imageEntity.stageHeight;
    },
    set stageHeight(value) {
      self.imageEntity.setStageHeight(value);
    },

    get stageRatio() {
      return self.imageEntity.stageRatio;
    },
    set stageRatio(value) {
      self.imageEntity.setStageRatio(value);
    },

    get containerWidth() {
      return self.imageEntity.containerWidth;
    },
    set containerWidth(value) {
      self.imageEntity.setContainerWidth(value);
    },

    get containerHeight() {
      return self.imageEntity.containerHeight;
    },
    set containerHeight(value) {
      self.imageEntity.setContainerHeight(value);
    },

    get stageZoom() {
      return self.imageEntity.stageZoom;
    },
    set stageZoom(value) {
      self.imageEntity.setStageZoom(value);
    },

    get stageZoomX() {
      return self.imageEntity.stageZoomX;
    },
    set stageZoomX(value) {
      self.imageEntity.setStageZoomX(value);
    },

    get stageZoomY() {
      return self.imageEntity.stageZoomY;
    },
    set stageZoomY(value) {
      self.imageEntity.setStageZoomY(value);
    },

    get currentZoom() {
      return self.imageEntity.currentZoom;
    },
    set currentZoom(value) {
      self.imageEntity.setCurrentZoom(value);
    },

    get zoomScale() {
      return self.imageEntity.zoomScale;
    },
    set zoomScale(value) {
      self.imageEntity.setZoomScale(value);
    },

    get zoomingPositionX() {
      return self.imageEntity.zoomingPositionX;
    },
    set zoomingPositionX(value) {
      self.imageEntity.setZoomingPositionX(value);
    },

    get zoomingPositionY() {
      return self.imageEntity.zoomingPositionY;
    },
    set zoomingPositionY(value) {
      self.imageEntity.setZoomingPositionY(value);
    },

    get brightnessGrade() {
      return self.imageEntity.brightnessGrade;
    },
    set brightnessGrade(value) {
      self.imageEntity.setBrightnessGrade(value);
    },

    get contrastGrade() {
      return self.imageEntity.contrastGrade;
    },
    set contrastGrade(value) {
      self.imageEntity.setContrastGrade(value);
    },

    findImageEntity(index) {
      return self.imageEntities.find(imageEntity => imageEntity.index === index);
    },
  }));
