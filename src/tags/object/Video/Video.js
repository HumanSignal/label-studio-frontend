import { getRoot, types } from "mobx-state-tree";
import React from "react";

import { AnnotationMixin } from "../../../mixins/AnnotationMixin";
import ProcessAttrsMixin from "../../../mixins/ProcessAttrs";
import ObjectBase from "../Base";
import { SyncMixin } from "../../../mixins/SyncMixin";
import Types from "../../../core/Types";

/**
 * Video tag plays a simple video file. Use for video annotation tasks such as classification and transcription.
 *
 * Use with the following data types: video
 * @example
 * <!--Labeling configuration to display a video on the labeling interface-->
 * <View>
 *   <Video name="video" value="$video" />
 * </View>
 * @example
 * <!-- Video classification -->
 * <View>
 *   <Video name="video" value="$video" />
 *   <Choices name="ch" toName="video">
 *     <Choice value="Positive" />
 *     <Choice value="Negative" />
 *   </Choices>
 * </View>
 * @example
 * <!-- Video transcription -->
 * <View>
 *   <Video name="video" value="$video" />
 *   <TextArea name="ta" toName="video" />
 * </View>
 * @name Video
 * @meta_title Video Tag for Video Labeling
 * @meta_description Customize Label Studio with the Video tag for basic video annotation tasks for machine learning and data science projects.
 * @param {string} name Name of the element
 * @param {string} value URL of the video
 * @param {number} [frameRate=0.04] frame rate in seconds; default 1/25s
 * @param {string} [sync] object name to sync with
 * @param {boolean} [muted=false] muted video
 */

const TagAttrs = types.model({
  name: types.identifier,
  value: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  framerate: types.optional(types.string, "24"),
  muted: false,
});

const Model = types
  .model({
    type: "video",
    _value: types.optional(types.string, ""),
    // special flag to store labels inside result, but under original type
    // @todo make it able to be disabled
    mergeLabelsAndResults: true,
  })
  .volatile(() => ({
    errors: [],
    ref: React.createRef(),
    frame: 1,
    length: 1,
  }))
  .views(self => ({
    get store() {
      return getRoot(self);
    },

    get annotation() {
      return Types.getParentOfTypeString(self, "AnnotationStore")?.selected;
    },

    get regs() {
      return self.annotation?.regionStore.regions.filter(r => r.object === self) || [];
    },

    get currentFrame() {
      return self.ref.current?.position ?? 1;
    },

    control() {
      return self.annotation.toNames.get(self.name)?.find(s => !s.type.endsWith("labels"));
    },

    states() {
      return self.annotation.toNames.get(self.name)?.filter(s => s.type.endsWith("labels"));
    },

    activeStates() {
      const states = self.states();

      return states ? states.filter(c => c.isSelected === true) : null;
    },

    get hasStates() {
      const states = self.states();

      return states && states.length > 0;
    },
  }))
  .actions(self => ({
    afterCreate() {
      const { framerate } = self;

      if (!framerate) self.framerate = 24;
      else if (framerate < 1) self.framerate = 1 / framerate;
    },

    handleSyncSeek(time) {
      if (self.ref.current) {
        self.ref.current.currentTime = time;
      }
    },

    handleSyncPlay() {
      self.ref.current?.play();
    },

    handleSyncPause() {
      self.ref.current?.pause();
    },

    needsUpdate() {
      if (self.sync) {
        self.initSync();
        if (self.syncedObject?.type?.startsWith("audio")) {
          self.muted = true;
        }
      }
    },

    setLength(length) {
      self.length = length;
    },

    setOnlyFrame(frame) {
      self.frame = frame;
    },

    setFrame(frame) {
      self.frame = frame;
      self.ref.current.currentTime = frame / self.framerate;
      // trigger only here, this method already has side effects, so it would be controlled
      self.triggerSyncSeek(frame / self.framerate);
    },

    addRegion(data) {
      const control = self.control();

      const sequence = [
        {
          frame: self.frame,
          enabled: true,
          rotation: 0,
          ...data,
        },
      ];

      if (!control) {
        console.error("NO CONTROL");
        return;
      }

      const area = self.annotation.createResult({ sequence }, {}, control, self);

      // add labels
      self.activeStates().forEach(state => {
        area.setValue(state);
      });

      return area;
    },

    deleteRegion(id) {
      self.findRegion(id)?.deleteRegion();
    },

    findRegion(id) {
      return self.regs.find(reg => reg.cleanId === id);
    },
  }));

export const VideoModel = types.compose("VideoModel",
  SyncMixin,
  TagAttrs,
  ProcessAttrsMixin,
  ObjectBase,
  AnnotationMixin,
  Model,
);
