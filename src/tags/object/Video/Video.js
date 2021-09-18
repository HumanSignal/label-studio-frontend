import { types } from "mobx-state-tree";
import React from "react";

import { AnnotationMixin } from "../../../mixins/AnnotationMixin";
import ProcessAttrsMixin from "../../../mixins/ProcessAttrs";
import ObjectBase from "../Base";
import { SyncMixin } from "../../../mixins/SyncMixin";

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
  framerate: types.optional(types.string, "0.04"),
  muted: false,
});

const Model = types
  .model({
    type: "video",
    _value: types.optional(types.string, ""),
  })
  .volatile(() => ({
    errors: [],
    ref: React.createRef(),
  }))
  .actions(self => ({
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
  }));

export const VideoModel = types.compose("VideoModel", SyncMixin, TagAttrs, ProcessAttrsMixin, ObjectBase, AnnotationMixin, Model);
